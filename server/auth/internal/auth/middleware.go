package auth

import (
	"net/http"
	"strings"
	"time"

	coreconstants "auth/internal/core/constants"
	coreutils "auth/internal/core/utils"

	"github.com/gin-gonic/gin"
)

type CookieConfig struct {
	Name     string
	Domain   string
	Path     string
	Secure   bool
	HTTPOnly bool
	SameSite http.SameSite
}

func AuthMiddleware(svc *Service, cookieCfg CookieConfig) gin.HandlerFunc {
	if cookieCfg.Path == "" {
		cookieCfg.Path = "/"
	}

	return func(c *gin.Context) {
		rawToken, err := c.Cookie(cookieCfg.Name)
		if err != nil || strings.TrimSpace(rawToken) == "" {
			clearCookie(c, cookieCfg)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid auth cookie"})
			return
		}

		user, session, err := svc.AuthenticateToken(c.Request.Context(), rawToken)
		if err != nil {
			clearCookie(c, cookieCfg)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session"})
			return
		}

		c.Set(coreconstants.ContextUserKey, user)
		c.Set(coreconstants.ContextSessionKey, session)
		c.Set(coreconstants.ContextTokenKey, rawToken)
		c.Next()
	}
}

func OptionalAuthMiddleware(svc *Service, cookieCfg CookieConfig) gin.HandlerFunc {
	if cookieCfg.Path == "" {
		cookieCfg.Path = "/"
	}

	return func(c *gin.Context) {
		rawToken, err := c.Cookie(cookieCfg.Name)
		if err != nil || strings.TrimSpace(rawToken) == "" {
			c.Next()
			return
		}

		user, session, err := svc.AuthenticateToken(c.Request.Context(), rawToken)
		if err != nil {
			clearCookie(c, cookieCfg)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session"})
			return
		}

		c.Set(coreconstants.ContextUserKey, user)
		c.Set(coreconstants.ContextSessionKey, session)
		c.Set(coreconstants.ContextTokenKey, rawToken)
		c.Next()
	}
}


func CurrentUser(c *gin.Context) (*User, bool) {
	val, exists := c.Get(coreconstants.ContextUserKey)
	if !exists {
		return nil, false
	}

	user, ok := val.(*User)
	return user, ok
}

func CurrentSession(c *gin.Context) (*Session, bool) {
	val, exists := c.Get(coreconstants.ContextSessionKey)
	if !exists {
		return nil, false
	}

	session, ok := val.(*Session)
	return session, ok
}

func CurrentToken(c *gin.Context) (string, bool) {
	val, exists := c.Get(coreconstants.ContextTokenKey)
	if !exists {
		return "", false
	}

	token, ok := val.(string)
	return token, ok
}

func setSessionCookie(c *gin.Context, cfg CookieConfig, value string, expiresAt time.Time) {
	if cfg.Path == "" {
		cfg.Path = "/"
	}

	maxAge := int(time.Until(expiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}

	c.SetSameSite(cfg.SameSite)
	c.SetCookie(cfg.Name, value, maxAge, cfg.Path, cfg.Domain, cfg.Secure, cfg.HTTPOnly)
}

func setStateCookie(c *gin.Context, cfg CookieConfig, value string, ttl time.Duration) {
	if cfg.Path == "" {
		cfg.Path = "/"
	}

	maxAge := int(ttl.Seconds())
	if maxAge <= 0 {
		maxAge = 300
	}

	c.SetSameSite(cfg.SameSite)
	c.SetCookie(cfg.Name, value, maxAge, cfg.Path, cfg.Domain, cfg.Secure, cfg.HTTPOnly)
}

func clearCookie(c *gin.Context, cfg CookieConfig) {
	if cfg.Path == "" {
		cfg.Path = "/"
	}

	c.SetSameSite(cfg.SameSite)
	c.SetCookie(cfg.Name, "", -1, cfg.Path, cfg.Domain, cfg.Secure, cfg.HTTPOnly)
}

func ParseSameSite(value string) http.SameSite {
	return coreutils.ParseSameSite(value)
}
