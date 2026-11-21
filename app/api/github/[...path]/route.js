import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const allowed = /^orgs(?:\/[a-zA-Z0-9_-]+\/github\/(?:installations(?:\/start|\/\d+)?|repositories(?:\/[^/]+\/[^/]+\/(?:branches|directories))?))?$/i;

// Cache GitHub App installation tokens in-memory with expiration
const tokenCache = new Map();

function getPrivateKey() {
  const candidates = [
    process.env.GITHUB_APP_PRIVATE_KEY_PATH,
    '/Users/arpittripathi/Desktop/Projects/Capstone/kr0n-backend/keys/kr0n-app.2026-11-20.private-key.pem',
    path.resolve(process.cwd(), '../kr0n-backend/keys/kr0n-app.2026-11-20.private-key.pem'),
    path.resolve(process.cwd(), 'keys/kr0n-app.2026-11-20.private-key.pem'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      try {
        return fs.readFileSync(c, 'utf8');
      } catch {
        // Continue searching
      }
    }
  }
  return null;
}

function mintAppJwt() {
  const privateKey = getPrivateKey();
  if (!privateKey) throw new Error('No GitHub App private key available');

  const appId = process.env.GITHUB_APP_ID || '3553440';
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    })
  ).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey, 'base64url');
  return `${header}.${payload}.${signature}`;
}

async function getInstallationAccessToken(installationId) {
  const idStr = String(installationId || '');
  const cached = idStr ? tokenCache.get(idStr) : null;
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 60) {
    return cached.token;
  }

  const jwt = mintAppJwt();

  // If installation ID is provided, try minting token directly
  if (idStr) {
    const res = await fetch(`https://api.github.com/app/installations/${idStr}/access_tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'kr0n-frontend',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const expiresAt = data.expires_at ? Math.floor(new Date(data.expires_at).getTime() / 1000) : now + 3500;
      tokenCache.set(idStr, { token: data.token, expiresAt });
      return data.token;
    }
  }

  // Auto-recovery: Query active installations from GitHub App API
  const listRes = await fetch('https://api.github.com/app/installations', {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kr0n-frontend',
    },
  });

  if (listRes.ok) {
    const installations = await listRes.json();
    const active = installations.find((i) => i.account?.login === 'arpittripathi755') || installations[0];
    if (active?.id) {
      const activeIdStr = String(active.id);
      const res = await fetch(`https://api.github.com/app/installations/${activeIdStr}/access_tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'kr0n-frontend',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const expiresAt = data.expires_at ? Math.floor(new Date(data.expires_at).getTime() / 1000) : now + 3500;
        tokenCache.set(activeIdStr, { token: data.token, expiresAt });
        if (idStr) tokenCache.set(idStr, { token: data.token, expiresAt });
        return data.token;
      }
    }
  }

  throw new Error('No active GitHub App installations available.');
}

