package utils

import (
	"fmt"
)

// FormatGitHubAppInstallURL constructs the GitHub App installation URL with an optional state.
func FormatGitHubAppInstallURL(appName, state string) string {
	url := fmt.Sprintf("https://github.com/apps/%s/installations/new", appName)
	if state != "" {
		url += fmt.Sprintf("?state=%s", state)
	}
	return url
}
