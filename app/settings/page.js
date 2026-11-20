'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Check,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKr0nStore } from '@/lib/kr0n-state';
import {
  getStoredUser,
  getMe,
  getSessions,
  revokeSession as authRevokeSession,
  changePassword,
  logout,
  isAuthenticated,
  getOrganizations,
  createOrganization,
  getMembers,
  inviteMember as apiInviteMember,
  updateMemberRole as apiUpdateMemberRole,
  removeMember as apiRemoveMember,
  getApiTokens,
  createApiToken as apiCreateApiToken,
  revokeApiToken as apiRevokeApiToken,
  getAuditLogs,
} from '@/lib/auth';
import { githubApi } from '@/lib/github-api';

export default function GlobalSettingsPage() {
  const {
    settings,
    inviteMember: storeInviteMember,
    changeMemberRole: storeChangeMemberRole,
    removeMember: storeRemoveMember,
    createApiToken: storeCreateApiToken,
    revokeApiToken: storeRevokeApiToken,
    revokeSession: storeRevokeSession,
  } = useKr0nStore();

  const [activeTab, setActiveTab] = useState('profile'); // profile | organization | members | github | security | tokens | audit

  // ─── Live Backend State ───
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [backendMembers, setBackendMembers] = useState(null);
  const [backendTokens, setBackendTokens] = useState(null);
  const [backendAudit, setBackendAudit] = useState(null);
  const [backendSessions, setBackendSessions] = useState(null);
  const [backendUserProfile, setBackendUserProfile] = useState(null);
  const [ghInstallations, setGhInstallations] = useState([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Create Organization Modal
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Token modal
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const router = useRouter();

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Profile fields (sync with authenticated user if available)
  const storedUser = typeof window !== 'undefined' ? getStoredUser() : null;
  const [profileName, setProfileName] = useState(storedUser?.displayName || settings.profile.fullName);
  const [profileEmail, setProfileEmail] = useState(storedUser?.email || settings.profile.email);
  const [profileTimezone, setProfileTimezone] = useState(settings.profile.timezone);
  const [profileSaved, setProfileSaved] = useState(false);

  // Audit search
  const [auditQuery, setAuditQuery] = useState('');

  // Current active organization
  const currentOrg =
    organizations.find((o) => o.id === selectedOrgId) ||
    (organizations.length > 0 ? organizations[0] : null);

  // ─── Fetch Organization Sub-resources ───
  const fetchOrgSubResources = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      const [membersData, tokensData, auditData, ghData] = await Promise.all([
        getMembers(orgId),
        getApiTokens(orgId),
        getAuditLogs(orgId),
        githubApi(`orgs/${orgId}/github/installations`).catch(() => ({})),
      ]);
      setBackendMembers(membersData);
      setBackendTokens(tokensData);
      setBackendAudit(auditData);
      setGhInstallations(ghData?.installations || []);
    } catch (err) {
      console.warn('[kr0n-settings] Failed to fetch org sub-resources:', err?.message);
    }
  }, []);

  // ─── Load Initial Live Data from Backend ───
  useEffect(() => {
    let active = true;

    async function loadBackendData() {
      if (!isAuthenticated()) return;

      try {
        const [orgsList, sessionsList, meData] = await Promise.all([
          getOrganizations(),
          getSessions(),
          getMe().catch(() => null),
        ]);

        if (!active) return;

        if (meData?.id) {
          setBackendUserProfile(meData);
          if (meData.display_name) setProfileName(meData.display_name);
          if (meData.email) setProfileEmail(meData.email);
        }

        if (sessionsList && sessionsList.length > 0) {
          setBackendSessions(sessionsList);
          setIsLiveConnected(true);
        }

        if (orgsList && orgsList.length > 0) {
          setOrganizations(orgsList);
          setIsLiveConnected(true);
          const initialOrgId = orgsList[0].id;
          setSelectedOrgId(initialOrgId);
          fetchOrgSubResources(initialOrgId);
        }
      } catch (err) {
        console.warn('[kr0n-settings] Live backend sync notice:', err?.message);
      }
    }

    loadBackendData();

    return () => {
      active = false;
    };
  }, [fetchOrgSubResources]);

  // Handle Organization Switch
  const handleOrgChange = (orgId) => {
    setSelectedOrgId(orgId);
    fetchOrgSubResources(orgId);
  };

  // ─── Create Organization Handler ───
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!newOrgName.trim() || !newOrgSlug.trim()) return;

    setActionLoading(true);
    try {
      const created = await createOrganization(newOrgName, newOrgSlug);
      if (created?.id) {
        const updatedList = await getOrganizations();
        setOrganizations(updatedList);
        setSelectedOrgId(created.id);
        fetchOrgSubResources(created.id);
        setShowCreateOrgModal(false);
        setNewOrgName('');
        setNewOrgSlug('');
        setActionSuccess(`Organization "${created.name}" created successfully.`);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      console.error('[kr0n-settings] Create org error:', err);
      setActionError(err.message || 'Failed to create organization.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Session Revocation ───
  const handleRevokeSession = async (sessionId) => {
    try {
      if (isAuthenticated()) {
        await authRevokeSession(sessionId);
        const refreshed = await getSessions();
        if (refreshed && refreshed.length > 0) {
          setBackendSessions(refreshed);
        }
      }
    } catch (err) {
      console.warn('[kr0n-settings] Session revoke notice:', err?.message);
    }
    storeRevokeSession(sessionId);
  };

  // ─── Password Change ───
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordChangeSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('[kr0n-settings] Change password error:', err);
      setPasswordChangeError(err.message || 'Failed to change password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  // ─── API Token Generation ───
  const handleCreateToken = async (e) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    setActionError('');
    if (currentOrg?.id && isAuthenticated()) {
      try {
        const res = await apiCreateApiToken(currentOrg.id, tokenName.trim(), ['project:read', 'service:read']);
        if (res?.secret) {
          setGeneratedToken(res.secret);
          setTokenName('');
          const updatedTokens = await getApiTokens(currentOrg.id);
          setBackendTokens(updatedTokens);
          return;
        }
      } catch (err) {
        console.error('[kr0n-settings] Create live API token error:', err);
        setActionError(err.message || 'Failed to generate token on control plane.');
      }
    }

    // Local fallback
    const tokenSecret = storeCreateApiToken(tokenName.trim());
    setGeneratedToken(tokenSecret);
    setTokenName('');
  };

  // ─── Revoke API Token ───
  const handleRevokeToken = async (tokenId) => {
    if (currentOrg?.id && isAuthenticated()) {
      try {
        await apiRevokeApiToken(currentOrg.id, tokenId);
        const updatedTokens = await getApiTokens(currentOrg.id);
        setBackendTokens(updatedTokens);
        return;
      } catch (err) {
        console.error('[kr0n-settings] Revoke live token error:', err);
      }
    }
    storeRevokeApiToken(tokenId);
  };

  // ─── Invite Member ───
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setActionError('');
    if (currentOrg?.id && isAuthenticated()) {
      try {
        await apiInviteMember(currentOrg.id, inviteEmail.trim(), inviteRole.toLowerCase());
        const [updatedMembers, updatedAudit] = await Promise.all([
          getMembers(currentOrg.id),
          getAuditLogs(currentOrg.id),
        ]);
        setBackendMembers(updatedMembers);
        setBackendAudit(updatedAudit);
        setInviteEmail('');
        setShowInviteModal(false);
        setActionSuccess(`Invitation sent to ${inviteEmail}.`);
        setTimeout(() => setActionSuccess(''), 4000);
        return;
      } catch (err) {
        console.error('[kr0n-settings] Invite member error:', err);
        setActionError(err.message || 'Failed to dispatch organization invite.');
      }
    }

    // Local fallback
    storeInviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  // ─── Update Member Role ───
  const handleMemberRoleChange = async (targetUserId, newRole) => {
    if (currentOrg?.id && isAuthenticated()) {
      try {
        await apiUpdateMemberRole(currentOrg.id, targetUserId, newRole.toLowerCase());
        const updatedMembers = await getMembers(currentOrg.id);
        setBackendMembers(updatedMembers);
        return;
      } catch (err) {
        console.error('[kr0n-settings] Update member role error:', err);
      }
    }
    storeChangeMemberRole(targetUserId, newRole);
  };

  // ─── Remove Member ───
  const handleRemoveMember = async (targetUserId) => {
    if (currentOrg?.id && isAuthenticated()) {
      try {
        await apiRemoveMember(currentOrg.id, targetUserId);
        const updatedMembers = await getMembers(currentOrg.id);
        setBackendMembers(updatedMembers);
        return;
      } catch (err) {
        console.error('[kr0n-settings] Remove member error:', err);
      }
    }
    storeRemoveMember(targetUserId);
  };

  // ─── GitHub App Connect & Disconnect ───
  const handleConnectGitHub = async () => {
    if (!currentOrg?.id) return;
    setGhLoading(true);
    setGhError('');
    try {
      const data = await githubApi(`orgs/${currentOrg.id}/github/installations/start`);
      const target = new URL(data.install_url);
      if (target.protocol !== 'https:' || target.hostname !== 'github.com') {
        throw new Error('Invalid GitHub App installation URL.');
      }
      sessionStorage.setItem('kr0n_github_install', JSON.stringify({ org: currentOrg.id, state: data.state }));
      window.location.assign(target.href);
    } catch (e) {
      setGhError(e.message || 'Failed to start GitHub App installation.');
      setGhLoading(false);
    }
  };

  const handleDisconnectGitHub = async (installationId) => {
    if (!window.confirm('Disconnect this GitHub installation from the organization?')) return;
    setGhLoading(true);
    setGhError('');
    try {
      await githubApi(`orgs/${currentOrg.id}/github/installations/${installationId}`, { method: 'DELETE' });
      const refreshed = await githubApi(`orgs/${currentOrg.id}/github/installations`).catch(() => ({}));
      setGhInstallations(refreshed?.installations || []);
      setActionSuccess('GitHub App installation disconnected.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      setGhError(e.message || 'Failed to disconnect GitHub installation.');
    } finally {
      setGhLoading(false);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // ─── Filter Audit Logs ───
  const activeAuditList = backendAudit && backendAudit.length > 0 ? backendAudit : settings.auditLog;
  const filteredAuditLogs = activeAuditList.filter((log) => {
    if (!auditQuery.trim()) return true;
    const q = auditQuery.toLowerCase();
    const actor = (log.actor || log.actor_user_id || log.actor_type || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const resource = (log.resource || log.resource_type || log.resource_id || '').toLowerCase();
    return actor.includes(q) || action.includes(q) || resource.includes(q);
  });

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Header ─── */}
      <div className='px-4 sm:px-6 lg:px-8 py-6 border-b border-kr0n-line bg-kr0n-black/40 shrink-0'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-xl sm:text-2xl font-bold font-mono text-white tracking-wide uppercase'>
                  Settings & Workspace Admin
                </h1>
                {isLiveConnected ? (
                  <span className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                    Live Control Plane
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider'>
                    Demo Store
                  </span>
                )}
              </div>
              <p className='text-xs font-mono text-kr0n-text-secondary mt-1'>
                Manage team identity, organization workspaces, API tokens, integrations, and audit records.
              </p>
            </div>

            {/* Active Workspace / Organization Selector */}
            {organizations.length > 0 && (
              <div className='flex items-center gap-2 self-start sm:self-auto font-mono text-xs'>
                <span className='text-kr0n-muted uppercase font-bold text-[10px]'>Workspace:</span>
                <select
                  value={selectedOrgId}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className='bg-kr0n-surface border border-kr0n-line text-white px-2.5 py-1 text-xs outline-none font-bold'
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action alerts */}
          {actionSuccess && (
            <div className='mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2'>
              <CheckCircle2 size={14} className='shrink-0' />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className='mt-4 p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2'>
              <AlertCircle size={14} className='shrink-0' />
              <span>{actionError}</span>
            </div>
          )}

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
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white bg-white/[0.04]'
                      : 'border-transparent text-kr0n-muted hover:text-white hover:border-kr0n-line'
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
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>Developer Profile</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Personal account details for commits, audit traces, and incident assignment.
                </p>
              </div>
              {backendUserProfile && (
                <div className='flex items-center gap-2'>
                  {backendUserProfile.email_verified ? (
                    <span className='px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1'>
                      <Check size={11} /> Email Verified
                    </span>
                  ) : (
                    <Link
                      href='/verify-email'
                      className='px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase font-bold hover:bg-amber-500/20 transition-colors'
                    >
                      Verify Email
                    </Link>
                  )}
                </div>
              )}
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

              {backendUserProfile?.id && (
                <div>
                  <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>User Principal ID</label>
                  <input
                    type='text'
                    readOnly
                    value={backendUserProfile.id}
                    className='w-full bg-kr0n-black border border-kr0n-line-soft px-3 py-2 text-kr0n-muted font-mono select-all text-[11px] cursor-default'
                  />
                </div>
              )}

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
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>Organization & Workspace</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Tenant boundary, RBAC roles, and workspace metadata.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowCreateOrgModal(true)}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 font-bold uppercase tracking-wider'
              >
                <Plus size={12} />
                <span>New Workspace</span>
              </button>
            </div>

            {/* Active Org Card */}
            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft max-w-2xl'>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Organization Name</span>
                <span className='text-white font-bold'>{currentOrg?.name || settings.organization.name}</span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Workspace Slug</span>
                <span className='text-white font-bold select-all'>{currentOrg?.slug || settings.organization.slug}</span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Your Role</span>
                <span className='text-emerald-400 font-bold uppercase'>
                  {currentOrg?.role_id || 'Owner'}
                </span>
              </div>
              <div className='p-4 flex items-center justify-between'>
                <span className='text-kr0n-text-secondary'>Organization ID</span>
                <span className='text-kr0n-muted font-mono select-all text-[11px]'>
                  {currentOrg?.id || settings.organization.id}
                </span>
              </div>
              {currentOrg?.created_at && (
                <div className='p-4 flex items-center justify-between'>
                  <span className='text-kr0n-text-secondary'>Created</span>
                  <span className='text-white font-mono'>
                    {new Date(currentOrg.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* All Workspaces List */}
            {organizations.length > 1 && (
              <div className='space-y-3 pt-4 max-w-2xl'>
                <h3 className='text-xs font-bold text-white uppercase tracking-wider'>All Workspaces</h3>
                <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                        org.id === selectedOrgId ? 'bg-white/[0.04]' : 'hover:bg-white/[0.015]'
                      }`}
                    >
                      <div className='space-y-0.5'>
                        <div className='text-white font-bold'>{org.name}</div>
                        <div className='text-[10px] text-kr0n-text-secondary'>
                          slug: <span className='text-zinc-300 font-mono'>{org.slug}</span> · role: <span className='text-emerald-400 uppercase font-bold'>{org.role_id}</span>
                        </div>
                      </div>
                      {org.id !== selectedOrgId ? (
                        <button
                          type='button'
                          onClick={() => handleOrgChange(org.id)}
                          className='px-3 py-1 border border-kr0n-line hover:border-white text-xs font-bold uppercase tracking-wider text-white'
                        >
                          Switch
                        </button>
                      ) : (
                        <span className='text-[10px] text-emerald-400 uppercase font-bold px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/30'>
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: MEMBERS & ROLES ─── */}
        {activeTab === 'members' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>Team Members & Roles</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Manage team access levels for workspace <strong className='text-white font-mono'>{currentOrg?.name || settings.organization.name}</strong>.
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

              {/* Render Backend Members if connected, else Zustand fallback */}
              {backendMembers && backendMembers.length > 0 ? (
                backendMembers.map((m) => (
                  <div key={m.user_id || m.email} className='p-4 grid grid-cols-12 items-center hover:bg-white/[0.015] transition-colors'>
                    <div className='col-span-5 space-y-0.5 min-w-0 pr-2'>
                      <div className='text-white font-bold truncate'>{m.display_name || m.email?.split('@')[0]}</div>
                      <div className='text-[11px] text-kr0n-text-secondary truncate'>{m.email}</div>
                    </div>

                    <div className='col-span-3'>
                      {m.role_id === 'owner' ? (
                        <span className='text-white font-bold uppercase'>Owner</span>
                      ) : (
                        <select
                          value={m.role_id || 'member'}
                          onChange={(e) => handleMemberRoleChange(m.user_id, e.target.value)}
                          className='bg-kr0n-black border border-kr0n-line text-white px-2 py-1 text-xs outline-none uppercase font-bold'
                        >
                          <option value='admin'>Admin</option>
                          <option value='member'>Member</option>
                        </select>
                      )}
                    </div>

                    <div className='col-span-2'>
                      <span className='px-1.5 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                        Active
                      </span>
                    </div>

                    <div className='col-span-2 text-right'>
                      {m.role_id !== 'owner' && (
                        <button
                          type='button'
                          onClick={() => handleRemoveMember(m.user_id)}
                          className='text-kr0n-muted hover:text-red-400 p-1 transition-colors'
                          title='Remove member'
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                settings.members.map((m) => (
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
                          onChange={(e) => storeChangeMemberRole(m.id, e.target.value)}
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
                          onClick={() => storeRemoveMember(m.id)}
                          className='text-kr0n-muted hover:text-red-400 p-1 transition-colors'
                          title='Remove member'
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: GITHUB APP ─── */}
        {activeTab === 'github' && (
          <div className='space-y-6 font-mono text-xs'>
            <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-bold text-white uppercase'>GitHub App Integrations</h2>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Connect repository access for automated build triggers and VCS monorepo inspection.
                </p>
              </div>
              <button
                type='button'
                onClick={handleConnectGitHub}
                disabled={ghLoading || !currentOrg}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 font-bold uppercase tracking-wider disabled:opacity-50'
              >
                <GitBranch size={12} />
                <span>{ghLoading ? 'Connecting...' : 'Connect GitHub App'}</span>
              </button>
            </div>

            {ghError && (
              <div className='p-3 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2'>
                <AlertCircle size={14} className='shrink-0' />
                <span>{ghError}</span>
              </div>
            )}

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              {ghInstallations && ghInstallations.length > 0 ? (
                ghInstallations.map((inst) => (
                  <div key={inst.id} className='p-4 flex items-center justify-between gap-4'>
                    <div className='space-y-0.5'>
                      <div className='flex items-center gap-2'>
                        <span className='text-white font-bold text-sm'>{inst.account_login || 'GitHub Organization'}</span>
                        <span className='px-1.5 py-0.2 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                          Connected
                        </span>
                      </div>
                      <div className='text-[11px] text-kr0n-text-secondary font-mono'>
                        Installation ID: <span className='text-zinc-300'>{inst.id}</span> · Scope: <span className='text-zinc-300'>{inst.repository_selection || 'all'}</span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/projects/new?org=${encodeURIComponent(currentOrg?.id || '')}`}
                        className='px-3 py-1 border border-kr0n-line hover:border-white text-xs font-bold uppercase tracking-wider text-white'
                      >
                        Browse Repos
                      </Link>
                      <button
                        type='button'
                        onClick={() => handleDisconnectGitHub(inst.installation_id || inst.installationId || inst.id)}
                        className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='p-8 text-center space-y-3'>
                  <GitBranch size={32} className='mx-auto text-kr0n-muted' />
                  <div className='text-white font-bold text-sm'>No GitHub App Connected</div>
                  <p className='text-kr0n-text-secondary max-w-md mx-auto text-xs'>
                    Connect your GitHub account or organization to allow KR0N to import repositories and trigger automated container deployments.
                  </p>
                  <button
                    type='button'
                    onClick={handleConnectGitHub}
                    disabled={ghLoading || !currentOrg}
                    className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-4 py-2 font-bold uppercase tracking-wider mt-2'
                  >
                    Install GitHub App
                  </button>
                </div>
              )}
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
              {backendSessions && backendSessions.length > 0 ? (
                backendSessions.map((sess) => (
                  <div key={sess.id} className='p-4 flex items-center justify-between gap-4'>
                    <div className='space-y-0.5'>
                      <div className='flex items-center gap-2'>
                        <span className='text-white font-bold'>{sess.user_agent || 'Browser Client'}</span>
                        {sess.current && (
                          <span className='px-1.5 py-0.2 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className='text-[10px] text-kr0n-muted'>
                        IP: {sess.ip_address} · Last seen: {new Date(sess.last_seen_at || sess.created_at).toLocaleString()}
                      </div>
                    </div>

                    {!sess.current && (
                      <button
                        type='button'
                        onClick={() => handleRevokeSession(sess.id)}
                        className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              ) : (
                settings.sessions.map((sess) => (
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
                        onClick={() => handleRevokeSession(sess.id)}
                        className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Change Password */}
            <div className='border-t border-kr0n-line-soft pt-6 space-y-4 max-w-xl'>
              <div>
                <h3 className='text-xs font-bold text-white uppercase'>Change Password</h3>
                <p className='text-kr0n-text-secondary font-sans text-xs mt-0.5'>
                  Update your control plane password. Requires active authentication.
                </p>
              </div>

              {passwordChangeError && (
                <div className='border border-red-500/40 bg-red-500/10 p-2 text-xs font-mono text-red-400 flex items-center gap-2'>
                  <AlertCircle size={14} className='shrink-0' />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className='border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs font-mono text-emerald-400 flex items-center gap-2'>
                  <CheckCircle2 size={14} className='shrink-0' />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className='space-y-3'>
                <div>
                  <label className='block text-[11px] font-mono text-kr0n-muted mb-1'>Current Password</label>
                  <input
                    type='password'
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='••••••••'
                    disabled={passwordChangeLoading}
                    className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs text-white px-3 py-2 outline-none'
                  />
                </div>
                <div>
                  <label className='block text-[11px] font-mono text-kr0n-muted mb-1'>New Password</label>
                  <input
                    type='password'
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder='Minimum 8 characters'
                    disabled={passwordChangeLoading}
                    className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs text-white px-3 py-2 outline-none'
                  />
                </div>
                <div>
                  <label className='block text-[11px] font-mono text-kr0n-muted mb-1'>Confirm New Password</label>
                  <input
                    type='password'
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder='Confirm new password'
                    disabled={passwordChangeLoading}
                    className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs text-white px-3 py-2 outline-none'
                  />
                </div>
                <button
                  type='submit'
                  disabled={passwordChangeLoading}
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50'
                >
                  {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Account Sign Out */}
            <div className='border-t border-kr0n-line-soft pt-4'>
              <div className='border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between gap-4'>
                <div>
                  <div className='text-xs font-bold text-white uppercase'>Sign Out of Workspace</div>
                  <div className='text-[11px] text-kr0n-text-secondary font-sans mt-0.5'>
                    Revokes your active session token and returns to login.
                  </div>
                </div>
                <button
                  type='button'
                  onClick={handleSignOut}
                  className='clipped-btn px-3 py-1.5 border border-red-500/40 hover:bg-red-500 hover:text-white text-red-400 text-xs font-mono uppercase font-bold tracking-wider transition-colors'
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className='p-3 border border-kr0n-line-soft bg-kr0n-black text-[11px] text-kr0n-muted font-sans leading-relaxed'>
              <strong className='text-white font-mono'>Security Policy:</strong> Multi-factor authentication is configured through your identity provider. Session tokens expire after 30 days of inactivity.
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
                  Personal Access Tokens (<code className='text-white'>kr0n_pat_...</code>) for the kr0n CLI and CI/CD automation pipelines.
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
              {backendTokens && backendTokens.length > 0 ? (
                backendTokens.map((tok) => (
                  <div key={tok.id} className='p-4 flex items-center justify-between gap-4'>
                    <div className='space-y-0.5'>
                      <div className='text-white font-bold'>{tok.name}</div>
                      <div className='text-[11px] text-kr0n-text-secondary font-mono'>
                        Prefix: <span className='text-white select-all'>{tok.token_prefix}••••••••</span> · Scopes:{' '}
                        <span className='text-emerald-400 font-bold'>
                          {tok.permissions?.join(', ') || 'full-access'}
                        </span>
                      </div>
                      <div className='text-[10px] text-kr0n-muted'>
                        Created {new Date(tok.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={() => handleRevokeToken(tok.id)}
                      className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                    >
                      Revoke
                    </button>
                  </div>
                ))
              ) : (
                settings.apiTokens.map((tok) => (
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
                      onClick={() => handleRevokeToken(tok.id)}
                      className='px-2.5 py-1 border border-kr0n-line hover:border-red-400 text-kr0n-text-secondary hover:text-red-400 transition-colors'
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
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

              {filteredAuditLogs.map((log) => {
                const logId = log.id;
                const actor = log.actor || log.actor_user_id || log.actor_type || 'system';
                const action = log.action || 'MUTATION';
                const resource =
                  log.resource ||
                  `${log.resource_type || 'entity'}${log.resource_id ? ' (' + log.resource_id.slice(0, 8) + ')' : ''}`;
                const time = log.time || (log.created_at ? new Date(log.created_at).toLocaleString() : 'recently');
                const ip = log.ip || log.ip_address || '—';

                return (
                  <div key={logId} className='p-3.5 grid grid-cols-12 items-center hover:bg-white/[0.015] transition-colors'>
                    <div className='col-span-4 space-y-0.5 min-w-0 pr-2'>
                      <div className='text-white font-bold truncate text-[11px]'>{actor}</div>
                      <span className='px-1.5 py-0.2 bg-white/5 border border-kr0n-line text-[9px] text-zinc-300 font-bold uppercase'>
                        {action}
                      </span>
                    </div>

                    <div className='col-span-5 text-kr0n-text-secondary truncate text-[11px] font-mono'>
                      {resource}
                    </div>

                    <div className='col-span-3 text-right text-[10px] text-kr0n-muted space-y-0.5'>
                      <div>{time}</div>
                      <div className='text-[9px] text-zinc-500'>{ip}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Create Workspace Modal ─── */}
      {showCreateOrgModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Create Organization Workspace</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Provisions a new multi-tenant organization boundary in the KR0N control plane.
            </p>
            <form onSubmit={handleCreateOrganization} className='space-y-4'>
              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Organization Name</label>
                <input
                  type='text'
                  required
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug || newOrgSlug === newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder='e.g. Acme Corp'
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Workspace Slug (URL Safe)</label>
                <input
                  type='text'
                  required
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder='e.g. acme-corp'
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowCreateOrgModal(false)}
                  className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={actionLoading}
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase transition-colors disabled:opacity-50'
                >
                  {actionLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Invite Member Modal ─── */}
      {showInviteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Invite Team Member</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Grant workspace access and configure role permissions for {currentOrg?.name || 'your organization'}.
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
                  <option value='member'>Member (Standard project & deployment access)</option>
                  <option value='admin'>Admin (Manage workspace, members & API tokens)</option>
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
            <h3 className='text-sm font-bold text-white uppercase'>Create Personal Access Token</h3>

            {!generatedToken ? (
              <form onSubmit={handleCreateToken} className='space-y-4'>
                <p className='text-kr0n-text-secondary font-sans'>
                  Generate an authenticated credential (<code className='text-white'>kr0n_pat_...</code>) for automated CI/CD runners or local CLI handshakes.
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
