// Auth owns credentials. It can supply a bearer token here, or use same-origin cookies.
let authHeaders = async () => ({});
export function configureGitHubAuth(provider) { authHeaders = provider; }
export async function githubApi(path, options = {}) {
  const response = await fetch(`/api/github/${path}`, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...await authHeaders(), ...options.headers }, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to access GitHub repositories.' : data.error || 'GitHub request failed');
  return data;
}
