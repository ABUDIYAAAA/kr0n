'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  LogOut,
  ExternalLink,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
  Link2,
  Key,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getStoredUser,
  getMe,
  resendVerification,
  getSessions,
  revokeSession as authRevokeSession,
  changePassword,
  logout,
  getMembers,
  addMember as apiAddMember,
  inviteMember as apiInviteMember,
  revokeInvite as apiRevokeInvite,
  updateMemberRole as apiUpdateMemberRole,
  removeMember as apiRemoveMember,
  getApiTokens,
  createApiToken as apiCreateApiToken,
  revokeApiToken as apiRevokeApiToken,
  getAuditLogs,
  validatePasswordPolicy,
} from '@/lib/auth';
import {
  useWorkspace,
  slugifyOrgName,
  validateOrgSlugPolicy,
} from '@/lib/workspace-context';
import { githubApi } from '@/lib/github-api';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'organization', label: 'Organization' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security', label: 'Security' },
  { id: 'tokens', label: 'API tokens' },
  { id: 'audit', label: 'Audit log' },
];

const DEFAULT_PERMISSIONS = [
  'org:read',
  'org:update',
  'member:read',
  'member:create',
  'member:update',
  'member:delete',
  'project:read',
  'project:create',
  'project:update',
  'project:delete',
  'service:read',
  'service:create',
  'service:update',
  'service:delete',
  'deployment:create',
  'env:read',
  'env:write',
  'audit:read',
  'apitoken:read',
  'apitoken:create',
  'apitoken:delete',
];

const AUDIT_ACTIONS = [
  { value: '', label: 'All actions' },
  { value: 'org.created', label: 'org.created' },
  { value: 'org.updated', label: 'org.updated' },
  { value: 'member.added', label: 'member.added' },
  { value: 'member.role_updated', label: 'member.role_updated' },
  { value: 'member.removed', label: 'member.removed' },
  { value: 'invite.created', label: 'invite.created' },
  { value: 'invite.revoked', label: 'invite.revoked' },
  { value: 'invite.accepted', label: 'invite.accepted' },
  { value: 'apitoken.created', label: 'apitoken.created' },
  { value: 'apitoken.revoked', label: 'apitoken.revoked' },
  { value: 'github.installation.created', label: 'github.installation.created' },
  { value: 'github.installation.deleted', label: 'github.installation.deleted' },
];

const TOKEN_EXPIRY_OPTIONS = [
  { label: '7 days', seconds: 7 * 86400 },
  { label: '30 days', seconds: 30 * 86400 },
  { label: '90 days', seconds: 90 * 86400 },
  { label: '1 year', seconds: 365 * 86400 },
];

const AUDIT_PAGE_SIZE = 20;

function formatTimestamp(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return String(ts);
  return date.toLocaleString();
}

