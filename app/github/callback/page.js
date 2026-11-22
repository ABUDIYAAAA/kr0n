'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { githubApi } from '@/lib/github-api';
import { getOrganizations } from '@/lib/auth';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

export default function GitHubCallback() {
  const [status, setStatus] = useState('Connecting GitHub App to workspace...');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeInstallation() {
      try {
        const query = new URLSearchParams(window.location.search);
        const rawInstallId = query.get('installation_id');
        const queryState = query.get('state') || '';

        const match = String(rawInstallId || '').match(/^\d+$/);
        const installId = match ? match[0] : null;
        if (!installId) {
          throw new Error(
            'Missing or invalid GitHub App installation_id in callback URL. Restart the installation flow from your kr0n workspace.'
          );
        }

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

        if (!queryState) {
          throw new Error(
            'Missing verification state token in GitHub callback URL. Restart the installation flow from kr0n.'
          );
        }

        if (pending.state && pending.state !== queryState) {
          throw new Error(
            'GitHub installation state mismatch. Restart the connection from kr0n.'
          );
        }

        const stateToken = queryState;

        setStatus('Resolving organization workspace...');
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

        setStatus('Linking GitHub installation with kr0n...');
        await githubApi(`orgs/${orgId}/github/installations`, {
          method: 'POST',
          body: {
            installation_id: installId,
            state: stateToken,
          },
        });

        sessionStorage.removeItem('kr0n_github_install');
        localStorage.removeItem('kr0n_github_install');

        setSuccess(true);
        setStatus('GitHub connected. Redirecting to repository import...');
        setTimeout(() => {
          window.location.replace(`/projects/new?org=${encodeURIComponent(orgId)}`);
        }, 800);
      } catch (err) {
        setError(err.message || 'GitHub connection failed. Please try again.');
      }
    }

    Promise.resolve().then(completeInstallation);
  }, []);

  return (
    <AuthCard
      title={
        error
          ? 'GitHub connection failed'
          : success
          ? 'GitHub connected'
          : 'Connecting GitHub'
      }
      maxWidth='max-w-md'
    >
      {error ? (
        <div className='space-y-4'>
          <AuthBanner type='error' message={error} />
          <div className='flex items-center justify-between gap-3 pt-1'>
            <Link
              href='/projects/new'
              className='flex-1 h-10 rounded-lg inline-flex items-center justify-center bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
            >
              Restart setup
            </Link>
            <Link
              href='/settings'
              className='h-10 px-4 rounded-lg inline-flex items-center justify-center border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150'
            >
              Settings
            </Link>
          </div>
        </div>
      ) : success ? (
        <div className='py-4 text-center space-y-3'>
          <CheckCircle2 size={24} className='text-kr0n-healthy mx-auto' />
          <p className='text-sm text-kr0n-text-secondary'>{status}</p>
        </div>
      ) : (
        <div className='py-4 text-center space-y-3'>
          <Loader2 size={22} className='animate-spin text-kr0n-muted mx-auto' />
          <p className='text-sm text-kr0n-muted'>{status}</p>
        </div>
      )}
    </AuthCard>
  );
}
