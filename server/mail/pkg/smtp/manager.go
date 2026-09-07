package smtp

import (
	"fmt"
	"log"
	"net/smtp"
	"sync"

	"mail.kron.com/internal/api/config"
)

// SMTPAccount holds credentials and configuration for a single SMTP server account.
type SMTPAccount struct {
	ID        string
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
}

// SMTPManager manages multiple SMTP provider accounts.
type SMTPManager struct {
	mu       sync.RWMutex
	accounts map[string]*SMTPAccount
}

// NewSMTPManager constructs a manager populated with the default SMTP account from runtime Config.
func NewSMTPManager(cfg *config.Config) *SMTPManager {
	mgr := &SMTPManager{
		accounts: make(map[string]*SMTPAccount),
	}

	defaultAcc := &SMTPAccount{
		ID:        "default",
		Host:      cfg.SMTPHost,
		Port:      cfg.SMTPPort,
		Username:  cfg.SMTPUsername,
		Password:  cfg.SMTPPassword,
		FromEmail: cfg.SMTPFromEmail,
		FromName:  cfg.SMTPFromName,
	}

	mgr.RegisterAccount(defaultAcc)
	return mgr
}

// RegisterAccount registers or updates an SMTP account in the registry pool.
func (m *SMTPManager) RegisterAccount(acc *SMTPAccount) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if acc.ID == "" {
		acc.ID = "default"
	}
	m.accounts[acc.ID] = acc
	log.Printf("[SMTP MANAGER] Registered SMTP account '%s' (%s:%d)", acc.ID, acc.Host, acc.Port)
}

// GetAccount retrieves an SMTP account by ID, falling back to 'default'.
func (m *SMTPManager) GetAccount(accountID string) (*SMTPAccount, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if accountID != "" {
		if acc, ok := m.accounts[accountID]; ok {
			return acc, nil
		}
	}

	if defaultAcc, ok := m.accounts["default"]; ok {
		return defaultAcc, nil
	}

	return nil, fmt.Errorf("no SMTP account configured for ID '%s'", accountID)
}

// SendMail sends an email using the specified SMTP account ID.
func (m *SMTPManager) SendMail(accountID, toEmail, subject, htmlContent, textContent string) error {
	acc, err := m.GetAccount(accountID)
	if err != nil {
		return err
	}

	// Dev Mode / Logger Mode fallback
	if acc.Host == "" || acc.Host == "localhost" {
		log.Printf("[SMTP LOG SENDER - Account '%s'] To: %s | Subject: %s | TextBody length: %d", acc.ID, toEmail, subject, len(textContent))
		return nil
	}

	auth := smtp.PlainAuth("", acc.Username, acc.Password, acc.Host)
	addr := fmt.Sprintf("%s:%d", acc.Host, acc.Port)

	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	subjectHeader := fmt.Sprintf("Subject: %s\n", subject)
	fromHeader := fmt.Sprintf("From: %s <%s>\n", acc.FromName, acc.FromEmail)
	toHeader := fmt.Sprintf("To: %s\n", toEmail)

	msg := []byte(fromHeader + toHeader + subjectHeader + mime + htmlContent)

	if err := smtp.SendMail(addr, auth, acc.FromEmail, []string{toEmail}, msg); err != nil {
		return fmt.Errorf("failed to send email via SMTP account '%s': %w", acc.ID, err)
	}

	log.Printf("[SMTP MANAGER] Successfully sent email to %s using SMTP account '%s'", toEmail, acc.ID)
	return nil
}
