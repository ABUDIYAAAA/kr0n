package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	coreutils "auth/internal/core/utils"
)

type Service struct {
	repo                 *Repository
	sessionTTL           time.Duration
	emailVerificationTTL time.Duration
	emailSender          EmailSender
}

type ServiceConfig struct {
	SessionTTL           time.Duration
	EmailVerificationTTL time.Duration
	EmailSender          EmailSender
}

type VerificationEmailPayload struct {
	Email string
	Name  *string
	Token string
}

type EmailSender interface {
	SendVerificationEmail(ctx context.Context, payload VerificationEmailPayload) error
}

type NoopEmailSender struct{}

func (NoopEmailSender) SendVerificationEmail(ctx context.Context, payload VerificationEmailPayload) error {
	return nil
}

const (
	minPasswordLength = 10
	maxPasswordLength = 128
)

func NewService(repo *Repository, cfg ServiceConfig) *Service {
	sessionTTL := cfg.SessionTTL
	if sessionTTL <= 0 {
		sessionTTL = 30 * 24 * time.Hour
	}

	verificationTTL := cfg.EmailVerificationTTL
	if verificationTTL <= 0 {
		verificationTTL = 24 * time.Hour
	}

	sender := cfg.EmailSender
	if sender == nil {
		sender = NoopEmailSender{}
	}

	return &Service{
		repo:                 repo,
		sessionTTL:           sessionTTL,
		emailVerificationTTL: verificationTTL,
		emailSender:          sender,
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b), err
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (s *Service) HandleOAuthLogin(ctx context.Context, provider string, in OAuthCallbackRequest, tokens OAuthTokens, ua, ip string) (*LoginResponse, string, error) {
	in.Email = normalizeEmail(in.Email)
	acc, err := s.repo.GetOAuthAccount(ctx, provider, in.ProviderUserID)

	var user *User

	if err != nil {
		if !errors.Is(err, ErrNotFound) {
			return nil, "", err
		}

		user, err = s.repo.GetUserByEmail(ctx, in.Email)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, "", err
		}

		if errors.Is(err, ErrNotFound) {
			name := coreutils.NullableString(in.Name)
			avatar := coreutils.NullableString(in.AvatarURL)
			user, err = s.repo.CreateUser(ctx, in.Email, name, avatar, in.EmailVerified)
			if err != nil {
				return nil, "", err
			}
		} else if in.EmailVerified && !user.EmailVerified {
			if err := s.repo.UpdateUserEmailVerified(ctx, user.ID, true); err != nil {
				return nil, "", err
			}
			user.EmailVerified = true
		}

		err = s.repo.UpsertOAuthAccount(ctx, OAuthAccount{
			UserID:         user.ID,
			Provider:       provider,
			ProviderUserID: in.ProviderUserID,
		}, tokens)
		if err != nil {
			return nil, "", err
		}
	} else {
		user, err = s.repo.GetUser(ctx, acc.UserID)
		if err != nil {
			return nil, "", err
		}

		if err := s.repo.UpsertOAuthAccount(ctx, OAuthAccount{
			UserID:         user.ID,
			Provider:       provider,
			ProviderUserID: in.ProviderUserID,
		}, tokens); err != nil {
			return nil, "", err
		}
		if in.EmailVerified && !user.EmailVerified {
			if err := s.repo.UpdateUserEmailVerified(ctx, user.ID, true); err != nil {
				return nil, "", err
			}
			user.EmailVerified = true
		}
	}

	savedSession, token, err := s.createSession(ctx, user.ID, ua, ip)
	if err != nil {
		return nil, "", err
	}

	return &LoginResponse{
		User:    mapUserResponse(user),
		Session: mapSessionResponse(savedSession),
	}, token, nil
}

func (s *Service) HandleOAuthConnect(ctx context.Context, userID uuid.UUID, provider string, in OAuthCallbackRequest, tokens OAuthTokens) error {
	acc, err := s.repo.GetOAuthAccount(ctx, provider, in.ProviderUserID)
	if err == nil {
		if acc.UserID != userID {
			return ErrConflict
		}
		return s.repo.UpsertOAuthAccount(ctx, OAuthAccount{
			UserID:         userID,
			Provider:       provider,
			ProviderUserID: in.ProviderUserID,
		}, tokens)
	}
	if !errors.Is(err, ErrNotFound) {
		return err
	}

	if _, err := s.repo.GetOAuthAccountByUserAndProvider(ctx, userID, provider); err == nil {
		return ErrProviderAlreadyConnected
	} else if !errors.Is(err, ErrNotFound) {
		return err
	}

	return s.repo.UpsertOAuthAccount(ctx, OAuthAccount{
		UserID:         userID,
		Provider:       provider,
		ProviderUserID: in.ProviderUserID,
	}, tokens)
}

func (s *Service) SignupWithPassword(ctx context.Context, email, password string, name *string) (*User, error) {
	email = normalizeEmail(email)
	if email == "" {
		return nil, ErrInvalidInput
	}
	if err := validatePassword(password); err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	verificationToken, err := generateToken()
	if err != nil {
		return nil, err
	}

	verificationHash := hashToken(verificationToken)
	expiresAt := time.Now().UTC().Add(s.emailVerificationTTL)

	user, err := s.repo.CreateUserWithPassword(ctx, email, name, string(hash), false, verificationHash, expiresAt)
	if err != nil {
		return nil, err
	}

	_ = s.emailSender.SendVerificationEmail(ctx, VerificationEmailPayload{
		Email: user.Email,
		Name:  user.Name,
		Token: verificationToken,
	})

	return user, nil
}

