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

	"github.com/google/uuid"

	coreutils "auth/internal/core/utils"
)

type Service struct {
	repo       *Repository
	sessionTTL time.Duration
}

func NewService(repo *Repository, sessionTTL time.Duration) *Service {
	if sessionTTL <= 0 {
		sessionTTL = 30 * 24 * time.Hour
	}

	return &Service{repo: repo, sessionTTL: sessionTTL}
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

func (s *Service) HandleOAuthLogin(ctx context.Context, provider string, in OAuthCallbackRequest, ua, ip string) (*LoginResponse, string, error) {
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
			user, err = s.repo.CreateUser(ctx, in.Email, name, avatar)
			if err != nil {
				return nil, "", err
			}
		}

		err = s.repo.CreateOAuthAccount(ctx, user.ID, provider, in.ProviderUserID)
		if err != nil {
			return nil, "", err
		}
	} else {
		user, err = s.repo.GetUser(ctx, acc.UserID)
		if err != nil {
			return nil, "", err
		}
	}

	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}

	tokenHash := hashToken(token)
	ipValue := coreutils.NormalizeIP(ip)
	uaValue := coreutils.NullableString(ua)

	savedSession, err := s.repo.UpsertSessionByIP(ctx, &Session{
		UserID:    user.ID,
		Token:     tokenHash,
		UserAgent: uaValue,
		IPAddress: ipValue,
		ExpiresAt: time.Now().UTC().Add(s.sessionTTL),
	})
	if err != nil {
		return nil, "", err
	}

	userResp := mapUserResponse(user)

	return &LoginResponse{
		User: userResp,
		Session: SessionResponse{
			ID:        savedSession.ID,
			UserID:    savedSession.UserID,
			UserAgent: savedSession.UserAgent,
			IPAddress: savedSession.IPAddress,
			ExpiresAt: savedSession.ExpiresAt,
			CreatedAt: savedSession.CreatedAt,
			UpdatedAt: savedSession.UpdatedAt,
		},
	}, token, nil
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
