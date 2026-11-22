import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createApiClient,
  validatePasswordPolicy,
  validateDisplayNamePolicy,
  getSafeRedirect,
} from '../api-client.js';

test('createApiClient sends credentials: include and parses JSON responses', async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: 'usr_1', email: 'dev@kr0n.dev' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const data = await client.apiRequest('/api/v1/me');
  assert.equal(data.id, 'usr_1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v1/me');
  assert.equal(calls[0].init.credentials, 'include');
});

test('createApiClient automatically refreshes on 401 with an empty POST body and retries once (single-flight)', async () => {
  const calls = [];
  let refreshed = false;

  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (url === '/api/v1/auth/refresh') {
        refreshed = true;
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      }
      if (!refreshed) {
        return new Response(JSON.stringify({ message: 'token expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ organizations: [{ id: 'org_1' }] }), { status: 200 });
    },
  });

  // Fire two concurrent 401 requests to verify single-flight refresh deduplication
  const [resA, resB] = await Promise.all([
    client.apiRequest('/api/v1/orgs'),
    client.apiRequest('/api/v1/auth/sessions'),
  ]);

  assert.equal(resA.organizations[0].id, 'org_1');
  assert.equal(resB.organizations[0].id, 'org_1');

  const refreshCalls = calls.filter((c) => c.url === '/api/v1/auth/refresh');
  assert.equal(refreshCalls.length, 1);
  assert.equal(refreshCalls[0].init.method, 'POST');
  assert.equal(refreshCalls[0].init.credentials, 'include');
  assert.equal(refreshCalls[0].init.body, undefined);
});

test('createApiClient calls onUnauthorized and throws when 401 refresh fails', async () => {
  let unauthorizedCount = 0;
  const client = createApiClient({
    onUnauthorized: () => {
      unauthorizedCount += 1;
    },
    fetchImpl: async (url) => {
      if (url === '/api/v1/auth/refresh') {
        return new Response(JSON.stringify({ message: 'refresh token expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ message: 'unauthenticated' }), { status: 401 });
    },
  });

  await assert.rejects(
    () => client.apiRequest('/api/v1/me'),
    (err) => err.status === 401 && err.message === 'unauthenticated'
  );
  assert.ok(unauthorizedCount >= 1);
});

test('createApiClient marks 429 responses as rateLimited', async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ message: 'rate limit exceeded', code: 8 }), { status: 429 }),
  });

  await assert.rejects(
    () => client.apiRequest('/api/v1/auth/resend-verification', { method: 'POST', body: { email: 'a@b.c' } }),
    (err) => err.status === 429 && err.rateLimited === true && err.code === 8
  );
});

test('validatePasswordPolicy enforces 8..72 UTF-8 bytes matching backend BcryptHasher', () => {
  assert.equal(validatePasswordPolicy('short7!').valid, false);
  assert.equal(validatePasswordPolicy('🔐'.repeat(4)).valid, false);
  assert.equal(validatePasswordPolicy('validPass123').valid, true);
  assert.equal(validatePasswordPolicy('a'.repeat(72)).valid, true);
  assert.equal(validatePasswordPolicy('a'.repeat(73)).valid, false);
  // 19 4-byte emojis = 19 chars (< 72 chars) but 76 UTF-8 bytes (> 72 bytes)
  assert.equal(validatePasswordPolicy('🔐'.repeat(19)).valid, false);
  assert.equal(validatePasswordPolicy('🔐'.repeat(18)).valid, true);
});

test('validateDisplayNamePolicy enforces 1..100 trimmed characters', () => {
  assert.equal(validateDisplayNamePolicy('   ').valid, false);
  assert.equal(validateDisplayNamePolicy('Ada Lovelace').valid, true);
  assert.equal(validateDisplayNamePolicy('x'.repeat(100)).valid, true);
  assert.equal(validateDisplayNamePolicy('x'.repeat(101)).valid, false);
});

test('getSafeRedirect blocks open redirects and preserves valid internal paths', () => {
  assert.equal(getSafeRedirect('https://evil.example.com'), '/dashboard');
  assert.equal(getSafeRedirect('//evil.example.com'), '/dashboard');
  assert.equal(getSafeRedirect('/\\evil.example.com'), '/dashboard');
  assert.equal(getSafeRedirect('javascript:alert(1)'), '/dashboard');
  assert.equal(getSafeRedirect('/invite?token=abc_123'), '/invite?token=abc_123');
  assert.equal(getSafeRedirect('/projects/new'), '/projects/new');
});
