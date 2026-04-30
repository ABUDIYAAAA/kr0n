package main

import (
	"auth/internal/auth"
	"auth/internal/config"
	"auth/internal/database"
	"auth/internal/health"
	"auth/internal/producer"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

// @title           Auth API
// @version         1.0
// @description     Auth API for kr0n service.
// @BasePath        /
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Unable to load config:", err)
	}

	pool, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Unable to connect to db:", err)
	}
	defer pool.Close()

	r := gin.Default()
	health.RegisterRoutes(r, pool)
	cookieCfg := auth.CookieConfig{
		Name:     cfg.AuthCookieName,
		Domain:   cfg.AuthCookieDomain,
		Path:     "/",
		Secure:   cfg.AuthCookieSecure,
		HTTPOnly: true,
		SameSite: auth.ParseSameSite(cfg.AuthCookieSameSite),
	}

	googleCfg := auth.GoogleOAuthConfig{
		ClientID:     cfg.GoogleOAuthClientID,
		ClientSecret: cfg.GoogleOAuthClientSecret,
		RedirectURL:  cfg.GoogleOAuthRedirectURL,
		Scopes:       strings.Fields(cfg.GoogleOAuthScopes),
	}

	githubAppCfg := auth.GitHubAppConfig{
		AppID:          cfg.GitHubAppID,
		AppName:        cfg.GitHubAppName,
		ClientID:       cfg.GitHubAppClientID,
		ClientSecret:   cfg.GitHubAppClientSecret,
		RedirectURL:    cfg.GitHubAppRedirectURL,
		PrivateKeyPath: cfg.GitHubAppPrivateKeyPath,
		Scopes:         strings.Fields(cfg.GitHubAppScopes),
	}

	emailProducer := producer.New(producer.Config{
		Broker:    cfg.EmailKafkaBroker,
		Topic:     cfg.EmailKafkaTopic,
		PublicURL: cfg.AuthPublicURL,
		AppName:   "kr0n-auth",
	})
	defer emailProducer.Close()

	authModuleCfg := auth.ModuleConfig{
		SessionTTL:           cfg.AuthSessionTTL,
		EmailVerificationTTL: cfg.AuthEmailVerificationTTL,
		EmailSender:          emailProducer,
		SessionCookie:        cookieCfg,
		GoogleOAuth:          googleCfg,
		GitHubApp:            githubAppCfg,
	}

	auth.RegisterRoutes(r, pool, authModuleCfg)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