export default function GlobalSettingsPage() {
  const router = useRouter();
  const {
    organizations,
    activeOrg,
    activeOrgId,
    roles,
    setActiveOrgId,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    resetWorkspace,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState('profile');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Profile & Verification state
  const [userProfile, setUserProfile] = useState(() => getStoredUser());
  const [resendLoading, setResendLoading] = useState(false);

  // Organization state
  const [orgNameEdit, setOrgNameEdit] = useState('');
  const [orgUpdating, setOrgUpdating] = useState(false);
  const [orgDeleting, setOrgDeleting] = useState(false);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(false);
  const [newOrgOpen, setNewOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgLoading, setNewOrgLoading] = useState(false);

  // Members & Invites state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState('invite');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [sessionInvites, setSessionInvites] = useState([]);
  const [copiedInviteId, setCopiedInviteId] = useState(null);

  // GitHub Integrations state
  const [ghInstallations, setGhInstallations] = useState([]);
  const [ghLoading, setGhLoading] = useState(false);

  // Security & Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // API Tokens state
  const [apiTokens, setApiTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [newTokenOpen, setNewTokenOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenPermissions, setTokenPermissions] = useState(['project:read', 'service:read']);
  const [tokenExpirySeconds, setTokenExpirySeconds] = useState(30 * 86400);
  const [tokenCreating, setTokenCreating] = useState(false);
  const [createdTokenSecret, setCreatedTokenSecret] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Audit Log state
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    if (!inviteOpen && !newTokenOpen && !newOrgOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInviteOpen(false);
        setNewTokenOpen(false);
        setNewOrgOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inviteOpen, newTokenOpen, newOrgOpen]);

  const availableRoleOptions =
    Array.isArray(roles) && roles.length > 0
      ? roles
      : [
          { id: 'owner', name: 'Owner', description: 'Full organization ownership', permissions: DEFAULT_PERMISSIONS },
          { id: 'admin', name: 'Admin', description: 'Manage projects, members, and tokens', permissions: DEFAULT_PERMISSIONS },
          { id: 'member', name: 'Member', description: 'Read access to organization resources', permissions: ['org:read', 'member:read', 'project:read', 'service:read', 'env:read'] },
        ];

  const callerRoleObj = availableRoleOptions.find(
    (r) => r.id === (activeOrg?.role_id || 'owner')
  );
  const callerPermissions =
    Array.isArray(callerRoleObj?.permissions) && callerRoleObj.permissions.length > 0
      ? callerRoleObj.permissions
      : DEFAULT_PERMISSIONS;

  const [syncedOrgKey, setSyncedOrgKey] = useState('');
  const currentOrgKey = `${activeOrg?.id || ''}:${activeOrg?.name || ''}:${activeOrg?.role_id || ''}`;
  if (syncedOrgKey !== currentOrgKey) {
    setSyncedOrgKey(currentOrgKey);
    setOrgNameEdit(activeOrg?.name || '');
    setConfirmDeleteOrg(false);
    setAuditOffset(0);
    setTokenPermissions((prev) => {
      const validSubset = prev.filter((p) => callerPermissions.includes(p));
      if (validSubset.length > 0) return validSubset;
      const defaultRead = ['project:read', 'service:read'].filter((p) =>
        callerPermissions.includes(p)
      );
      return defaultRead.length > 0 ? defaultRead : callerPermissions.slice(0, 1);
    });
  }

  const activeOrgInvites = sessionInvites.filter(
    (inv) => (inv.org_id || activeOrg?.id) === activeOrg?.id
  );

  const fetchAuditForOrg = useCallback(async (orgId, offsetVal, actionVal) => {
    if (!orgId) return;
    await Promise.resolve();
    setAuditLoading(true);
    try {
      const events = await getAuditLogs(orgId, {
        limit: AUDIT_PAGE_SIZE,
        offset: offsetVal,
        action: actionVal,
      });
      setAuditEvents(Array.isArray(events) ? events : []);
    } catch {
      setAuditEvents([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const fetchOrgSubResources = useCallback(async (orgId) => {
    if (!orgId) return;
    await Promise.resolve();
    setMembersLoading(true);
    setTokensLoading(true);
    setGhLoading(true);

    try {
      const [membersData, tokensData, ghData] = await Promise.all([
        getMembers(orgId).catch(() => []),
        getApiTokens(orgId).catch(() => []),
        githubApi(`orgs/${orgId}/github/installations`).catch(() => ({ installations: [] })),
      ]);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setApiTokens(Array.isArray(tokensData) ? tokensData : []);
      setGhInstallations(Array.isArray(ghData?.installations) ? ghData.installations : []);
    } finally {
      setMembersLoading(false);
      setTokensLoading(false);
      setGhLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUserAndSessions() {
      await Promise.resolve();
      if (!active) return;
      setSessionsLoading(true);
      try {
        const me = await getMe();
        if (!active) return;
        if (me) setUserProfile(me);
        const sess = await getSessions().catch(() => []);
        if (active) setSessions(Array.isArray(sess) ? sess : []);
      } finally {
        if (active) setSessionsLoading(false);
      }
    }

    loadUserAndSessions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeOrgId) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchOrgSubResources(activeOrgId);
    });
    return () => {
      active = false;
    };
  }, [activeOrgId, fetchOrgSubResources]);

  useEffect(() => {
    if (!activeOrgId) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchAuditForOrg(activeOrgId, auditOffset, auditActionFilter);
    });
    return () => {
      active = false;
    };
  }, [activeOrgId, auditOffset, auditActionFilter, fetchAuditForOrg]);

  const clearFeedback = () => {
    setActionError('');
    setActionSuccess('');
  };

  // Profile actions
  const handleResendVerification = async () => {
    if (!userProfile?.email) return;
    clearFeedback();
    setResendLoading(true);
    try {
      await resendVerification(userProfile.email);
      setActionSuccess(`Verification email sent to ${userProfile.email}.`);
    } catch (err) {
      setActionError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  // Organization actions
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    clearFeedback();
    const derivedSlug = newOrgSlug.trim() || slugifyOrgName(newOrgName);
    const slugCheck = validateOrgSlugPolicy(derivedSlug);
    if (!slugCheck.valid) {
      setActionError(slugCheck.error);
      return;
    }

    setNewOrgLoading(true);
    try {
      const created = await createOrganization(newOrgName.trim(), derivedSlug);
      setNewOrgName('');
      setNewOrgSlug('');
      setNewOrgOpen(false);
      setActionSuccess(`Organization "${created.name}" created.`);
    } catch (err) {
      setActionError(err.message || 'Failed to create organization.');
    } finally {
      setNewOrgLoading(false);
    }
  };

  const handleRenameOrg = async (e) => {
    e.preventDefault();
    if (!activeOrg?.id || !orgNameEdit.trim() || orgNameEdit.trim() === activeOrg.name) return;
    clearFeedback();
    setOrgUpdating(true);
    try {
      await updateOrganization(activeOrg.id, orgNameEdit.trim());
      setActionSuccess('Organization name updated.');
    } catch (err) {
      setActionError(err.message || 'Failed to update organization name.');
    } finally {
      setOrgUpdating(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!activeOrg?.id) return;
    clearFeedback();
    setOrgDeleting(true);
    try {
      const deletedName = activeOrg.name;
      await deleteOrganization(activeOrg.id);
      setConfirmDeleteOrg(false);
      setActionSuccess(`Organization "${deletedName}" deleted.`);
    } catch (err) {
      setActionError(
        err.message || 'Failed to delete organization. You cannot delete your only organization.'
      );
      setConfirmDeleteOrg(false);
    } finally {
      setOrgDeleting(false);
    }
  };

  // Members & invites actions
  const handleAddOrInviteMember = async (e) => {
    e.preventDefault();
    if (!activeOrg?.id || !inviteEmail.trim()) return;
    clearFeedback();
    setInviteLoading(true);

    try {
      if (inviteMode === 'direct') {
        await apiAddMember(activeOrg.id, inviteEmail.trim(), inviteRole);
        const refreshed = await getMembers(activeOrg.id);
        setMembers(Array.isArray(refreshed) ? refreshed : []);
        setActionSuccess(`Added ${inviteEmail.trim()} to ${activeOrg.name}.`);
      } else {
        const invite = await apiInviteMember(activeOrg.id, inviteEmail.trim(), inviteRole);
        if (invite?.id || invite?.token) {
          setSessionInvites((prev) => [invite, ...prev]);
        }
        setActionSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      }
      setInviteEmail('');
      setInviteOpen(false);
      fetchAuditForOrg(activeOrg.id, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to process membership request.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = (invite) => {
    if (!invite?.token || typeof window === 'undefined') return;
    const url = `${window.location.origin}/invites/accept?token=${encodeURIComponent(invite.token)}`;
    navigator.clipboard?.writeText(url);
    setCopiedInviteId(invite.id || invite.token);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handleRevokeInvite = async (invite) => {
    const targetOrgId = invite?.org_id || activeOrg?.id;
    const inviteId = invite?.id;
    if (!targetOrgId || !inviteId) return;
    clearFeedback();
    try {
      await apiRevokeInvite(targetOrgId, inviteId);
      setSessionInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      setActionSuccess('Invitation revoked.');
      fetchAuditForOrg(targetOrgId, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to revoke invitation.');
    }
  };

  const handleUpdateRole = async (targetUserId, newRoleId) => {
    if (!activeOrg?.id) return;
    clearFeedback();
    try {
      await apiUpdateMemberRole(activeOrg.id, targetUserId, newRoleId);
      const refreshed = await getMembers(activeOrg.id);
      setMembers(Array.isArray(refreshed) ? refreshed : []);
      setActionSuccess('Member role updated.');
      fetchAuditForOrg(activeOrg.id, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!activeOrg?.id) return;
    clearFeedback();
    try {
      await apiRemoveMember(activeOrg.id, targetUserId);
      setMembers((prev) => prev.filter((m) => (m.user_id || m.id) !== targetUserId));
      setActionSuccess('Member removed from organization.');
      fetchAuditForOrg(activeOrg.id, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to remove member.');
    }
  };

  // GitHub integrations actions
  const handleConnectGitHub = async () => {
    if (!activeOrg?.id) return;
    clearFeedback();
    setGhLoading(true);
    try {
      const data = await githubApi(`orgs/${activeOrg.id}/github/installations/start`);
      const targetUrl = data?.install_url || data?.installUrl;
      if (targetUrl) {
        if (data?.state) {
          const installMeta = JSON.stringify({ org: activeOrg.id, state: data.state });
          sessionStorage.setItem('kr0n_github_install', installMeta);
          localStorage.setItem('kr0n_github_install', installMeta);
        }
        window.location.href = targetUrl;
      } else {
        setActionError('GitHub App installation URL was not returned by the server.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to initiate GitHub App installation.');
    } finally {
      setGhLoading(false);
    }
  };

  const handleDisconnectGitHub = async (installationId) => {
    if (!activeOrg?.id || !installationId) return;
    clearFeedback();
    setGhLoading(true);
    try {
      await githubApi(`orgs/${activeOrg.id}/github/installations/${installationId}`, {
        method: 'DELETE',
      });
      setGhInstallations((prev) =>
        prev.filter((inst) => String(inst.installation_id) !== String(installationId))
      );
      setActionSuccess(`Disconnected GitHub installation #${installationId}.`);
    } catch (err) {
      setActionError(err.message || 'Failed to disconnect GitHub installation.');
    } finally {
      setGhLoading(false);
    }
  };

  // Security & sessions actions
  const handleRevokeSession = async (sessionId) => {
    clearFeedback();
    try {
      await authRevokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActionSuccess('Session revoked.');
    } catch (err) {
      setActionError(err.message || 'Failed to revoke session.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    const passCheck = validatePasswordPolicy(newPassword);
    if (!passCheck.valid) {
      setPasswordChangeError(passCheck.error);
      return;
    }

    setPasswordChangeLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordChangeSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordChangeError(err.message || 'Failed to change password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    resetWorkspace();
    router.push('/login');
  };

  // API tokens actions
  const toggleTokenPermission = (perm) => {
    setTokenPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    if (!activeOrg?.id || !tokenName.trim()) return;
    if (tokenPermissions.length === 0) {
      setActionError('Select at least one permission scope for the API token.');
      return;
    }

    clearFeedback();
    setTokenCreating(true);
    try {
      const resp = await apiCreateApiToken(
        activeOrg.id,
        tokenName.trim(),
        tokenPermissions,
        Number(tokenExpirySeconds)
      );
      if (resp?.secret) setCreatedTokenSecret(resp.secret);
      const refreshed = await getApiTokens(activeOrg.id);
      setApiTokens(Array.isArray(refreshed) ? refreshed : []);
      setTokenName('');
      setNewTokenOpen(false);
      setActionSuccess('API token created.');
      fetchAuditForOrg(activeOrg.id, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to create API token.');
    } finally {
      setTokenCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId) => {
    if (!activeOrg?.id || !tokenId) return;
    clearFeedback();
    try {
      await apiRevokeApiToken(activeOrg.id, tokenId);
      setApiTokens((prev) => prev.filter((t) => t.id !== tokenId));
      setActionSuccess('API token revoked.');
      fetchAuditForOrg(activeOrg.id, auditOffset, auditActionFilter);
    } catch (err) {
      setActionError(err.message || 'Failed to revoke API token.');
    }
  };

  const handleCopyToken = (val) => {
    navigator.clipboard?.writeText(val);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const filteredAuditEvents = auditEvents.filter((entry) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      (entry.action || '').toLowerCase().includes(q) ||
      (entry.actor_user_id || '').toLowerCase().includes(q) ||
      (entry.resource_type || '').toLowerCase().includes(q) ||
      (entry.resource_id || '').toLowerCase().includes(q) ||
      (entry.ip_address || '').toLowerCase().includes(q)
    );
  });

  const displayName =
    userProfile?.display_name ||
    userProfile?.displayName ||
    userProfile?.email?.split('@')[0] ||
    'User';
  const emailVerified = Boolean(userProfile?.email_verified);

  return (
    <div className='flex-1 flex flex-col bg-kr0n-canvas text-kr0n-text'>
      {/* Header + Top Underline Tab Bar (eliminates nested double sidebar) */}
      <div className='border-b border-kr0n-line bg-kr0n-canvas'>
        <div className='max-w-[1152px] px-6 sm:px-8 pt-7 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight text-white'>
              Settings
            </h1>
            <p className='text-[13px] text-kr0n-muted'>
              Account profile, organizations, GitHub integrations, API tokens, and audit history.
            </p>
          </div>

          <div className='flex items-center gap-2.5'>
            {organizations.length > 0 && (
              <select
                value={activeOrg?.id || ''}
                onChange={(e) => setActiveOrgId(e.target.value)}
                aria-label='Active organization'
                className='h-9 rounded-[6px] bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong text-xs font-medium text-white px-3 outline-none transition-colors duration-150'
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className='bg-kr0n-black text-white'>
                    {org.name} ({org.role_id || 'member'})
                  </option>
                ))}
              </select>
            )}
            <button
              type='button'
              onClick={handleSignOut}
              className='h-9 px-3 rounded-[6px] inline-flex items-center gap-1.5 border border-kr0n-line hover:border-red-500/40 bg-kr0n-black text-kr0n-muted hover:text-kr0n-error text-xs font-medium transition-colors duration-150 cursor-pointer'
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Underline Tabs */}
        <div className='max-w-[1152px] px-6 sm:px-8 flex items-center gap-6 overflow-x-auto no-scrollbar' role='tablist' aria-label='Settings sections'>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                role='tab'
                aria-selected={active}
                onClick={() => {
                  clearFeedback();
                  setActiveTab(tab.id);
                }}
                className={`h-11 text-[13px] border-b transition-colors duration-150 shrink-0 cursor-pointer ${
                  active
                    ? 'border-kr0n-accent text-white font-medium'
                    : 'border-transparent text-kr0n-muted hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className='max-w-[1152px] w-full px-6 sm:px-8 py-8 space-y-6'>
        {actionError && (
          <div
            role='alert'
            className='rounded-[6px] border border-red-500/35 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-3 text-xs text-red-300'
          >
            <div className='flex items-center gap-2'>
              <AlertTriangle size={14} className='text-kr0n-error shrink-0' />
              <span>{actionError}</span>
            </div>
            <button type='button' onClick={() => setActionError('')} className='underline shrink-0 cursor-pointer'>
              Dismiss
            </button>
          </div>
        )}

        {actionSuccess && (
          <div
            role='status'
            className='rounded-[6px] border border-kr0n-healthy/40 bg-kr0n-healthy/10 px-4 py-3 flex items-center justify-between gap-3 text-xs text-kr0n-healthy'
          >
            <div className='flex items-center gap-2'>
              <Check size={14} className='shrink-0' />
              <span>{actionSuccess}</span>
            </div>
            <button type='button' onClick={() => setActionSuccess('')} className='underline shrink-0 cursor-pointer'>
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: PROFILE (Two-column settings layout) */}
        {activeTab === 'profile' && (
          <div className='divide-y divide-kr0n-line'>
            <section className='pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
              <div className='lg:col-span-4 space-y-1.5 pt-1'>
                <h2 className='text-base font-medium text-white'>Personal profile</h2>
                <p className='text-[13px] text-kr0n-muted leading-relaxed'>
                  Account identity synced from authentication. Profile editing is coming soon.
                </p>
              </div>

              <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-11 h-11 rounded-full bg-kr0n-surface-2 border border-kr0n-line text-white flex items-center justify-center font-mono text-sm font-medium uppercase shrink-0'>
                    {displayName.slice(0, 2)}
                  </div>
                  <div className='min-w-0'>
                    <div className='text-sm font-semibold text-white flex items-center gap-2.5 flex-wrap'>
                      <span>{displayName}</span>
                      <span
                        className={`text-xs font-mono ${
                          emailVerified ? 'text-kr0n-healthy' : 'text-kr0n-warning'
                        }`}
                      >
                        {emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div className='text-xs font-mono text-kr0n-muted mt-0.5 truncate'>
                      {userProfile?.email || '—'}
                    </div>
                  </div>
                </div>

                {!emailVerified && userProfile?.email && (
                  <div className='rounded-[6px] border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='space-y-0.5'>
                      <div className='text-xs font-medium text-kr0n-warning flex items-center gap-1.5'>
                        <Mail size={13} />
                        <span>Email verification pending</span>
                      </div>
                      <p className='text-xs text-kr0n-text-secondary'>
                        Verify your email address for account recovery and notifications.
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className='shrink-0 h-8 px-3.5 rounded-[6px] bg-kr0n-warning text-kr0n-black text-xs font-medium disabled:opacity-50 cursor-pointer'
                    >
                      {resendLoading ? 'Sending...' : 'Resend email'}
                    </button>
                  </div>
                )}

                <dl className='divide-y divide-kr0n-line-soft border-t border-kr0n-line-soft text-xs'>
                  <div className='py-3 flex items-center justify-between gap-4'>
                    <dt className='text-kr0n-muted'>Display name</dt>
                    <dd className='text-white'>{userProfile?.display_name || userProfile?.displayName || '—'}</dd>
                  </div>
                  <div className='py-3 flex items-center justify-between gap-4'>
                    <dt className='text-kr0n-muted'>Email</dt>
                    <dd className='font-mono text-white truncate'>{userProfile?.email || '—'}</dd>
                  </div>
                  <div className='py-3 flex items-center justify-between gap-4'>
                    <dt className='text-kr0n-muted'>User ID</dt>
                    <dd className='font-mono text-kr0n-text-secondary select-all truncate'>
                      {userProfile?.id || userProfile?.user_id || '—'}
                    </dd>
                  </div>
                  <div className='py-3 flex items-center justify-between gap-4'>
                    <dt className='text-kr0n-muted'>Status &amp; created</dt>
                    <dd className='font-mono tabular-nums text-kr0n-text-secondary'>
                      <span className='text-kr0n-healthy'>{userProfile?.status || 'active'}</span>
                      {' · '}
                      {formatTimestamp(userProfile?.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ORGANIZATION & MEMBERS */}
        {activeTab === 'organization' && (
          <div className='divide-y divide-kr0n-line'>
            {/* Row 1: Org Workspace */}
            <section className='pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
              <div className='lg:col-span-4 space-y-3 pt-1'>
                <div className='space-y-1.5'>
                  <h2 className='text-base font-medium text-white'>Organization</h2>
                  <p className='text-[13px] text-kr0n-muted leading-relaxed'>
                    Rename the active workspace or create a separate organization for another team.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setNewOrgOpen(true)}
                  className='inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] border border-kr0n-line hover:border-kr0n-line-strong bg-kr0n-black text-xs font-medium text-white transition-colors duration-150 cursor-pointer'
                >
                  <Plus size={13} />
                  <span>New organization</span>
                </button>
              </div>

              <div className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-5'>
                {activeOrg ? (
                  <>
                    <dl className='grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-kr0n-line-soft text-xs'>
                      <div className='space-y-1'>
                        <dt className='text-kr0n-muted'>Slug</dt>
                        <dd className='font-mono text-white truncate'>{activeOrg.slug}</dd>
                      </div>
                      <div className='space-y-1'>
                        <dt className='text-kr0n-muted'>Your role</dt>
                        <dd className='font-mono text-kr0n-healthy'>{activeOrg.role_id || 'member'}</dd>
                      </div>
                      <div className='space-y-1'>
                        <dt className='text-kr0n-muted'>Organization ID</dt>
                        <dd className='font-mono text-kr0n-text-secondary truncate' title={activeOrg.id}>
                          {activeOrg.id}
                        </dd>
                      </div>
                    </dl>

                    <form onSubmit={handleRenameOrg} className='flex flex-col sm:flex-row sm:items-end gap-3'>
                      <div className='flex-1 space-y-1.5'>
                        <label htmlFor='org-rename-input' className='block text-[13px] font-medium text-white'>
                          Organization name
                        </label>
                        <input
                          id='org-rename-input'
                          type='text'
                          required
                          maxLength={100}
                          value={orgNameEdit}
                          onChange={(e) => setOrgNameEdit(e.target.value)}
                          disabled={orgUpdating}
                          className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none transition-colors duration-150'
                        />
                      </div>
                      <button
                        type='submit'
                        disabled={
                          orgUpdating ||
                          !orgNameEdit.trim() ||
                          orgNameEdit.trim() === activeOrg.name
                        }
                        className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 transition-colors duration-150 cursor-pointer shrink-0'
                      >
                        {orgUpdating ? 'Saving...' : 'Rename'}
                      </button>
                    </form>

                    <div className='pt-4 border-t border-kr0n-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='space-y-0.5'>
                        <div className='text-xs font-medium text-kr0n-error'>Delete organization</div>
                        <p className='text-xs text-kr0n-muted'>
                          Permanently delete <span className='text-white'>{activeOrg.name}</span>. Your sole remaining organization cannot be deleted.
                        </p>
                      </div>
                      {!confirmDeleteOrg ? (
                        <button
                          type='button'
                          onClick={() => setConfirmDeleteOrg(true)}
                          className='shrink-0 h-8 px-3 rounded-[6px] border border-red-500/40 hover:border-red-400 text-kr0n-error text-xs font-medium transition-colors duration-150 cursor-pointer'
                        >
                          Delete
                        </button>
                      ) : (
                        <div className='flex items-center gap-2 shrink-0'>
                          <button
                            type='button'
                            onClick={handleDeleteOrg}
                            disabled={orgDeleting}
                            className='h-8 px-3 rounded-[6px] bg-kr0n-error text-white text-xs font-medium disabled:opacity-50 cursor-pointer'
                          >
                            {orgDeleting ? 'Deleting...' : 'Confirm delete'}
                          </button>
                          <button
                            type='button'
                            onClick={() => setConfirmDeleteOrg(false)}
                            className='h-8 px-3 rounded-[6px] border border-kr0n-line text-kr0n-muted hover:text-white text-xs cursor-pointer'
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='py-6 text-center text-sm text-kr0n-muted'>
                    No active organization loaded.
                  </div>
                )}
              </div>
            </section>

            {/* Pending Session Invites */}
            {activeOrgInvites.length > 0 && (
              <section className='py-8 space-y-4'>
                <div>
                  <h3 className='text-base font-medium text-white'>Pending invitations</h3>
                  <p className='text-xs text-kr0n-muted mt-0.5'>
                    Copy an acceptance link or revoke pending invitations created in this session.
                  </p>
                </div>

                <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black divide-y divide-kr0n-line-soft'>
                  {activeOrgInvites.map((inv) => {
                    const invKey = inv.id || inv.token;
                    return (
                      <div key={invKey} className='px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                        <div className='space-y-0.5 min-w-0'>
                          <div className='text-xs font-mono text-white flex items-center gap-2.5'>
                            <span>{inv.email}</span>
                            <span className='text-kr0n-healthy'>{inv.role_id || 'member'}</span>
                          </div>
                          <div className='text-xs font-mono tabular-nums text-kr0n-muted'>
                            Expires {formatTimestamp(inv.expires_at)}
                          </div>
                        </div>

                        <div className='flex items-center gap-2 shrink-0'>
                          {inv.token && (
                            <button
                              type='button'
                              onClick={() => handleCopyInviteLink(inv)}
                              className='h-8 px-3 rounded-[6px] inline-flex items-center gap-1.5 border border-kr0n-line hover:border-kr0n-line-strong text-white text-xs cursor-pointer'
                            >
                              {copiedInviteId === invKey ? (
                                <>
                                  <Check size={12} className='text-kr0n-healthy' />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Link2 size={12} />
                                  <span>Copy link</span>
                                </>
                              )}
                            </button>
                          )}
                          {inv.id && (
                            <button
                              type='button'
                              onClick={() => handleRevokeInvite(inv)}
                              className='h-8 px-3 rounded-[6px] inline-flex items-center gap-1.5 border border-red-500/35 text-kr0n-error text-xs cursor-pointer'
                            >
                              <Trash2 size={12} />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Row 2: Members Table */}
            <section className='pt-8 space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div>
                  <h3 className='text-base font-medium text-white'>
                    Members <span className='font-mono text-xs text-kr0n-muted tabular-nums ml-1'>{members.length}</span>
                  </h3>
                  <p className='text-xs text-kr0n-muted mt-0.5'>
                    Role-based access control across this organization.
                  </p>
                </div>

                <button
                  type='button'
                  onClick={() => setInviteOpen(true)}
                  disabled={!activeOrg}
                  className='h-9 px-3.5 rounded-[6px] inline-flex items-center gap-1.5 bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 transition-colors duration-150 self-start sm:self-auto cursor-pointer'
                >
                  <Plus size={14} />
                  <span>Add or invite member</span>
                </button>
              </div>

              <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
                {membersLoading ? (
                  <div className='p-8 text-center text-[13px] text-kr0n-muted'>Loading members...</div>
                ) : members.length === 0 ? (
                  <div className='p-8 text-center text-[13px] text-kr0n-muted'>
                    No members found in this organization.
                  </div>
                ) : (
                  <table className='w-full text-left text-[13px]'>
                    <thead>
                      <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                        <th className='px-5 py-2.5 font-normal'>Member</th>
                        <th className='px-4 py-2.5 font-normal'>Email</th>
                        <th className='px-4 py-2.5 font-normal'>Role</th>
                        <th className='px-5 py-2.5 font-normal text-right'>Remove</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-kr0n-line-soft'>
                      {members.map((member) => {
                        const memberId = member.user_id || member.id;
                        const memberRole = member.role_id || member.role || 'member';
                        const memberName =
                          member.display_name ||
                          member.name ||
                          member.email?.split('@')[0] ||
                          'User';
                        return (
                          <tr key={memberId} className='hover:bg-kr0n-surface-2/40 transition-colors duration-150'>
                            <td className='px-5 py-3 font-medium text-white'>{memberName}</td>
                            <td className='px-4 py-3 font-mono text-xs text-kr0n-muted'>{member.email}</td>
                            <td className='px-4 py-3'>
                              <select
                                value={memberRole}
                                onChange={(e) => handleUpdateRole(memberId, e.target.value)}
                                aria-label={`Role for ${memberName}`}
                                className='h-8 rounded-[6px] bg-kr0n-canvas border border-kr0n-line hover:border-kr0n-line-strong text-xs font-mono text-white px-2.5 outline-none'
                              >
                                {availableRoleOptions.map((r) => (
                                  <option key={r.id} value={r.id} className='bg-kr0n-black text-white'>
                                    {r.name || r.id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className='px-5 py-3 text-right'>
                              <button
                                type='button'
                                onClick={() => handleRemoveMember(memberId)}
                                className='text-kr0n-muted hover:text-kr0n-error p-1 transition-colors duration-150 cursor-pointer'
                                aria-label={`Remove ${memberName}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <section className='space-y-5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
                <h2 className='text-base font-medium text-white'>GitHub App installations</h2>
                <p className='text-xs text-kr0n-muted mt-0.5'>
                  Connect GitHub accounts or organizations to import repositories into {activeOrg?.name || 'your workspace'}.
                </p>
              </div>

              <div className='flex items-center gap-2.5 self-start sm:self-auto'>
                {activeOrg && (
                  <button
                    type='button'
                    onClick={() => fetchOrgSubResources(activeOrg.id)}
                    className='h-9 px-3 rounded-[6px] inline-flex items-center gap-1.5 border border-kr0n-line bg-kr0n-black text-xs text-kr0n-muted hover:text-white transition-colors duration-150 cursor-pointer'
                  >
                    <RefreshCw size={12} className={ghLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                )}
                <button
                  type='button'
                  onClick={handleConnectGitHub}
                  disabled={ghLoading || !activeOrg}
                  className='h-9 px-4 rounded-[6px] inline-flex items-center gap-1.5 bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 transition-colors duration-150 cursor-pointer'
                >
                  <Plus size={14} />
                  <span>{ghLoading ? 'Connecting...' : 'Install GitHub App'}</span>
                </button>
              </div>
            </div>

            <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-hidden'>
              {ghInstallations.length === 0 ? (
                <div className='p-10 text-center space-y-2'>
                  <p className='text-sm font-medium text-white'>No GitHub installations connected</p>
                  <p className='text-xs text-kr0n-muted max-w-md mx-auto leading-relaxed'>
                    Install the kr0n GitHub App on your account or organization to discover repositories, branches, and monorepo directories.
                  </p>
                </div>
              ) : (
                <table className='w-full text-left text-[13px]'>
                  <thead>
                    <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                      <th className='px-5 py-2.5 font-normal'>Account</th>
                      <th className='px-4 py-2.5 font-normal'>Installation ID</th>
                      <th className='px-4 py-2.5 font-normal'>Status</th>
                      <th className='px-5 py-2.5 font-normal text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-kr0n-line-soft'>
                    {ghInstallations.map((inst) => {
                      const ghInstId = inst.installation_id || inst.installationId;
                      return (
                        <tr key={inst.id || ghInstId} className='hover:bg-kr0n-surface-2/40'>
                          <td className='px-5 py-3.5'>
                            <div className='font-mono text-white font-medium'>
                              {inst.account_login || `GitHub #${ghInstId}`}
                            </div>
                            {inst.account_type && (
                              <div className='text-xs text-kr0n-muted'>{inst.account_type}</div>
                            )}
                          </td>
                          <td className='px-4 py-3.5 font-mono text-xs tabular-nums text-kr0n-text-secondary'>
                            #{ghInstId}
                            {inst.repository_selection ? ` · ${inst.repository_selection}` : ''}
                          </td>
                          <td className='px-4 py-3.5 font-mono text-xs text-kr0n-healthy'>
                            {inst.status || 'active'}
                          </td>
                          <td className='px-5 py-3.5 text-right'>
                            <div className='inline-flex items-center gap-3 text-xs'>
                              <a
                                href='https://github.com/settings/installations'
                                target='_blank'
                                rel='noreferrer'
                                className='text-kr0n-text-secondary hover:text-white inline-flex items-center gap-1'
                              >
                                <span>Configure</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type='button'
                                onClick={() => handleDisconnectGitHub(ghInstId)}
                                className='text-kr0n-error hover:underline cursor-pointer'
                              >
                                Disconnect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: SECURITY & SESSIONS */}
        {activeTab === 'security' && (
          <div className='divide-y divide-kr0n-line'>
            {/* Two-column password change */}
            <section className='pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
              <div className='lg:col-span-4 space-y-1.5 pt-1'>
                <h2 className='text-base font-medium text-white'>Password</h2>
                <p className='text-[13px] text-kr0n-muted leading-relaxed'>
                  Passwords must be between 8 characters and 72 UTF-8 bytes.
                </p>
              </div>

              <form
                onSubmit={handleChangePassword}
                className='lg:col-span-8 rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 space-y-4'
              >
                {passwordChangeError && (
                  <div className='rounded-[6px] border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-300'>
                    {passwordChangeError}
                  </div>
                )}
                {passwordChangeSuccess && (
                  <div className='rounded-[6px] border border-kr0n-healthy/40 bg-kr0n-healthy/10 p-3 text-xs text-kr0n-healthy'>
                    {passwordChangeSuccess}
                  </div>
                )}

                <div className='space-y-1.5'>
                  <label htmlFor='sec-curr-pass' className='block text-[13px] font-medium text-white'>
                    Current password
                  </label>
                  <input
                    id='sec-curr-pass'
                    type='password'
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='Current password'
                    className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label htmlFor='sec-new-pass' className='block text-[13px] font-medium text-white'>
                      New password
                    </label>
                    <input
                      id='sec-new-pass'
                      type='password'
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='8 to 72 bytes'
                      className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label htmlFor='sec-confirm-pass' className='block text-[13px] font-medium text-white'>
                      Confirm new password
                    </label>
                    <input
                      id='sec-confirm-pass'
                      type='password'
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder='Re-enter password'
                      className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
                    />
                  </div>
                </div>

                <div className='flex justify-end pt-1'>
                  <button
                    type='submit'
                    disabled={passwordChangeLoading || !currentPassword || !newPassword}
                    className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 transition-colors duration-150 cursor-pointer'
                  >
                    {passwordChangeLoading ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </form>
            </section>

            {/* Sessions table */}
            <section className='pt-8 space-y-4'>
              <div>
                <h3 className='text-base font-medium text-white'>
                  Active sessions <span className='font-mono text-xs text-kr0n-muted tabular-nums ml-1'>{sessions.length}</span>
                </h3>
                <p className='text-xs text-kr0n-muted mt-0.5'>
                  Authenticated browser and device sessions for your account.
                </p>
              </div>

              <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
                {sessionsLoading ? (
                  <div className='p-8 text-center text-[13px] text-kr0n-muted'>Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className='p-8 text-center text-[13px] text-kr0n-muted'>No active sessions found.</div>
                ) : (
                  <table className='w-full text-left text-[13px]'>
                    <thead>
                      <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                        <th className='px-5 py-2.5 font-normal'>Device / User agent</th>
                        <th className='px-4 py-2.5 font-normal'>IP address</th>
                        <th className='px-4 py-2.5 font-normal text-right'>Last active</th>
                        <th className='px-5 py-2.5 font-normal text-right'>Action</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-kr0n-line-soft'>
                      {sessions.map((sess) => (
                        <tr key={sess.id} className='hover:bg-kr0n-surface-2/40'>
                          <td className='px-5 py-3.5 max-w-md'>
                            <div className='text-white truncate'>
                              {sess.user_agent || 'Authenticated session'}
                            </div>
                          </td>
                          <td className='px-4 py-3.5 font-mono text-xs text-kr0n-muted'>
                            {sess.ip_address || '—'}
                          </td>
                          <td className='px-4 py-3.5 font-mono text-xs tabular-nums text-kr0n-muted text-right'>
                            {formatTimestamp(sess.last_seen_at || sess.created_at)}
                          </td>
                          <td className='px-5 py-3.5 text-right text-xs'>
                            {sess.current ? (
                              <span className='font-mono text-kr0n-healthy'>Current</span>
                            ) : (
                              <button
                                type='button'
                                onClick={() => handleRevokeSession(sess.id)}
                                className='text-kr0n-error hover:underline cursor-pointer'
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: API TOKENS */}
        {activeTab === 'tokens' && (
          <div className='space-y-6'>
            {createdTokenSecret && (
              <div className='rounded-[6px] border border-kr0n-healthy/40 bg-kr0n-healthy/10 p-5 space-y-3'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2 text-kr0n-healthy text-sm font-medium'>
                    <Key size={15} />
                    <span>Copy your new API token now</span>
                  </div>
                  <button
                    type='button'
                    onClick={() => setCreatedTokenSecret(null)}
                    className='text-xs text-kr0n-muted hover:text-white cursor-pointer'
                  >
                    Dismiss
                  </button>
                </div>
                <p className='text-xs text-kr0n-text-secondary'>
                  This secret is displayed once and cannot be retrieved again after you dismiss this banner.
                </p>
                <div className='flex items-center justify-between rounded-[6px] bg-kr0n-black border border-kr0n-line p-3 font-mono text-xs text-kr0n-healthy gap-3'>
                  <span className='truncate select-all'>{createdTokenSecret}</span>
                  <button
                    type='button'
                    onClick={() => handleCopyToken(createdTokenSecret)}
                    className='inline-flex items-center gap-1.5 h-7 px-3 rounded-[6px] bg-kr0n-healthy text-kr0n-black text-xs font-sans font-medium shrink-0 cursor-pointer'
                  >
                    {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div>
                <h2 className='text-base font-medium text-white'>
                  API tokens <span className='font-mono text-xs text-kr0n-muted tabular-nums ml-1'>{apiTokens.length}</span>
                </h2>
                <p className='text-xs text-kr0n-muted mt-0.5'>
                  Scoped bearer tokens for CI/CD pipelines and API automation in {activeOrg?.name || 'this organization'}.
                </p>
              </div>

              <button
                type='button'
                onClick={() => setNewTokenOpen(true)}
                disabled={!activeOrg}
                className='h-9 px-4 rounded-[6px] inline-flex items-center gap-1.5 bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 transition-colors duration-150 self-start sm:self-auto cursor-pointer'
              >
                <Plus size={14} />
                <span>Create token</span>
              </button>
            </div>

            <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
              {tokensLoading ? (
                <div className='p-8 text-center text-[13px] text-kr0n-muted'>Loading API tokens...</div>
              ) : apiTokens.length === 0 ? (
                <div className='p-8 text-center text-[13px] text-kr0n-muted'>
                  No API tokens created for this organization yet.
                </div>
              ) : (
                <table className='w-full text-left text-[13px]'>
                  <thead>
                    <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                      <th className='px-5 py-2.5 font-normal'>Token</th>
                      <th className='px-4 py-2.5 font-normal'>Scopes</th>
                      <th className='px-4 py-2.5 font-normal text-right'>Expires</th>
                      <th className='px-4 py-2.5 font-normal text-right'>Last used</th>
                      <th className='px-5 py-2.5 font-normal text-right'>Revoke</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-kr0n-line-soft'>
                    {apiTokens.map((tok) => (
                      <tr key={tok.id} className='hover:bg-kr0n-surface-2/40'>
                        <td className='px-5 py-3.5'>
                          <div className='font-medium text-white'>{tok.name}</div>
                          <div className='font-mono text-xs text-kr0n-muted'>{tok.token_prefix}...</div>
                        </td>
                        <td className='px-4 py-3.5'>
                          <div className='flex flex-wrap gap-1.5 max-w-sm'>
                            {(tok.permissions || []).slice(0, 4).map((perm) => (
                              <span key={perm} className='font-mono text-[11px] text-kr0n-text-secondary bg-kr0n-canvas border border-kr0n-line px-1.5 py-0.5 rounded-[4px]'>
                                {perm}
                              </span>
                            ))}
                            {(tok.permissions || []).length > 4 && (
                              <span className='font-mono text-[11px] text-kr0n-muted'>
                                +{tok.permissions.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3.5 font-mono text-xs tabular-nums text-kr0n-muted text-right'>
                          {formatTimestamp(tok.expires_at)}
                        </td>
                        <td className='px-4 py-3.5 font-mono text-xs tabular-nums text-kr0n-muted text-right'>
                          {tok.last_used_at ? formatTimestamp(tok.last_used_at) : 'Never'}
                        </td>
                        <td className='px-5 py-3.5 text-right'>
                          <button
                            type='button'
                            onClick={() => handleRevokeToken(tok.id)}
                            className='text-xs text-kr0n-error hover:underline cursor-pointer'
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className='space-y-5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
                <h2 className='text-base font-medium text-white'>Audit log</h2>
                <p className='text-xs text-kr0n-muted mt-0.5'>
                  Security and administrative event history for {activeOrg?.name || 'this organization'}.
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <input
                  type='text'
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder='Filter events...'
                  aria-label='Filter loaded audit events'
                  className='h-9 rounded-[6px] bg-kr0n-black border border-kr0n-line focus:border-kr0n-accent text-xs text-white px-3 outline-none'
                />
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditOffset(0);
                    setAuditActionFilter(e.target.value);
                  }}
                  aria-label='Filter by audit action'
                  className='h-9 rounded-[6px] bg-kr0n-black border border-kr0n-line text-xs font-mono text-white px-2.5 outline-none'
                >
                  {AUDIT_ACTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className='bg-kr0n-black text-white'>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
              {auditLoading ? (
                <div className='p-8 text-center text-[13px] text-kr0n-muted'>Loading audit log...</div>
              ) : filteredAuditEvents.length === 0 ? (
                <div className='p-8 text-center text-[13px] text-kr0n-muted'>
                  No audit events match your filter.
                </div>
              ) : (
                <table className='w-full text-left text-[13px]'>
                  <thead>
                    <tr className='border-b border-kr0n-line text-xs text-kr0n-muted'>
                      <th className='px-5 py-2.5 font-normal'>Action</th>
                      <th className='px-4 py-2.5 font-normal'>Resource</th>
                      <th className='px-4 py-2.5 font-normal'>Actor &amp; IP</th>
                      <th className='px-5 py-2.5 font-normal text-right'>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-kr0n-line-soft'>
                    {filteredAuditEvents.map((entry) => (
                      <tr key={entry.id} className='hover:bg-kr0n-surface-2/40'>
                        <td className='px-5 py-3 font-mono text-xs text-white whitespace-nowrap'>
                          {entry.action}
                        </td>
                        <td className='px-4 py-3 font-mono text-xs text-kr0n-healthy truncate max-w-[240px]'>
                          {entry.resource_type
                            ? `${entry.resource_type}${entry.resource_id ? `:${entry.resource_id}` : ''}`
                            : '—'}
                        </td>
                        <td className='px-4 py-3 font-mono text-xs text-kr0n-muted truncate max-w-[240px]'>
                          <span className='text-kr0n-text-secondary'>
                            {entry.actor_user_id || entry.actor_type || 'system'}
                          </span>
                          {entry.ip_address ? ` · ${entry.ip_address}` : ''}
                        </td>
                        <td className='px-5 py-3 font-mono text-xs tabular-nums text-kr0n-muted text-right whitespace-nowrap'>
                          <span className='inline-flex items-center gap-1.5'>
                            <Clock size={11} />
                            {formatTimestamp(entry.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className='px-5 py-3 border-t border-kr0n-line-soft bg-kr0n-canvas flex items-center justify-between text-xs text-kr0n-muted'>
                <span className='font-mono tabular-nums'>
                  Offset {auditOffset} · {filteredAuditEvents.length} events
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={auditOffset === 0 || auditLoading}
                    onClick={() => setAuditOffset((prev) => Math.max(0, prev - AUDIT_PAGE_SIZE))}
                    className='h-7 px-2.5 rounded-[6px] inline-flex items-center gap-1 border border-kr0n-line hover:border-kr0n-line-strong text-white disabled:opacity-35 cursor-pointer'
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>
                  <button
                    type='button'
                    disabled={auditEvents.length < AUDIT_PAGE_SIZE || auditLoading}
                    onClick={() => setAuditOffset((prev) => prev + AUDIT_PAGE_SIZE)}
                    className='h-7 px-2.5 rounded-[6px] inline-flex items-center gap-1 border border-kr0n-line hover:border-kr0n-line-strong text-white disabled:opacity-35 cursor-pointer'
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / INVITE MEMBER MODAL */}
      {inviteOpen && (
        <div role='dialog' aria-modal='true' aria-label='Add or invite member' className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='fixed inset-0 bg-black/75' onClick={() => setInviteOpen(false)} />
          <form
            onSubmit={handleAddOrInviteMember}
            className='relative w-full max-w-md rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 z-10 space-y-4 shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
          >
            <h3 className='text-base font-semibold text-white'>Add or invite member</h3>

            <div className='flex items-center gap-5 border-b border-kr0n-line text-xs'>
              <button
                type='button'
                onClick={() => setInviteMode('invite')}
                className={`pb-2 border-b transition-colors duration-150 cursor-pointer ${
                  inviteMode === 'invite'
                    ? 'border-kr0n-accent text-white font-medium'
                    : 'border-transparent text-kr0n-muted hover:text-white'
                }`}
              >
                Send email invite
              </button>
              <button
                type='button'
                onClick={() => setInviteMode('direct')}
                className={`pb-2 border-b transition-colors duration-150 cursor-pointer ${
                  inviteMode === 'direct'
                    ? 'border-kr0n-accent text-white font-medium'
                    : 'border-transparent text-kr0n-muted hover:text-white'
                }`}
              >
                Add existing user
              </button>
            </div>

            <p className='text-xs text-kr0n-muted leading-relaxed'>
              {inviteMode === 'invite'
                ? 'Sends an invitation email with an acceptance link (/invites/accept?token=...).'
                : 'Adds an already-registered kr0n account directly to this organization.'}
            </p>

            <div className='space-y-1.5'>
              <label htmlFor='invite-email-input' className='block text-xs font-medium text-kr0n-text-secondary'>
                Email address
              </label>
              <input
                id='invite-email-input'
                type='email'
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder='engineer@northstar.dev'
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
              />
            </div>

            <div className='space-y-1.5'>
              <label htmlFor='invite-role-select' className='block text-xs font-medium text-kr0n-text-secondary'>
                Role
              </label>
              <select
                id='invite-role-select'
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line text-sm text-white px-3 outline-none'
              >
                {availableRoleOptions.map((r) => (
                  <option key={r.id} value={r.id} className='bg-kr0n-black text-white'>
                    {r.name || r.id}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line-soft'>
              <button
                type='button'
                onClick={() => setInviteOpen(false)}
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-kr0n-text-secondary hover:text-white text-xs font-medium cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={inviteLoading}
                className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 cursor-pointer'
              >
                {inviteLoading
                  ? 'Submitting...'
                  : inviteMode === 'invite'
                  ? 'Send invitation'
                  : 'Add member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE API TOKEN MODAL */}
      {newTokenOpen && (
        <div role='dialog' aria-modal='true' aria-label='Create API token' className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='fixed inset-0 bg-black/75' onClick={() => setNewTokenOpen(false)} />
          <form
            onSubmit={handleCreateToken}
            className='relative w-full max-w-lg rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
          >
            <h3 className='text-base font-semibold text-white'>Create API token</h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              <div className='space-y-1.5'>
                <label htmlFor='token-name-input' className='block text-xs font-medium text-kr0n-text-secondary'>
                  Token name
                </label>
                <input
                  id='token-name-input'
                  type='text'
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder='github-actions-ci'
                  className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
                />
              </div>

              <div className='space-y-1.5'>
                <label htmlFor='token-expiry-select' className='block text-xs font-medium text-kr0n-text-secondary'>
                  Expiration
                </label>
                <select
                  id='token-expiry-select'
                  value={tokenExpirySeconds}
                  onChange={(e) => setTokenExpirySeconds(Number(e.target.value))}
                  className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line text-sm text-white px-3 outline-none'
                >
                  {TOKEN_EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.seconds} value={opt.seconds} className='bg-kr0n-black text-white'>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='font-medium text-kr0n-text-secondary'>
                  Permissions ({tokenPermissions.length} selected)
                </span>
                <div className='flex items-center gap-3 text-kr0n-muted'>
                  <button
                    type='button'
                    onClick={() => setTokenPermissions(callerPermissions.filter((p) => p.endsWith(':read')))}
                    className='hover:text-white cursor-pointer'
                  >
                    Read-only
                  </button>
                  <button
                    type='button'
                    onClick={() => setTokenPermissions([...callerPermissions])}
                    className='hover:text-white cursor-pointer'
                  >
                    Select all
                  </button>
                  <button
                    type='button'
                    onClick={() => setTokenPermissions([])}
                    className='hover:text-white cursor-pointer'
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-2.5 rounded-[6px] bg-kr0n-canvas border border-kr0n-line'>
                {callerPermissions.map((perm) => {
                  const checked = tokenPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-xs font-mono cursor-pointer border transition-colors duration-150 ${
                        checked
                          ? 'border-kr0n-accent bg-kr0n-black text-white'
                          : 'border-transparent text-kr0n-muted hover:text-white'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleTokenPermission(perm)}
                        className='accent-kr0n-accent'
                      />
                      <span className='truncate'>{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line-soft'>
              <button
                type='button'
                onClick={() => setNewTokenOpen(false)}
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-kr0n-text-secondary hover:text-white text-xs font-medium cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={tokenCreating || !tokenName.trim() || tokenPermissions.length === 0}
                className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 cursor-pointer'
              >
                {tokenCreating ? 'Creating...' : 'Create token'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE ORGANIZATION MODAL */}
      {newOrgOpen && (
        <div role='dialog' aria-modal='true' aria-label='Create organization' className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='fixed inset-0 bg-black/75' onClick={() => setNewOrgOpen(false)} />
          <form
            onSubmit={handleCreateOrg}
            className='relative w-full max-w-md rounded-[6px] border border-kr0n-line bg-kr0n-black p-6 z-10 space-y-4 shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
          >
            <h3 className='text-base font-semibold text-white'>Create organization</h3>

            <div className='space-y-1.5'>
              <label htmlFor='new-org-name' className='block text-xs font-medium text-kr0n-text-secondary'>
                Organization name
              </label>
              <input
                id='new-org-name'
                type='text'
                required
                maxLength={100}
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  setNewOrgSlug(slugifyOrgName(e.target.value));
                }}
                placeholder='Harbor Studio'
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm text-white px-3 outline-none'
              />
            </div>

            <div className='space-y-1.5'>
              <label htmlFor='new-org-slug' className='block text-xs font-medium text-kr0n-text-secondary'>
                Organization slug (2–63 characters)
              </label>
              <input
                id='new-org-slug'
                type='text'
                required
                minLength={2}
                maxLength={63}
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                placeholder='harbor-studio'
                className='w-full h-9 rounded-[6px] bg-kr0n-canvas border border-kr0n-line focus:border-kr0n-accent text-sm font-mono text-white px-3 outline-none'
              />
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line-soft'>
              <button
                type='button'
                onClick={() => setNewOrgOpen(false)}
                className='h-9 px-3.5 rounded-[6px] border border-kr0n-line text-kr0n-text-secondary hover:text-white text-xs font-medium cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={newOrgLoading || !newOrgName.trim()}
                className='h-9 px-4 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-xs font-medium disabled:opacity-40 cursor-pointer'
              >
                {newOrgLoading ? 'Creating...' : 'Create organization'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
