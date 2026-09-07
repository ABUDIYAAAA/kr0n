package templates

import (
	"bytes"
	"fmt"
	"html/template"
	"sync"
	texttemplate "text/template"
)

// RenderResult contains the rendered subject, HTML body, and plain text body.
type RenderResult struct {
	Subject  string
	HTMLBody string
	TextBody string
}

// TemplateDefinition encapsulates subject template along with HTML & Text body templates.
type TemplateDefinition struct {
	SubjectTemplate *texttemplate.Template
	HTMLTemplate    *template.Template
	TextTemplate    *texttemplate.Template
}

// TemplateManager provides thread-safe template registration and rendering.
type TemplateManager struct {
	mu        sync.RWMutex
	templates map[string]*TemplateDefinition
}

// NewTemplateManager initializes template manager with built-in templates.
func NewTemplateManager() *TemplateManager {
	tm := &TemplateManager{
		templates: make(map[string]*TemplateDefinition),
	}
	tm.registerBuiltins()
	return tm
}

// RegisterTemplate registers or updates a template definition in the registry.
func (tm *TemplateManager) RegisterTemplate(id, subjectTpl, htmlTpl, textTpl string) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	subT, err := texttemplate.New(id + "_subj").Parse(subjectTpl)
	if err != nil {
		return fmt.Errorf("invalid subject template for '%s': %w", id, err)
	}

	htmlT, err := template.New(id + "_html").Parse(htmlTpl)
	if err != nil {
		return fmt.Errorf("invalid HTML template for '%s': %w", id, err)
	}

	textT, err := texttemplate.New(id + "_text").Parse(textTpl)
	if err != nil {
		return fmt.Errorf("invalid text template for '%s': %w", id, err)
	}

	tm.templates[id] = &TemplateDefinition{
		SubjectTemplate: subT,
		HTMLTemplate:    htmlT,
		TextTemplate:    textT,
	}

	return nil
}

// Render renders the specified template identifier using passed dynamic context data.
func (tm *TemplateManager) Render(templateID string, data map[string]any) (*RenderResult, error) {
	tm.mu.RLock()
	def, exists := tm.templates[templateID]
	tm.mu.RUnlock()

	if !exists {
		// Fallback to custom/generic template if templateID is unknown
		tm.mu.RLock()
		def, exists = tm.templates["custom_email"]
		tm.mu.RUnlock()

		if !exists {
			return nil, fmt.Errorf("template '%s' not found", templateID)
		}
	}

	if data == nil {
		data = make(map[string]any)
	}

	var subjBuf bytes.Buffer
	if err := def.SubjectTemplate.Execute(&subjBuf, data); err != nil {
		return nil, fmt.Errorf("failed to render subject template: %w", err)
	}

	var htmlBuf bytes.Buffer
	if err := def.HTMLTemplate.Execute(&htmlBuf, data); err != nil {
		return nil, fmt.Errorf("failed to render HTML template: %w", err)
	}

	var textBuf bytes.Buffer
	if err := def.TextTemplate.Execute(&textBuf, data); err != nil {
		return nil, fmt.Errorf("failed to render text template: %w", err)
	}

	return &RenderResult{
		Subject:  subjBuf.String(),
		HTMLBody: htmlBuf.String(),
		TextBody: textBuf.String(),
	}, nil
}

func (tm *TemplateManager) registerBuiltins() {
	// 1. Email Verification Template
	_ = tm.RegisterTemplate(
		"email_verification",
		"Verify your email address - Kr0n",
		`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify Email</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #2b2d42;">Welcome to Kr0n, {{.username}}!</h2>
    <p>Please click the button below to verify your email address and activate your account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{.verification_url}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">Or copy and paste this link into your browser: <br><a href="{{.verification_url}}">{{.verification_url}}</a></p>
  </div>
</body>
</html>`,
		`Hello {{.username}},

Please verify your email address by clicking the link below:
{{.verification_url}}

Thank you,
Kr0n Team`,
	)

	// 2. Password Reset Template
	_ = tm.RegisterTemplate(
		"password_reset",
		"Reset your Kr0n Password",
		`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset Password</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2b2d42;">Password Reset Request</h2>
    <p>Hello {{.username}},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{.reset_url}}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">If you did not request a password reset, please ignore this email.</p>
  </div>
</body>
</html>`,
		`Hello {{.username}},

You requested a password reset. Click the link below to set a new password:
{{.reset_url}}

If you did not request this, please ignore this email.

Kr0n Team`,
	)

	// 3. Welcome Email Template
	_ = tm.RegisterTemplate(
		"welcome_email",
		"Welcome to Kr0n!",
		`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px;">
    <h2>Welcome to Kr0n, {{.username}}!</h2>
    <p>We're excited to have you onboard.</p>
  </div>
</body>
</html>`,
		`Hello {{.username}},

Welcome to Kr0n! We are excited to have you onboard.

Kr0n Team`,
	)

	// 4. Custom / Generic Fallback Template
	_ = tm.RegisterTemplate(
		"custom_email",
		"{{if .subject}}{{.subject}}{{else}}Notification - Kr0n{{end}}",
		`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div>{{if .body}}{{.body}}{{else}}{{.content}}{{end}}</div>
</body>
</html>`,
		`{{if .body}}{{.body}}{{else}}{{.content}}{{end}}`,
	)
}
