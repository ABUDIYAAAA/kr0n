// Auth owns credentials. It can supply a bearer token here, or use same-origin cookies.
let authHeaders = async () => ({});
export function configureGitHubAuth(provider) { authHeaders = provider; }
export async function githubApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...await authHeaders(), ...options.headers };
  const response = await fetch(`/api/github/${path}`, { ...options, credentials: 'include', headers, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to access GitHub repositories.' : data.error || data.message || 'GitHub request failed');
  return data;
}
