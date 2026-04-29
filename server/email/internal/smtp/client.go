package smtp

import (
	"crypto/tls"
	"fmt"
	"strconv"
	"strings"
	"time"

	"email/internal/config"

	"gopkg.in/gomail.v2"
)

type Client struct {
	dialer *gomail.Dialer
	from   string
}

func NewClient(cfg *config.Config) *Client {
	port, err := strconv.Atoi(strings.TrimSpace(cfg.SmtpPort))
	if err != nil || port <= 0 {
		port = 587
	}

	dialer := gomail.NewDialer(cfg.SmtpHost, port, cfg.SmtpUser, cfg.SmtpPass)
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: cfg.SmtpInsecureSkipVerify}
	if !cfg.SmtpTLSEnabled {
		dialer.SSL = false
	}

	return &Client{dialer: dialer, from: cfg.SmtpFrom}
}

type Message struct {
	To      []string
	Cc      []string
	Bcc     []string
	Subject string
	HTML    string
	Text    string
	ReplyTo string
}

func (c *Client) From() string {
	return c.from
}

func (c *Client) Send(message Message) error {
	if len(message.To) == 0 {
		return fmt.Errorf("missing recipient")
	}
	if strings.TrimSpace(message.Subject) == "" {
		return fmt.Errorf("missing subject")
	}

	m := gomail.NewMessage()
	m.SetHeader("From", c.from)
	m.SetHeader("To", message.To...)
	if len(message.Cc) > 0 {
		m.SetHeader("Cc", message.Cc...)
	}
	if len(message.Bcc) > 0 {
		m.SetHeader("Bcc", message.Bcc...)
	}
	if strings.TrimSpace(message.ReplyTo) != "" {
		m.SetHeader("Reply-To", message.ReplyTo)
	}
	m.SetHeader("Subject", message.Subject)

	body := strings.TrimSpace(message.HTML)
	contentType := "text/html"
	if body == "" {
		body = message.Text
		contentType = "text/plain"
	}
	m.SetBody(contentType, body)
	if strings.TrimSpace(message.HTML) != "" && strings.TrimSpace(message.Text) != "" {
		m.AddAlternative("text/plain", message.Text)
	}

	return c.dialer.DialAndSend(m)
}

func (c *Client) Verify() error {
	conn, err := c.dialer.Dial()
	if err != nil {
		return err
	}
	return conn.Close()
}

func (c *Client) Timeout() time.Duration {
	return 0
}
