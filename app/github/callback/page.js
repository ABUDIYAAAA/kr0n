'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { githubApi } from '@/lib/github-api';
export default function GitHubCallback() {
  const [message, setMessage] = useState('Connecting GitHub…');
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function complete() {
      try {
        const query = new URLSearchParams(window.location.search);
        const pending = JSON.parse(sessionStorage.getItem('kr0n_github_install') || '{}');
        if (!pending.org || !pending.state || query.get('state') !== pending.state || !/^\d+$/.test(query.get('installation_id') || '')) throw new Error('Installation cancelled or expired. Start the connection again.');
        await githubApi(`orgs/${pending.org}/github/installations`, { method: 'POST', body: JSON.stringify({ installation_id: query.get('installation_id'), state: pending.state }) });
        sessionStorage.removeItem('kr0n_github_install');
        window.location.replace(`/projects/new?org=${encodeURIComponent(pending.org)}`);
      } catch (error) { setMessage(error.message); }
    }
    complete();
  }, []);
  return <main className='min-h-screen bg-kr0n-canvas text-white p-10'><h1 className='text-2xl mb-4'>GitHub connection</h1><p role='status'>{message}</p><Link className='underline mt-6 inline-block' href='/projects/new'>Back to repositories</Link></main>;
}