func (s *Service) LoginWithPassword(ctx context.Context, email, password, ua, ip string) (*LoginResponse, string, error) {
	email = normalizeEmail(email)
	if email == "" || strings.TrimSpace(password) == "" {
		return nil, "", ErrInvalidCredentials
	}

	user, hash, err := s.repo.GetUserWithPasswordHashByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	if !user.EmailVerified {
		return nil, "", ErrEmailNotVerified
	}

	savedSession, token, err := s.createSession(ctx, user.ID, ua, ip)
	if err != nil {
		return nil, "", err
	}

	return &LoginResponse{
		User:    mapUserResponse(user),
		Session: mapSessionResponse(savedSession),
	}, token, nil
}

func (s *Service) RequestEmailVerification(ctx context.Context, email string) error {
	email = normalizeEmail(email)
	if email == "" {
		return nil
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil
		}
		return err
	}

	if user.EmailVerified {
		return nil
	}

	token, err := generateToken()
	if err != nil {
		return err
	}

	if err := s.repo.ReplaceEmailVerificationToken(ctx, user.ID, hashToken(token), time.Now().UTC().Add(s.emailVerificationTTL)); err != nil {
		return err
	}

	_ = s.emailSender.SendVerificationEmail(ctx, VerificationEmailPayload{
		Email: user.Email,
		Name:  user.Name,
		Token: token,
	})

	return nil
}

func (s *Service) VerifyEmail(ctx context.Context, token string) error {
	if strings.TrimSpace(token) == "" {
		return ErrInvalidVerificationToken
	}

	_, err := s.repo.VerifyEmailToken(ctx, hashToken(token))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return ErrInvalidVerificationToken
		}
		return err
	}

	return nil
}

func (s *Service) createSession(ctx context.Context, userID uuid.UUID, ua, ip string) (*Session, string, error) {
	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}

	tokenHash := hashToken(token)
	ipValue := coreutils.NormalizeIP(ip)
	uaValue := coreutils.NullableString(ua)

	savedSession, err := s.repo.UpsertSessionByIP(ctx, &Session{
		UserID:    userID,
		Token:     tokenHash,
		UserAgent: uaValue,
		IPAddress: ipValue,
		ExpiresAt: time.Now().UTC().Add(s.sessionTTL),
	})
	if err != nil {
		return nil, "", err
	}

	return savedSession, token, nil
}

func (s *Service) AuthenticateToken(ctx context.Context, rawToken string) (*User, *Session, error) {
	token := strings.TrimSpace(rawToken)
	if token == "" {
		return nil, nil, ErrNotFound
	}

	tokenHash := hashToken(token)
	session, user, err := s.repo.GetSessionAndUserByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, nil, err
	}

	return user, session, nil
}

func (s *Service) LogoutByToken(ctx context.Context, rawToken string) error {
	token := strings.TrimSpace(rawToken)
	if token == "" {
		return nil
	}

	tokenHash := hashToken(token)
	return s.repo.DeleteSessionByTokenHash(ctx, tokenHash)
}

func (s *Service) GetSessions(ctx context.Context, userID uuid.UUID) ([]SessionResponse, error) {
	sessions, err := s.repo.ListSessionsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	res := make([]SessionResponse, len(sessions))
	for i, sess := range sessions {
		res[i] = SessionResponse{
			ID:        sess.ID,
			UserID:    sess.UserID,
			UserAgent: sess.UserAgent,
			IPAddress: sess.IPAddress,
			ExpiresAt: sess.ExpiresAt,
			CreatedAt: sess.CreatedAt,
			UpdatedAt: sess.UpdatedAt,
		}
	}
	return res, nil
}

func (s *Service) LogoutSession(ctx context.Context, sessionID, userID uuid.UUID) error {
	return s.repo.DeleteSessionByID(ctx, sessionID, userID)
}

func (s *Service) LogoutAllSessions(ctx context.Context, userID uuid.UUID) error {
	return s.repo.DeleteAllSessionsByUserID(ctx, userID)
}

func mapSessionResponse(sess *Session) SessionResponse {
	return SessionResponse{
		ID:        sess.ID,
		UserID:    sess.UserID,
		UserAgent: sess.UserAgent,
		IPAddress: sess.IPAddress,
		ExpiresAt: sess.ExpiresAt,
		CreatedAt: sess.CreatedAt,
		UpdatedAt: sess.UpdatedAt,
	}
}

func mapUserResponse(u *User) UserResponse {
	return UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		Name:          u.Name,
		AvatarURL:     u.AvatarURL,
		EmailVerified: u.EmailVerified,
		CreatedAt:     u.CreatedAt,
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validatePassword(password string) error {
	password = strings.TrimSpace(password)
	if len(password) < minPasswordLength || len(password) > maxPasswordLength {
		return ErrInvalidInput
	}

	var hasLetter bool
	var hasNumber bool
	for _, r := range password {
		if unicode.IsLetter(r) {
			hasLetter = true
		} else if unicode.IsNumber(r) {
			hasNumber = true
		}
	}

	if !hasLetter || !hasNumber {
		return ErrInvalidInput
	}

	return nil
}
