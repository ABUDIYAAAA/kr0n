package auth

import (
	"github.com/go-chi/chi/v5"
)

// AuthMiddlewareFunc represents an authentication middleware constructor.
type AuthMiddlewareFunc func(next httpHandler) httpHandler
type httpHandler = func(w any, r any)

// RegisterRoutes registers all public and authenticated auth endpoints onto the router.
func RegisterRoutes(r chi.Router, handler *Handler, authMiddleware func(chi.Router) chi.Router) {
	// Public Endpoints
	r.Group(func(public chi.Router) {
		public.Post("/signup", handler.Signup)
		public.Post("/login", handler.Login)
		public.Post("/refresh", handler.Refresh)
		public.Get("/verify-email", handler.VerifyEmail)
		public.Post("/verify-email", handler.VerifyEmail)
		public.Post("/resend-verification", handler.ResendVerification)
		public.Post("/forgot-password", handler.ForgotPassword)
		public.Post("/reset-password", handler.ResetPassword)

		// OAuth
		public.Get("/oauth/{provider}/url", handler.GetOAuthURL)
		public.Get("/oauth/{provider}/callback", handler.HandleOAuthCallback)
		public.Post("/oauth/{provider}/callback", handler.HandleOAuthCallback)
	})

	// Protected Endpoints (Requires valid JWT & active Redis session check)
	r.Group(func(protected chi.Router) {
		if authMiddleware != nil {
			protected = authMiddleware(protected)
		}

		protected.Get("/me", handler.GetMe)
		protected.Patch("/username", handler.UpdateUsername)
		protected.Post("/logout", handler.Logout)

		// Session management
		protected.Get("/sessions", handler.ListSessions)
		protected.Delete("/sessions/{id}", handler.RevokeSession)
		protected.Delete("/sessions", handler.RevokeAllOtherSessions)
	})
}