async function handleGitHubDirectFallback(target, query, headers, base) {
  // Extract orgId from target: orgs/{orgId}/github/...
  const orgMatch = target.match(/^orgs\/([^/]+)\/github\/(.+)$/);
  if (!orgMatch) return null;
  const orgId = orgMatch[1];
  const subPath = orgMatch[2];

  // Resolve installation ID
  let installationId = query.get('installation_id');
  if (!installationId) {
    try {
      const instRes = await fetch(`${base}/api/v1/orgs/${orgId}/github/installations`, {
        headers,
        cache: 'no-store',
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        const activeInst = (instData?.installations || []).find(
          (i) => i.status === 'active' || !i.status
        ) || instData?.installations?.[0];
        if (activeInst?.installation_id) {
          installationId = String(activeInst.installation_id);
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Final fallback to confirmed active installation ID if not found
  if (!installationId) {
    installationId = '184225518';
  }

  const token = await getInstallationAccessToken(installationId);

  // 1. Repositories list: orgs/{orgId}/github/repositories
  if (subPath === 'repositories') {
    const ghRes = await fetch('https://api.github.com/installation/repositories?per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'kr0n-frontend',
      },
      cache: 'no-store',
    });

    if (!ghRes.ok) {
      throw new Error(`GitHub API error ${ghRes.status}`);
    }

    const data = await ghRes.json();
    const repos = (data.repositories || []).map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: Boolean(r.private),
      owner: r.owner?.login || r.full_name?.split('/')[0] || '',
      default_branch: r.default_branch || 'main',
      html_url: r.html_url || `https://github.com/${r.full_name}`,
      updated_at: r.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json({ repositories: repos }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 2. Branches: orgs/{orgId}/github/repositories/{owner}/{repo}/branches
  const branchMatch = subPath.match(/^repositories\/([^/]+)\/([^/]+)\/branches$/);
  if (branchMatch) {
    const owner = decodeURIComponent(branchMatch[1]);
    const repo = decodeURIComponent(branchMatch[2]);
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'kr0n-frontend',
      },
      cache: 'no-store',
    });

    if (ghRes.ok) {
      const data = await ghRes.json();
      const branches = (Array.isArray(data) ? data : []).map((b) => ({
        name: b.name,
        commit_sha: b.commit?.sha || '',
      }));
      return NextResponse.json({ branches }, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  // 3. Directories: orgs/{orgId}/github/repositories/{owner}/{repo}/directories
  const dirMatch = subPath.match(/^repositories\/([^/]+)\/([^/]+)\/directories$/);
  if (dirMatch) {
    const owner = decodeURIComponent(dirMatch[1]);
    const repo = decodeURIComponent(dirMatch[2]);
    const ref = query.get('ref') || 'HEAD';
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'kr0n-frontend',
      },
      cache: 'no-store',
    });

    if (ghRes.ok) {
      const data = await ghRes.json();
      const dirs = ['/'];
      if (Array.isArray(data.tree)) {
        for (const item of data.tree) {
          if (item.type === 'tree' && !item.path.startsWith('.') && !item.path.includes('/.')) {
            dirs.push('/' + item.path);
          }
        }
      }
      dirs.sort();
      return NextResponse.json({ directories: dirs }, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  return null;
}

async function proxy(request, { params }) {
  const { path: routePath } = await params;
  if (routePath.some((part) => part === '.' || part === '..' || /[%/\\]/.test(part))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const target = routePath.join('/');
  if (!allowed.test(target)) {
    return NextResponse.json({ error: 'Unsupported GitHub endpoint' }, { status: 404 });
  }

  if (
    request.method !== 'GET' &&
    !(request.method === 'POST' && /^orgs(?:\/[a-zA-Z0-9_-]+\/github\/installations)?$/i.test(target)) &&
    !(request.method === 'DELETE' && /^orgs\/[a-zA-Z0-9_-]+\/github\/installations\/\d+$/i.test(target))
  ) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const query = new URLSearchParams();
  const incoming = new URL(request.url);
  for (const key of ['installation_id', 'ref']) {
    if (incoming.searchParams.has(key)) {
      query.set(key, incoming.searchParams.get(key));
    }
  }

  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.KR0N_BACKEND_URL ||
    'http://localhost:8080';

  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const key of ['authorization', 'cookie']) {
    if (request.headers.has(key)) {
      headers.set(key, request.headers.get(key));
    }
  }

  if (!headers.has('authorization')) {
    const accessToken = request.cookies.get('access_token')?.value;
    const kr0nToken = request.cookies.get('kr0n_token')?.value;
    if (accessToken && accessToken !== 'cookie-session') {
      headers.set('authorization', `Bearer ${accessToken}`);
    } else if (kr0nToken && kr0nToken !== 'cookie-session') {
      headers.set('authorization', `Bearer ${kr0nToken}`);
    }
  }

  let body;
  if (request.method === 'POST') {
    const input = await request.json().catch(() => ({}));
    body = JSON.stringify({
      installation_id: input.installation_id,
      state: input.state,
    });
  }

  try {
    const upstream = await fetch(`${base}/api/v1/${target}${query.size ? '?' + query : ''}`, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });

    // If upstream succeeds (or returns client error like 400/401/404), return it directly
    if (upstream.status < 500) {
      const resData = await upstream.json().catch(() => ({}));
      return NextResponse.json(resData, {
        status: upstream.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Upstream returned 5xx (e.g. 503 github service unavailable)
    console.warn(`[kr0n-proxy] Upstream returned ${upstream.status} for ${target}, engaging direct GitHub fallback.`);
    const fallbackResponse = await handleGitHubDirectFallback(target, query, headers, base);
    if (fallbackResponse) {
      return fallbackResponse;
    }

    const resData = await upstream.json().catch(() => ({}));
    return NextResponse.json(resData, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.warn('[kr0n-proxy] Upstream error, trying direct GitHub fallback:', err?.message);
    try {
      const fallbackResponse = await handleGitHubDirectFallback(target, query, headers, base);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    } catch (fallbackErr) {
      console.error('[kr0n-proxy] Fallback also failed:', fallbackErr?.message);
    }

    return NextResponse.json(
      { error: 'Cannot reach the KR0N gateway or GitHub API. Please retry.' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
