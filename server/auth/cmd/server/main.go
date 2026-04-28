package main

import (
	"auth/internal/auth"
	"auth/internal/config"
	"auth/internal/database"
	"auth/internal/health"
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
	if cookieCfg.Name == "" {
		cookieCfg.Name = "forms_session"
	}
	if cookieCfg.Path == "" {
		cookieCfg.Path = "/"
	}
	if !cookieCfg.HTTPOnly {
		cookieCfg.HTTPOnly = true
	}

	googleCfg := auth.GoogleOAuthConfig{
		ClientID:     cfg.GoogleOAuthClientID,
		ClientSecret: cfg.GoogleOAuthClientSecret,
		RedirectURL:  cfg.GoogleOAuthRedirectURL,
		Scopes:       strings.Fields(cfg.GoogleOAuthScopes),
	}

	authRepo := auth.NewRepository(pool)
	authSvc := auth.NewService(authRepo, cfg.AuthSessionTTL)
	authHandler := auth.NewHandler(authSvc, cookieCfg, googleCfg)
	authMiddleware := auth.AuthMiddleware(authSvc, cookieCfg)

	auth.RegisterRoutesWithHandler(r, authHandler, authMiddleware)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
