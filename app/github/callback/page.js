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
  const [manualInput, setManualInput] = useState('');
  const [linkingManual, setLinkingManual] = useState(false);
  const started = useRef(false);

  async function executeLink(rawInstallId) {
    try {
      const match = String(rawInstallId || '').match(/\d+/);
      const installId = match ? match[0] : null;

      if (!installId) {
        throw new Error('No valid GitHub App installation ID received. Please check the URL or paste your Installation ID below.');
      }

      setError(null);
      setStatus('Resolving organization workspace…');

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

      if (!orgId) {
        throw new Error('No organization workspace found to link GitHub App.');
      }

      let stateToken = pending.state;
      const query = new URLSearchParams(window.location.search);
      if (query.get('state')) {
        stateToken = query.get('state');
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
      setStatus('GitHub connected successfully! Redirecting to project setup...');
      setTimeout(() => {
        window.location.replace(`/projects/new?org=${encodeURIComponent(orgId)}`);
      }, 800);
    } catch (err) {
      console.error('[kr0n-github-callback] Error:', err);
      setError(err.message || 'GitHub connection failed. Please try again.');
    } finally {
      setLinkingManual(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const query = new URLSearchParams(window.location.search);
    const installId = query.get('installation_id');

    if (installId) {
      Promise.resolve().then(() => {
        executeLink(installId);
      });
    } else {
      Promise.resolve().then(() => {
        setError(
          'No installation ID detected in redirect URL. If you completed installation on GitHub, please paste your Installation ID or URL below to complete setup.'
        );
      });
    }
  }, []);

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setLinkingManual(true);
    await executeLink(manualInput);
  }

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-md border border-[#222222] bg-[#0c0c0c] rounded-xl p-8 space-y-5 text-center shadow-2xl">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h1 className="text-lg font-bold text-white">GitHub Setup Pending</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">{error}</p>

            {/* Manual input fallback */}
            <form onSubmit={handleManualSubmit} className="pt-2 space-y-2 text-left">
              <label className="block text-[11px] text-neutral-400 font-mono">
                Installation ID or GitHub Settings URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 184229460 or full URL"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#222222] focus:border-[#444444] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={linkingManual || !manualInput.trim()}
                  className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  {linkingManual ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Linking…</span>
                    </>
                  ) : (
                    <span>Link</span>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-[#1c1c1c] flex items-center justify-between text-xs text-neutral-500">
              <Link
                href="/projects/new"
                className="hover:text-white transition-colors"
              >
                ← Back to Repositories
              </Link>
              <a
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors underline"
              >
                View GitHub Installations ↗
              </a>
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
