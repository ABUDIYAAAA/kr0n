package email

import "errors"

var (
	ErrAlreadyDelivered = errors.New("email already delivered")
	ErrInvalidEnvelope  = errors.New("invalid email envelope")
	ErrRejectedEvent    = errors.New("rejected email event")
)
