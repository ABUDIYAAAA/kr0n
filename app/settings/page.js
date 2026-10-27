'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  Building,
  Key,
  Shield,
  History,
  GitBranch,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';

export default function GlobalSettingsPage() {
  const {
    settings,
    inviteMember,
    changeMemberRole,
    removeMember,
    createApiToken,
    revokeApiToken,
    revokeSession,
  } = useKr0nStore();

  const [activeTab, setActiveTab] = useState('profile'); // profile | organization | members | github | security | tokens | audit

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');

  // Token modal
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // GitHub connection simulation
  const [githubConnected, setGithubConnected] = useState(settings.github.connected);

  // Profile fields
  const [profileName, setProfileName] = useState(settings.profile.fullName);
  const [profileEmail, setProfileEmail] = useState(settings.profile.email);
  const [profileTimezone, setProfileTimezone] = useState(settings.profile.timezone);
  const [profileSaved, setProfileSaved] = useState(false);

  // Audit search
  const [auditQuery, setAuditQuery] = useState('');

  const handleCreateToken = (e) => {
    e.preventDefault();
    if (!tokenName.trim()) return;
    const tokenSecret = createApiToken(tokenName.trim());
    setGeneratedToken(tokenSecret);
    setTokenName('');
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const filteredAuditLogs = settings.auditLog.filter((log) => {
    if (!auditQuery.trim()) return true;
    const q = auditQuery.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q)
    );
  });

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Header ─── */}
      <div className='px-4 sm:px-6 lg:px-8 py-6 border-b border-kr0n-line bg-kr0n-black/40 shrink-0'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-xl sm:text-2xl font-bold font-mono text-white tracking-wide uppercase'>
            Settings & Workspace Admin
          </h1>
          <p className='text-xs font-mono text-kr0n-text-secondary mt-1'>
            Manage team identity, organization members, API tokens, integrations, and security policies.
          </p>

          {/* Navigation Tabs */}
          <div className='flex items-center gap-1 sm:gap-2 mt-6 border-b border-kr0n-line-soft font-mono text-xs uppercase tracking-wider overflow-x-auto'>
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'organization', label: 'Organization', icon: Building },
              { id: 'members', label: 'Members & Roles', icon: Users },
              { id: 'github', label: 'GitHub App', icon: GitBranch },
              { id: 'security', label: 'Security & Sessions', icon: Shield },
              { id: 'tokens', label: 'API Tokens', icon: Key },
              { id: 'audit', label: 'Audit Log', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors font-medium ${
                    activeTab === tab.id
                      ? 'border-white text-white font-bold'
                      : 'border-transparent text-kr0n-text-secondary hover:text-white'
                  }`}
                >
                  <Icon size={13} className={activeTab === tab.id ? 'text-white' : 'text-kr0n-muted'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8'>
        {/* ─── TAB 1: PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2'>
              <h2 className='text-sm font-bold text-white uppercase'>Developer Profile</h2>
              <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                Personal account details for commits, audit traces, and incident assignment.
              </p>
            </div>

            {profileSaved && (
              <div className='p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2'>
                <CheckCircle2 size={14} />
                <span>Profile preferences updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className='space-y-4 max-w-xl'>
              <div>
                <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>Full Name</label>
                <input
                  type='text'
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>Email Address</label>
                <input
                  type='email'
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>Preferred Timezone</label>
                <input
                  type='text'
                  value={profileTimezone}
                  onChange={(e) => setProfileTimezone(e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <button
                  type='submit'
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-5 py-2 uppercase font-bold tracking-wider transition-colors'
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── TAB 2: ORGANIZATION ─── */}
        {activeTab === 'organization' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2'>
              <h2 className='text-sm font-bold text-white uppercase'>Organization Overview</h2>
              <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                Tenant boundary and workspace metadata for kr0n-labs.
              </p>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft max-w-2xl'>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Organization Name</span>
                <span className='text-white font-bold'>{settings.organization.name}</span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Workspace Slug</span>
                <span className='text-white font-bold select-all'>{settings.organization.slug}</span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Plan Subscription</span>
                <span className='text-emerald-400 font-bold uppercase'>{settings.organization.plan}</span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Seat Allocation</span>
                <span className='text-white font-bold'>{settings.organization.seatCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: MEMBERS & ROLES ─── */}
        {activeTab === 'members' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>Team Members & Roles</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Manage team access levels: Owner, Developer, or Viewer.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowInviteModal(true)}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 font-bold uppercase tracking-wider'
              >
                <Plus size={12} />
                <span>Invite Member</span>
              </button>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              <div className='p-3 bg-kr0n-black/60 grid grid-cols-12 text-[10px] text-kr0n-muted uppercase font-bold tracking-wider'>
                <span className='col-span-5'>Member</span>
                <span className='col-span-3'>Role</span>
                <span className='col-span-2'>Status</span>
                <span className='col-span-2 text-right'>Actions</span>
              </div>

              {settings.members.map((m) => (
                <div key={m.id} className='p-4 grid grid-cols-12 items-center hover:bg-white/[0.015] transition-colors'>
                  <div className='col-span-5 space-y-0.5 min-w-0 pr-2'>
                    <div className='text-white font-bold truncate'>{m.name}</div>
                    <div className='text-[11px] text-kr0n-text-secondary truncate'>{m.email}</div>
                  </div>

                  <div className='col-span-3'>
                    {m.role === 'Owner' ? (
                      <span className='text-white font-bold'>Owner</span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => changeMemberRole(m.id, e.target.value)}
                        className='bg-kr0n-black border border-kr0n-line text-white px-2 py-1 text-xs outline-none'
                      >
                        <option value='Developer'>Developer</option>
                        <option value='Viewer'>Viewer</option>
                        <option value='Admin'>Admin</option>
                      </select>
                    )}
                  </div>

                  <div className='col-span-2'>
                    <span className='px-1.5 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                      {m.status}
                    </span>
                  </div>

                  <div className='col-span-2 text-right'>
                    {m.role !== 'Owner' && (
                      <button
                        type='button'
                        onClick={() => removeMember(m.id)}
                        className='text-kr0n-muted hover:text-red-400 p-1 transition-colors'
                        title='Remove member'
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: GITHUB APP ─── */}
        {activeTab === 'github' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2'>
              <h2 className='text-sm font-bold text-white uppercase'>GitHub App Integration</h2>
              <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                Webhook triggers, commit status checks, and automated preview deployments.
              </p>
            </div>

            <div className='p-5 border border-kr0n-line bg-kr0n-surface space-y-4 max-w-2xl'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 border border-kr0n-line bg-kr0n-black flex items-center justify-center text-white'>
                    <GitBranch size={16} />
                  </div>
                  <div>
                    <span className='text-white font-bold block text-sm'>
                      {githubConnected ? 'Connected to GitHub' : 'Disconnected'}
                    </span>
                    <span className='text-kr0n-text-secondary text-[11px] block mt-0.5'>
                      {githubConnected ? `@${settings.github.account} · 14 repositories authorized` : 'No GitHub account linked'}
                    </span>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => setGithubConnected(!githubConnected)}
                  className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors ${
                    githubConnected
                      ? 'border-kr0n-line text-kr0n-text-secondary hover:text-red-400 hover:border-red-400/40'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {githubConnected ? 'Disconnect' : 'Connect Account'}
                </button>
              </div>

              <div className='pt-3 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary space-y-1 font-sans leading-relaxed'>
                <p>kr0n accesses repository contents hermetically to build container artifacts. No code is permanently retained outside the ephemeral BuildKit cache.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: SECURITY & SESSIONS ─── */}
        {activeTab === 'security' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2'>
              <h2 className='text-sm font-bold text-white uppercase'>Active Authentication Sessions</h2>
              <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                Authenticated browser sessions and developer CLI handshakes.
              </p>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              {settings.sessions.map((sess) => (
                <div key={sess.id} className='p-4 flex items-center justify-between gap-4'>
                  <div className='space-y-0.5'>
                    <div className='flex items-center gap-2'>
                      <span className='text-white font-bold'>{sess.device}</span>
                      {sess.activeNow && (
                        <span className='px-1.5 py-0.2 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className='text-[10px] text-kr0n-muted'>
                      IP: {sess.ip} · {sess.location}
                    </div>
                  </div>

                  {!sess.activeNow && (
                    <button
                      type='button'
                      onClick={() => revokeSession(sess.id)}
                      className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className='p-3 border border-kr0n-line-soft bg-kr0n-black text-[11px] text-kr0n-muted font-sans leading-relaxed'>
              <strong className='text-white font-mono'>Security Policy:</strong> Multi-factor authentication is configured through your SSO identity provider. Session tokens expire after 30 days of inactivity.
            </div>
          </div>
        )}

        {/* ─── TAB 6: API TOKENS ─── */}
        {activeTab === 'tokens' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>API Tokens & Service Identities</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Programmatic access tokens for the kr0n CLI and CI/CD automation pipelines.
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setShowTokenModal(true);
                  setGeneratedToken(null);
                }}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 font-bold uppercase tracking-wider'
              >
                <Plus size={12} />
                <span>Create Token</span>
              </button>
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              {settings.apiTokens.map((tok) => (
                <div key={tok.id} className='p-4 flex items-center justify-between gap-4'>
                  <div className='space-y-0.5'>
                    <div className='text-white font-bold'>{tok.name}</div>
                    <div className='text-[11px] text-kr0n-text-secondary font-mono'>
                      {tok.prefix} · Scope: <span className='text-white font-bold'>{tok.scope}</span>
                    </div>
                    <div className='text-[10px] text-kr0n-muted'>
                      Created {tok.createdAt} · Last active {tok.lastUsed}
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => revokeApiToken(tok.id)}
                    className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 7: AUDIT LOG ─── */}
        {activeTab === 'audit' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>Security Audit Log</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Immutable ledger of credential mutations, deployment triggers, and permission modifications.
                </p>
              </div>

              <input
                type='text'
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                placeholder='Filter audit entries...'
                className='bg-kr0n-black border border-kr0n-line px-3 py-1.5 text-xs text-white outline-none w-full sm:w-64'
              />
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              <div className='p-3 bg-kr0n-black/60 grid grid-cols-12 text-[10px] text-kr0n-muted uppercase font-bold tracking-wider'>
                <span className='col-span-4'>Actor & Action</span>
                <span className='col-span-5'>Target Resource</span>
                <span className='col-span-3 text-right'>Time & IP</span>
              </div>

              {filteredAuditLogs.map((log) => (
                <div key={log.id} className='p-3.5 grid grid-cols-12 items-center hover:bg-white/[0.015] transition-colors'>
                  <div className='col-span-4 space-y-0.5 min-w-0 pr-2'>
                    <div className='text-white font-bold truncate'>{log.actor}</div>
                    <span className='px-1.5 py-0.2 bg-white/5 border border-kr0n-line text-[9px] text-zinc-300 font-bold uppercase'>
                      {log.action}
                    </span>
                  </div>

                  <div className='col-span-5 text-kr0n-text-secondary truncate'>
                    {log.resource}
                  </div>

                  <div className='col-span-3 text-right text-[10px] text-kr0n-muted space-y-0.5'>
                    <div>{log.time}</div>
                    <div className='text-[9px]'>{log.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Invite Member Modal ─── */}
      {showInviteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Invite Team Member</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Grant workspace access and configure role permissions for your organization.
            </p>
            <form onSubmit={handleInvite} className='space-y-4'>
              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Email Address</label>
                <input
                  type='email'
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder='colleague@example.com'
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none'
                >
                  <option value='Developer'>Developer (Deploy & configure services)</option>
                  <option value='Viewer'>Viewer (Read-only observability access)</option>
                  <option value='Admin'>Admin (Full organization & billing control)</option>
                </select>
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowInviteModal(false)}
                  className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase'
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Create API Token Modal ─── */}
      {showTokenModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Create API Token</h3>

            {!generatedToken ? (
              <form onSubmit={handleCreateToken} className='space-y-4'>
                <p className='text-kr0n-text-secondary font-sans'>
                  Generate an authentication credential for automated CI/CD runners or local CLI handshakes.
                </p>
                <div>
                  <label className='block text-kr0n-text-secondary mb-1'>Token Label</label>
                  <input
                    type='text'
                    required
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder='e.g. github-runner-prod'
                    className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                  />
                </div>
                <div className='flex items-center justify-end gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => setShowTokenModal(false)}
                    className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase'
                  >
                    Generate Token
                  </button>
                </div>
              </form>
            ) : (
              <div className='space-y-4'>
                <div className='p-3 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs flex items-center gap-2'>
                  <AlertTriangle size={15} className='shrink-0' />
                  <span>Copy this secret now. It will never be displayed again.</span>
                </div>

                <div className='p-3 bg-kr0n-black border border-kr0n-line text-white font-mono select-all break-all text-xs'>
                  {generatedToken}
                </div>

                <div className='flex items-center justify-between pt-2'>
                  <button
                    type='button'
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase flex items-center gap-1.5'
                  >
                    <Copy size={12} />
                    <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setShowTokenModal(false)}
                    className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
