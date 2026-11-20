'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import { getOrganizations } from '@/lib/auth';

export default function GitHubCallback() {
  const [status, setStatus] = useState('Connecting GitHub App to workspace…');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function complete() {
      try {
        const query = new URLSearchParams(window.location.search);
        const installId = query.get('installation_id');

        let pending = {};
        try {
          const raw =
            sessionStorage.getItem('kr0n_github_install') ||
            localStorage.getItem('kr0n_github_install') ||
            '{}';
          pending = JSON.parse(raw);
        } catch {
          // ignore parse error
        }

        let orgId = pending.org;
        if (!orgId) {
          const orgList = await getOrganizations().catch(() => []);
          if (orgList && orgList.length > 0) {
            orgId = orgList[0].id;
          }
        }

        let stateToken = query.get('state') || pending.state;

        if (!installId || !/^\d+$/.test(installId)) {
          throw new Error('No valid GitHub App installation ID received.');
        }

        if (!orgId) {
          throw new Error('No organization workspace found to link GitHub App.');
        }

        // If state token is missing (e.g. user redirected without state or manually returned),
        // fetch a fresh signed state token bound to the current organization
        if (!stateToken) {
          setStatus('Requesting verification handshake token...');
          const startData = await githubApi(`orgs/${orgId}/github/installations/start`).catch(() => ({}));
          stateToken = startData?.state;
        }

        if (!stateToken) {
          throw new Error('Unable to obtain a valid installation state token. Please retry.');
        }

        setStatus('Linking installation credentials with KR0N...');

        await githubApi(`orgs/${orgId}/github/installations`, {
          method: 'POST',
          body: JSON.stringify({
            installation_id: installId,
            state: stateToken,
          }),
        });

        sessionStorage.removeItem('kr0n_github_install');
        localStorage.removeItem('kr0n_github_install');

        setSuccess(true);
        setStatus('GitHub connected successfully! Redirecting...');
        setTimeout(() => {
          window.location.replace(`/projects/new?org=${encodeURIComponent(orgId)}`);
        }, 800);
      } catch (err) {
        console.error('[kr0n-github-callback] Error:', err);
        setError(err.message || 'GitHub connection failed. Please try again.');
      }
    }

    complete();
  }, []);

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      <div className="w-full max-w-md border border-[#222222] bg-[#0c0c0c] rounded-xl p-8 space-y-5 text-center shadow-2xl">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h1 className="text-lg font-bold text-white">GitHub Connection Failed</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">{error}</p>
            <div className="pt-2">
              <Link
                href="/projects/new"
                className="inline-block bg-white text-black font-semibold text-xs px-5 py-2 rounded-md hover:bg-neutral-200 transition-colors"
              >
                Back to Repositories
              </Link>
            </div>
          </>
        ) : success ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <h1 className="text-lg font-bold text-white">GitHub Connected</h1>
            <p className="text-xs text-neutral-400">{status}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white mx-auto flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-neutral-300" />
            </div>
            <h1 className="text-lg font-bold text-white">Connecting GitHub</h1>
            <p className="text-xs text-neutral-400">{status}</p>
          </>
        )}
      </div>
    </main>
  );
}
