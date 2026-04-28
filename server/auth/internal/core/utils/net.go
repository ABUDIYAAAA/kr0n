package utils

import (
	"net"
	"strings"
)

func NormalizeClientIP(ip string) string {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return ""
	}

	host, _, err := net.SplitHostPort(ip)
	if err == nil {
		return host
	}

	return ip
}

func NormalizeIP(ip string) *string {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		ip = "0.0.0.0"
	}
	return &ip
}
