# GitHub integration

`/projects/new` uses the control-plane organization GitHub APIs through the same-origin `/api/github/*` proxy. Set server-only `KR0N_BACKEND_URL` to the API gateway URL (default `http://localhost:8080`).

Auth integration: `lib/github-api.js` deliberately owns no login or token storage. The auth owner can call `configureGitHubAuth(async () => ({ Authorization: \`Bearer ${accessToken}\` }))` during app initialization or adapt this client to their shared API client. Cookies are sent same-origin and forwarded to the gateway; the current gateway requires bearer authentication. Never send caller identity fields from the UI.

Configure the GitHub App Setup URL as `http://localhost:3000/github/callback` (use your frontend domain in production). This is distinct from the OAuth login callback `/callback`, which belongs to auth. Backend configuration requires `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_APP_STATE_SECRET`. Give the App repository contents read access. Credentials belong only in backend environment configuration.

Connection state is signed and checked against organization/user by the backend and compared to a sessionStorage value on callback. Org permission checks remain backend-owned. GitHub installation IDs remain strings in JavaScript to avoid int64 precision loss.

The picker lists installations and accessible repositories, browses branches/directories, disconnects installations, and saves the chosen source to `kr0n_github_project_draft` in localStorage. There is no project-creation/deployment API in the current backend; the UI explicitly presents this as a draft, not a deployed project.
