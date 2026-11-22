import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configureAuthTransport,
  refreshTokens,
  getOrganizations,
  getSessions,
  getRoles,
  addMember,
  getMe,
  login,
  logout,
  register,
  confirmPasswordReset,
  changePassword,
  loginWithOAuth,
  completeOAuthCallback,
  clearStoredAuth,
  getStoredUser,
} from '../auth.js';

function installMockBrowserEnv() {
  const local = new Map();
  const session = new Map();
  let cookieJar = '';

  globalThis.window = {
    location: { origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.localStorage = {
    getItem: (k) => (local.has(k) ? local.get(k) : null),
    setItem: (k, v) => local.set(k, String(v)),
    removeItem: (k) => local.delete(k),
    clear: () => local.clear(),
  };
  globalThis.sessionStorage = {
    getItem: (k) => (session.has(k) ? session.get(k) : null),
    setItem: (k, v) => session.set(k, String(v)),
    removeItem: (k) => session.delete(k),
    clear: () => session.clear(),
  };
  globalThis.document = {
    get cookie() {
      return cookieJar;
    },
    set cookie(val) {
      cookieJar += `${val}; `;
    },
  };

  return { local, session, getCookies: () => cookieJar };
}

test('refreshTokens calls POST /api/v1/auth/refresh without requiring localStorage tokens', async () => {
  installMockBrowserEnv();
  clearStoredAuth();

  const calls = [];
  configureAuthTransport({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    },
  });

  const res = await refreshTokens();
  assert.equal(res.status, 'ok');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v1/auth/refresh');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.body, undefined);
});

test('authenticated endpoints make network requests with HttpOnly cookies even when localStorage is empty', async () => {
  installMockBrowserEnv();
  clearStoredAuth();

  const calls = [];
  configureAuthTransport({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (url === '/api/v1/orgs') {
        return new Response(JSON.stringify({ organizations: [{ id: 'org_live', name: 'Live Org' }] }), { status: 200 });
      }
      if (url === '/api/v1/auth/sessions') {
        return new Response(JSON.stringify({ sessions: [{ id: 'sess_live' }] }), { status: 200 });
      }
      if (url === '/api/v1/roles') {
        return new Response(JSON.stringify({ roles: [{ id: 'owner', permissions: ['org:read'] }] }), { status: 200 });
      }
      if (url === '/api/v1/orgs/org_live/members' && init.method === 'POST') {
        return new Response(JSON.stringify({ user_id: 'u_2', email: 'teammate@kr0n.dev', role_id: 'member' }), { status: 201 });
      }
      return new Response('{}', { status: 200 });
    },
  });

  const orgs = await getOrganizations();
  const sessions = await getSessions();
  const roles = await getRoles();
  const added = await addMember('org_live', 'teammate@kr0n.dev', 'member');

  assert.equal(orgs.length, 1);
  assert.equal(orgs[0].id, 'org_live');
  assert.equal(sessions.length, 1);
  assert.equal(roles[0].id, 'owner');
  assert.equal(added.email, 'teammate@kr0n.dev');
});

test('login stores user profile without writing non-HttpOnly kr0n_token cookies or localStorage tokens', async () => {
  const env = installMockBrowserEnv();
  clearStoredAuth();

  configureAuthTransport({
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          user: { id: 'usr_1', email: 'ada@kr0n.dev', display_name: 'Ada', status: 'active' },
        }),
        { status: 200 }
      ),
  });

  await login('ada@kr0n.dev', 'validPassword123');

  assert.equal(getStoredUser()?.email, 'ada@kr0n.dev');
  assert.equal(getStoredUser()?.displayName, 'Ada');
  assert.equal(getStoredUser()?.display_name, 'Ada');
  assert.equal(env.local.has('kr0n_auth_tokens'), false);
  assert.equal(env.getCookies().includes('kr0n_token=cookie-session'), false);
});

test('getMe does not cache stale responses after resolution and clears state on 401', async () => {
  installMockBrowserEnv();
  clearStoredAuth();

  let callCount = 0;
  configureAuthTransport({
    fetchImpl: async (url) => {
      if (url === '/api/v1/auth/refresh') {
        return new Response(JSON.stringify({ message: 'no refresh' }), { status: 401 });
      }
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ id: 'usr_1', email: 'first@kr0n.dev' }), { status: 200 });
      }
      return new Response(JSON.stringify({ message: 'unauthenticated' }), { status: 401 });
    },
  });

  const first = await getMe();
  assert.equal(first.email, 'first@kr0n.dev');
  assert.equal(getStoredUser()?.email, 'first@kr0n.dev');

  // Immediate subsequent call should hit backend (no 1500ms stale timer)
  const second = await getMe();
  assert.equal(second, null);
  assert.equal(getStoredUser(), null);
});

test('completeOAuthCallback succeeds when gateway 302-redirects to HTML landing page and sets HttpOnly cookies', async () => {
  installMockBrowserEnv();
  clearStoredAuth();

  const calls = [];
  configureAuthTransport({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (url.startsWith('/api/v1/auth/github/start')) {
        return new Response(
          JSON.stringify({
            authorize_url: 'https://github.com/login/oauth/authorize?state=st_123',
            state: 'st_123',
            code_verifier: 'verifier_xyz',
          }),
          { status: 200 }
        );
      }
      if (url.startsWith('/api/v1/auth/github/callback')) {
        // Simulate fetch() following the gateway's 302 Found -> http://localhost:3000/ (HTML body)
        return new Response('<!DOCTYPE html><html><body>KR0N</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      if (url === '/api/v1/me') {
        return new Response(
          JSON.stringify({ id: 'usr_oauth', email: 'oauth@kr0n.dev', display_name: 'OAuth User' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 200 });
    },
  });

  await loginWithOAuth('github', { redirect: '/projects/new' });
  assert.equal(calls[0].url, '/api/v1/auth/github/start');

  const result = await completeOAuthCallback('github', 'code_abc', 'st_123');
  assert.equal(result.user.email, 'oauth@kr0n.dev');
  assert.equal(result.redirect, '/projects/new');
  assert.equal(getStoredUser()?.id, 'usr_oauth');
});

test('register, confirmPasswordReset, and changePassword enforce 8..72 UTF-8 byte password policy and 1..100 char display name policy', async () => {
  installMockBrowserEnv();
  configureAuthTransport({
    fetchImpl: async () => new Response('{}', { status: 200 }),
  });

  await assert.rejects(
    () => register({ email: 'a@b.c', password: 'a'.repeat(73), displayName: 'Ada' }),
    /72 UTF-8 bytes/
  );
  await assert.rejects(
    () => register({ email: 'a@b.c', password: 'validPassword123', displayName: 'x'.repeat(101) }),
    /100 characters/
  );
  await assert.rejects(
    () => confirmPasswordReset('tok_1', 'short'),
    /at least 8 characters/
  );
  await assert.rejects(
    () => changePassword('oldPass123', '🔐'.repeat(19)),
    /72 UTF-8 bytes/
  );
});
