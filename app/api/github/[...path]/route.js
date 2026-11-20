import { NextResponse } from 'next/server';
const allowed = /^orgs(?:\/[a-f0-9-]+\/github\/(?:installations(?:\/start|\/\d+)?|repositories(?:\/[^/]+\/[^/]+\/(?:branches|directories))?))?$/i;
async function proxy(request, { params }) {
  const { path } = await params;
  if (path.some(part => part === '.' || part === '..' || /[%/\\]/.test(part))) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  const target = path.join('/');
  if (!allowed.test(target)) return NextResponse.json({ error: 'Unsupported GitHub endpoint' }, { status: 404 });
  if (request.method !== 'GET' && !(request.method === 'POST' && /^orgs\/[a-f0-9-]+\/github\/installations$/i.test(target)) && !(request.method === 'DELETE' && /^orgs\/[a-f0-9-]+\/github\/installations\/\d+$/i.test(target))) return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const query = new URLSearchParams();
  const incoming = new URL(request.url);
  for (const key of ['installation_id', 'ref']) if (incoming.searchParams.has(key)) query.set(key, incoming.searchParams.get(key));
  try {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    for (const key of ['authorization', 'cookie']) if (request.headers.has(key)) headers.set(key, request.headers.get(key));
    let body;
    if (request.method === 'POST') {
      const input = await request.json();
      body = JSON.stringify({ installation_id: input.installation_id, state: input.state });
    }
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.KR0N_BACKEND_URL || 'http://localhost:8080';
    const upstream = await fetch(`${base}/api/v1/${target}${query.size ? '?' + query : ''}`, { method: request.method, headers, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    return NextResponse.json(await upstream.json(), { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Cannot reach the KR0N gateway. Check backend configuration.' }, { status: 502 });
  }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
