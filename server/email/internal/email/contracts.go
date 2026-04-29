package email

import (
	"fmt"
	"strings"
)

var AllowedEventTemplates = map[Kind]string{
	KindVerification:  "verification",
	KindPasswordReset: "password_reset",
	KindWelcome:       "welcome",
	KindNotification:  "notification",
}

func IsAllowedEvent(kind Kind) bool {
	_, ok := AllowedEventTemplates[kind]
	return ok
}

func IsAllowedTemplate(kind Kind, template string) bool {
	expected, ok := AllowedEventTemplates[kind]
	if !ok {
		return false
	}
	return strings.TrimSpace(expected) == strings.TrimSpace(template)
}

func RejectReason(envelope Envelope) error {
	if !IsAllowedEvent(envelope.Kind) {
		return fmt.Errorf("%w: unsupported kind %q", ErrRejectedEvent, envelope.Kind)
	}
	if !IsAllowedTemplate(envelope.Kind, envelope.Template) {
		return fmt.Errorf("%w: unsupported template %q for kind %q", ErrRejectedEvent, envelope.Template, envelope.Kind)
	}
	return nil
}
