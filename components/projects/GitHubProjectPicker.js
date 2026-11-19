'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, RefreshCw, Lock, GitBranch, Folder, ExternalLink } from 'lucide-react';
import { githubApi } from '@/lib/github-api';

const inputClass = 'w-full border border-kr0n-line bg-kr0n-canvas p-3 text-sm text-white focus:outline-white';
const buttonClass = 'border border-kr0n-line px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed';

export default function GitHubProjectPicker() {
  const [orgs, setOrgs] = useState([]);
  const [org, setOrg] = useState('');
  const [installations, setInstallations] = useState([]);
  const [installation, setInstallation] = useState('');
  const [repos, setRepos] = useState([]);
  const [repo, setRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState('');
  const [directories, setDirectories] = useState([]);
  const [directory, setDirectory] = useState('/');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('organizations');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    githubApi('orgs').then(data => {
      if (!active) return;
      const list = data.organizations || [];
      setOrgs(list);
      const requested = new URLSearchParams(window.location.search).get('org');
      setOrg(list.find(o => o.id === requested)?.id || list[0]?.id || '');
      setLoading('');
    }).catch(e => { if (active) { setError(e.message); setLoading(''); } });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    if (!org) return;
    let active = true;
    githubApi(`orgs/${org}/github/installations`).then(data => {
      if (!active) return;
      const list = (data.installations || []).filter(i => i.status === 'active');
      setInstallations(list);
      setInstallation(list[0]?.installation_id || '');
      setLoading('');
    }).catch(e => { if (active) { setError(e.message); setLoading(''); } });
    return () => { active = false; };
  }, [org, revision]);

  useEffect(() => {
    if (!org || !installation) return;
    let active = true;
    githubApi(`orgs/${org}/github/repositories?installation_id=${installation}`).then(data => {
      if (active) { setRepos(data.repositories || []); setLoading(''); }
    }).catch(e => { if (active) { setError(e.message); setLoading(''); } });
    return () => { active = false; };
  }, [org, installation, revision]);

  useEffect(() => {
    if (!repo) return;
    let active = true;
    const path = `orgs/${org}/github/repositories/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
    githubApi(`${path}/branches?installation_id=${installation}`).then(data => {
      if (!active) return;
      const list = data.branches || [];
      setBranches(list);
      setBranch(list.find(b => b.name === repo.default_branch)?.name || list[0]?.name || '');
      setLoading('');
    }).catch(e => { if (active) { setError(e.message); setLoading(''); } });
    return () => { active = false; };
  }, [repo, org, installation]);

  useEffect(() => {
    if (!repo || !branch) return;
    let active = true;
    const query = new URLSearchParams({ installation_id: installation, ref: branch });
    githubApi(`orgs/${org}/github/repositories/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/directories?${query}`).then(data => {
      if (active) { setDirectories(data.directories || ['/']); setDirectory('/'); }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [repo, org, installation, branch]);

  function resetSelection() { setRepo(null); setBranches([]); setBranch(''); setDirectories([]); setSaved(false); }
  async function connect() {
    setBusy(true); setError('');
    try {
      const data = await githubApi(`orgs/${org}/github/installations/start`);
      const target = new URL(data.install_url);
      if (target.protocol !== 'https:' || target.hostname !== 'github.com') throw new Error('Invalid GitHub installation URL.');
      sessionStorage.setItem('kr0n_github_install', JSON.stringify({ org, state: data.state }));
      window.location.assign(target.href);
    } catch (e) { setError(e.message); setBusy(false); }
  }
  async function disconnect() {
    if (!window.confirm('Disconnect this GitHub installation from the organization?')) return;
    setBusy(true); setError('');
    try {
      await githubApi(`orgs/${org}/github/installations/${installation}`, { method: 'DELETE' });
      setInstallation(''); setInstallations([]); setRepos([]); resetSelection(); setRevision(r => r + 1);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function saveDraft() {
    try {
      localStorage.setItem('kr0n_github_project_draft', JSON.stringify({ orgId: org, installationId: installation, repository: repo.full_name, repositoryId: repo.id, branch, rootDirectory: directory }));
      setSaved(true);
    } catch { setError('Could not save the draft in this browser.'); }
  }
  const filtered = repos.filter(r => r.full_name.toLowerCase().includes(search.trim().toLowerCase()));
  return <main className='min-h-full bg-kr0n-canvas p-5 sm:p-10 text-white'>
    <div className='max-w-5xl mx-auto space-y-8'>
      <Link href='/projects' className='inline-flex items-center gap-2 text-sm text-kr0n-muted hover:text-white'><ArrowLeft size={16} /> Projects</Link>
      <header className='flex flex-wrap items-start justify-between gap-5'>
        <div><p className='font-mono text-xs text-kr0n-muted uppercase tracking-widest mb-3'>New project / source</p><h1 className='text-3xl font-semibold tracking-tight'>Import from GitHub</h1><p className='mt-3 text-kr0n-muted text-sm'>Choose a repository, branch, and root directory for your project.</p></div>
        <button className={buttonClass} onClick={() => { setError(''); resetSelection(); setRepos([]); setInstallation(''); setLoading('organizations'); setRevision(r => r + 1); }} aria-label='Refresh GitHub repositories'><RefreshCw size={16} /></button>
      </header>
      {error && <div role='alert' className='border border-red-400/40 p-4 text-sm text-red-200'>{error} <Link className='underline ml-2' href='/login'>Sign in</Link></div>}
      <section className='flex flex-wrap gap-4 items-end border-y border-kr0n-line py-5'>
        <label className='flex-1 min-w-48 space-y-2'><span className='text-xs text-kr0n-muted'>Organization</span><select className={inputClass} value={org} onChange={e => { resetSelection(); setOrg(e.target.value); setInstallation(''); setInstallations([]); setRepos([]); setError(''); setLoading('installations'); }}><option value=''>Select organization</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label className='flex-1 min-w-48 space-y-2'><span className='text-xs text-kr0n-muted'>GitHub account</span><select className={inputClass} value={installation} onChange={e => { resetSelection(); setInstallation(e.target.value); setRepos([]); setError(''); setLoading('repositories'); }}><option value=''>Select installation</option>{installations.map(i => <option key={i.installation_id} value={i.installation_id}>{i.account_login}</option>)}</select></label>
        <button disabled={!org || busy} onClick={connect} className={buttonClass}><GitBranch className='inline mr-2' size={16} />Connect GitHub</button>
        {installation && <button disabled={busy} onClick={disconnect} className={buttonClass}>Disconnect</button>}
      </section>
      <div className='grid md:grid-cols-[1fr_320px] gap-8'>
        <section className='space-y-4 min-w-0'>
          <label className='flex items-center gap-3 border border-kr0n-line px-3'><Search size={16} /><input aria-label='Search repositories' placeholder='Search your repositories…' value={search} onChange={e => setSearch(e.target.value)} className='w-full bg-transparent py-3 text-sm outline-none' /></label>
          <p className='text-xs text-kr0n-muted' role='status'>{loading ? `Loading ${loading}…` : `${filtered.length} repositories`}</p>
          {!loading && !orgs.length && !error && <p className='text-sm text-kr0n-muted'>No organizations found. Ask an organization owner to invite you.</p>}
          {!loading && org && !installation && !error && <p className='text-sm text-kr0n-muted'>Connect the KR0N GitHub App to choose which repositories this organization can access.</p>}
          {!loading && installation && !filtered.length && <p className='text-sm text-kr0n-muted'>No repositories found. Clear your search or update the GitHub App repository access.</p>}
          <ul className='divide-y divide-kr0n-line border-y border-kr0n-line'>{filtered.map(r => <li key={r.id}><button aria-pressed={repo?.id === r.id} onClick={() => { resetSelection(); setRepo(r); setLoading('branches'); setError(''); }} className={`w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 ${repo?.id === r.id ? 'bg-white/10' : ''}`}><GitBranch size={20} className='shrink-0' /><span className='flex-1 break-all text-sm'>{r.full_name}<span className='block text-xs text-kr0n-muted mt-1'>{r.default_branch}</span></span>{r.private && <Lock size={14} aria-label='Private repository' />}</button></li>)}</ul>
        </section>
        <aside className='space-y-5 border border-kr0n-line p-5 self-start'>
          <h2 className='font-semibold'>Project source</h2>
          {repo ? <><p className='text-sm break-all'>{repo.full_name}</p><a className='text-xs text-kr0n-muted inline-flex gap-2 items-center underline' href={`https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`} target='_blank' rel='noopener noreferrer'>View on GitHub<ExternalLink size={12} /></a>
          <label className='block space-y-2'><span className='text-xs text-kr0n-muted flex gap-2'><GitBranch size={14} />Branch</span><select className={inputClass} value={branch} onChange={e => { setBranch(e.target.value); setDirectories([]); setSaved(false); }}>{branches.map(b => <option key={b.name}>{b.name}</option>)}</select></label>
          <label className='block space-y-2'><span className='text-xs text-kr0n-muted flex gap-2'><Folder size={14} />Root directory</span><select className={inputClass} value={directory} onChange={e => { setDirectory(e.target.value); setSaved(false); }}>{directories.map(d => <option key={d}>{d}</option>)}</select></label>
          <button disabled={!branch || !directories.length || busy} className={buttonClass + ' w-full'} onClick={saveDraft}>Save project draft</button>{saved && <p role='status' className='text-sm text-emerald-300'>Source saved in this browser.</p>}</> : <p className='text-sm text-kr0n-muted'>Select a repository to configure its source.</p>}
          <p className='text-xs leading-relaxed text-kr0n-muted'>Saving a source draft does not deploy the project. Deployment will be available when the project service is connected.</p>
        </aside>
      </div>
    </div>
  </main>;
}
