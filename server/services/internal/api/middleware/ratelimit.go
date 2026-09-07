package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"services.kron.com/pkg/response"
)

func RateLimiterMiddleware(redisClient *redis.Client, requestsPerWindow int, windowDuration time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if redisClient == nil {
				next.ServeHTTP(w, r)
				return
			}

			clientIP := r.RemoteAddr
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				clientIP = xff
			}

			key := fmt.Sprintf("ratelimit:%s:%s", r.URL.Path, clientIP)
			ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer cancel()

			count, err := redisClient.Incr(ctx, key).Result()
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			if count == 1 {
				redisClient.Expire(ctx, key, windowDuration)
			}

			if count > int64(requestsPerWindow) {
				response.ErrorResponse(w, http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", nil)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
