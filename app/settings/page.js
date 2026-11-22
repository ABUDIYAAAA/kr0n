'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Building2,
  Shield,
  Key,
  ScrollText,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Monitor,
  Clock,
  Lock,
  LogOut,
  Puzzle,
  ExternalLink,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
  Link2,
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
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'tokens', label: 'API Tokens', icon: Key },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
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
  { value: '', label: 'All Actions' },
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
  { label: '7 Days', seconds: 7 * 86400 },
  { label: '30 Days', seconds: 30 * 86400 },
  { label: '90 Days', seconds: 90 * 86400 },
  { label: '1 Year', seconds: 365 * 86400 },
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
    refreshOrganizations,
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
  const [inviteMode, setInviteMode] = useState('invite'); // 'invite' | 'direct'
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

  const fetchAuditForOrg = useCallback(
    async (orgId, offsetVal, actionVal) => {
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
    },
    []
  );

  const fetchOrgSubResources = useCallback(
    async (orgId) => {
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
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function loadUserAndSessions() {
      await Promise.resolve();
      if (!active) return;
      setSessionsLoading(true);
      try {
        const me = await getMe();
        if (!active) return;
        if (me) {
          setUserProfile(me);
        }
        const sess = await getSessions().catch(() => []);
        if (active) {
          setSessions(Array.isArray(sess) ? sess : []);
        }
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
      if (active) {
        fetchOrgSubResources(activeOrgId);
      }
    });
    return () => {
      active = false;
    };
  }, [activeOrgId, fetchOrgSubResources]);

  useEffect(() => {
    if (!activeOrgId) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchAuditForOrg(activeOrgId, auditOffset, auditActionFilter);
      }
    });
    return () => {
      active = false;
    };
  }, [activeOrgId, auditOffset, auditActionFilter, fetchAuditForOrg]);

  const clearFeedback = () => {
    setActionError('');
    setActionSuccess('');
  };

  // ─── Profile Actions ───
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

  // ─── Organization Actions ───
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

  // ─── Members & Invites Actions ───
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

  // ─── GitHub Integrations Actions ───
  const handleConnectGitHub = async () => {
    if (!activeOrg?.id) return;
    clearFeedback();
    setGhLoading(true);
    try {
      const data = await githubApi(`orgs/${activeOrg.id}/github/installations/start`);
      const targetUrl = data?.install_url || data?.installUrl;
      if (targetUrl) {
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

  // ─── Security & Sessions Actions ───
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

  // ─── API Tokens Actions ───
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
      if (resp?.secret) {
        setCreatedTokenSecret(resp.secret);
      }
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
    <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
      {/* ─── HEADER ─── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-kr0n-line pb-5'>
        <div>
          <div className='flex items-center gap-2 text-xs font-mono text-kr0n-muted uppercase tracking-wider mb-1'>
            <span>Workspace</span>
            <span>/</span>
            <span className='text-white'>Account &amp; Organization Settings</span>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-white'>
            Global Settings
          </h1>
        </div>

        <div className='flex items-center gap-3'>
          {organizations.length > 0 && (
            <select
              value={activeOrg?.id || ''}
              onChange={(e) => setActiveOrgId(e.target.value)}
              aria-label='Active Organization'
              className='bg-kr0n-surface border border-kr0n-line hover:border-kr0n-line-strong text-xs font-mono text-white px-3 py-1.5 outline-none uppercase tracking-wider'
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
            className='flex items-center gap-2 border border-kr0n-line hover:border-red-500/40 bg-kr0n-surface hover:bg-red-950/20 text-kr0n-muted hover:text-red-300 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors'
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── FEEDBACK BANNERS ─── */}
      {actionError && (
        <div className='border border-red-500/40 bg-red-950/20 p-3 flex items-center justify-between text-xs font-mono text-red-300'>
          <div className='flex items-center gap-2'>
            <AlertTriangle size={14} className='text-red-400 shrink-0' />
            <span>{actionError}</span>
          </div>
          <button
            type='button'
            onClick={() => setActionError('')}
            className='text-[10px] underline uppercase ml-4'
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className='border border-emerald-500/40 bg-emerald-950/20 p-3 flex items-center justify-between text-xs font-mono text-emerald-300'>
          <div className='flex items-center gap-2'>
            <Check size={14} className='text-emerald-400 shrink-0' />
            <span>{actionSuccess}</span>
          </div>
          <button
            type='button'
            onClick={() => setActionSuccess('')}
            className='text-[10px] underline uppercase ml-4'
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── SETTINGS LAYOUT ─── */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left Navigation */}
        <div className='lg:col-span-3 space-y-1'>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => {
                  clearFeedback();
                  setActiveTab(tab.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all border-l-2 ${
                  active
                    ? 'bg-kr0n-surface text-white border-white font-bold'
                    : 'text-kr0n-muted hover:text-white hover:bg-white/[0.02] border-transparent'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className='lg:col-span-9'>
          {/* ─── TAB 1: PROFILE (Read-Only from GET /api/v1/me) ─── */}
          {activeTab === 'profile' && (
            <div className='border border-kr0n-line bg-kr0n-surface p-6 space-y-6'>
              <div className='flex items-center justify-between border-b border-kr0n-line pb-4'>
                <div>
                  <h2 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
                    Personal Profile
                  </h2>
                  <p className='text-xs text-kr0n-muted mt-1'>
                    Account identity from the KR0N authentication control plane.
                  </p>
                </div>
                <span className='border border-kr0n-line bg-kr0n-black px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-kr0n-muted'>
                  Profile Editing &mdash; Coming Soon
                </span>
              </div>

              <div className='flex items-center gap-4 pb-2'>
                <div className='w-14 h-14 rounded-full bg-white text-black flex items-center justify-center font-mono text-lg font-black uppercase'>
                  {displayName.slice(0, 2)}
                </div>
                <div>
                  <div className='text-sm font-bold text-white flex items-center gap-2'>
                    <span>{displayName}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${
                        emailVerified
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {emailVerified ? 'Verified' : 'Unverified Email'}
                    </span>
                  </div>
                  <div className='text-xs font-mono text-kr0n-muted mt-0.5'>
                    {userProfile?.email || '—'}
                  </div>
                </div>
              </div>

              {!emailVerified && userProfile?.email && (
                <div className='border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div className='space-y-1'>
                    <div className='text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5'>
                      <Mail size={13} />
                      <span>Email Verification Pending</span>
                    </div>
                    <p className='text-xs text-kr0n-muted'>
                      Verify your email address to ensure uninterrupted account recovery and notifications.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className='clipped-btn shrink-0 bg-amber-400 hover:bg-amber-300 text-black px-3.5 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50'
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl'>
                <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                  <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                    Display Name
                  </div>
                  <div className='text-sm font-mono text-white mt-1'>
                    {userProfile?.display_name || userProfile?.displayName || '—'}
                  </div>
                </div>

                <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                  <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                    Email Address
                  </div>
                  <div className='text-sm font-mono text-white mt-1'>
                    {userProfile?.email || '—'}
                  </div>
                </div>

                <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                  <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                    User ID
                  </div>
                  <div className='text-xs font-mono text-kr0n-text-secondary mt-1 break-all'>
                    {userProfile?.id || userProfile?.user_id || '—'}
                  </div>
                </div>

                <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                  <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                    Account Status &amp; Created At
                  </div>
                  <div className='text-xs font-mono text-white mt-1'>
                    <span className='uppercase text-emerald-400 font-bold'>
                      {userProfile?.status || 'active'}
                    </span>{' '}
                    &bull; {formatTimestamp(userProfile?.created_at)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: ORGANIZATION & MEMBERS ─── */}
          {activeTab === 'organization' && (
            <div className='space-y-6'>
              {/* Org Details, Rename & Create */}
              <div className='border border-kr0n-line bg-kr0n-surface p-6 space-y-5'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kr0n-line pb-4'>
                  <div>
                    <h2 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
                      Organization Workspace
                    </h2>
                    <p className='text-xs text-kr0n-muted mt-1'>
                      Manage your active organization, rename it, or provision a new workspace.
                    </p>
                  </div>

                  <button
                    type='button'
                    onClick={() => setNewOrgOpen(true)}
                    className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold'
                  >
                    <Plus size={13} />
                    <span>New Organization</span>
                  </button>
                </div>

                {activeOrg ? (
                  <div className='space-y-5'>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                        <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                          Organization Slug
                        </div>
                        <div className='text-sm font-mono text-white font-bold mt-1'>
                          {activeOrg.slug}
                        </div>
                      </div>
                      <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                        <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                          Your Role
                        </div>
                        <div className='text-sm font-mono text-emerald-400 font-bold uppercase mt-1'>
                          {activeOrg.role_id || 'member'}
                        </div>
                      </div>
                      <div className='p-3.5 bg-kr0n-black border border-kr0n-line'>
                        <div className='text-[10px] font-mono uppercase text-kr0n-muted'>
                          Organization ID
                        </div>
                        <div className='text-xs font-mono text-kr0n-text-secondary mt-1 truncate' title={activeOrg.id}>
                          {activeOrg.id}
                        </div>
                      </div>
                    </div>

                    {/* Rename Organization Form (PATCH /api/v1/orgs/{org_id}) */}
                    <form onSubmit={handleRenameOrg} className='flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-kr0n-line/50'>
                      <div className='flex-1 space-y-1.5'>
                        <label className='block text-xs font-mono uppercase text-kr0n-muted'>
                          Organization Name
                        </label>
                        <input
                          type='text'
                          required
                          maxLength={100}
                          value={orgNameEdit}
                          onChange={(e) => setOrgNameEdit(e.target.value)}
                          disabled={orgUpdating}
                          className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
                        />
                      </div>
                      <button
                        type='submit'
                        disabled={
                          orgUpdating ||
                          !orgNameEdit.trim() ||
                          orgNameEdit.trim() === activeOrg.name
                        }
                        className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider disabled:opacity-50'
                      >
                        {orgUpdating ? 'Saving...' : 'Rename Organization'}
                      </button>
                    </form>

                    {/* Delete Organization Danger Zone (DELETE /api/v1/orgs/{org_id}) */}
                    <div className='border border-red-500/30 bg-red-950/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div>
                        <div className='text-xs font-mono uppercase font-bold text-red-400'>
                          Delete Organization
                        </div>
                        <p className='text-xs text-kr0n-muted mt-0.5'>
                          Permanently delete <span className='text-white font-mono'>{activeOrg.name}</span>. Note: Your sole remaining organization cannot be deleted.
                        </p>
                      </div>
                      {!confirmDeleteOrg ? (
                        <button
                          type='button'
                          onClick={() => setConfirmDeleteOrg(true)}
                          className='shrink-0 border border-red-500/40 hover:border-red-400 bg-red-950/30 text-red-300 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors'
                        >
                          Delete Organization
                        </button>
                      ) : (
                        <div className='flex items-center gap-2 shrink-0'>
                          <button
                            type='button'
                            onClick={handleDeleteOrg}
                            disabled={orgDeleting}
                            className='bg-red-500 hover:bg-red-400 text-black px-3 py-1.5 text-xs font-mono uppercase font-bold tracking-wider disabled:opacity-50'
                          >
                            {orgDeleting ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            type='button'
                            onClick={() => setConfirmDeleteOrg(false)}
                            className='border border-kr0n-line text-kr0n-muted hover:text-white px-3 py-1.5 text-xs font-mono uppercase'
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='p-6 text-center border border-dashed border-kr0n-line text-xs font-mono text-kr0n-muted'>
                    No active organization loaded.
                  </div>
                )}
              </div>

              {/* Session-Created Pending Invites (Copy Link & Revoke via DELETE /api/v1/orgs/{org_id}/invites/{invite_id}) */}
              {activeOrgInvites.length > 0 && (
                <div className='border border-kr0n-line bg-kr0n-surface'>
                  <div className='p-4 border-b border-kr0n-line flex items-center justify-between'>
                    <div>
                      <h3 className='text-xs font-mono uppercase tracking-wider text-white font-bold'>
                        Recent Pending Invitations
                      </h3>
                      <p className='text-[11px] text-kr0n-muted mt-0.5'>
                        Copy the direct invite acceptance link or revoke pending tokens created in this session.
                      </p>
                    </div>
                  </div>
                  <div className='divide-y divide-kr0n-line/60'>
                    {activeOrgInvites.map((inv) => {
                      const invKey = inv.id || inv.token;
                      return (
                        <div
                          key={invKey}
                          className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                        >
                          <div className='space-y-1 min-w-0'>
                            <div className='text-xs font-mono text-white font-bold flex items-center gap-2'>
                              <span>{inv.email}</span>
                              <span className='text-[10px] px-1.5 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase'>
                                {inv.role_id || 'member'}
                              </span>
                            </div>
                            <div className='text-[11px] font-mono text-kr0n-muted'>
                              Expires: {formatTimestamp(inv.expires_at)}
                            </div>
                          </div>

                          <div className='flex items-center gap-2 shrink-0'>
                            {inv.token && (
                              <button
                                type='button'
                                onClick={() => handleCopyInviteLink(inv)}
                                className='flex items-center gap-1.5 border border-kr0n-line hover:border-white bg-kr0n-black text-white px-2.5 py-1.5 text-[11px] font-mono uppercase'
                              >
                                {copiedInviteId === invKey ? (
                                  <>
                                    <Check size={12} className='text-emerald-400' />
                                    <span>Copied Link</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2 size={12} />
                                    <span>Copy Invite Link</span>
                                  </>
                                )}
                              </button>
                            )}
                            {inv.id && (
                              <button
                                type='button'
                                onClick={() => handleRevokeInvite(inv)}
                                className='flex items-center gap-1 border border-red-500/30 hover:border-red-400 text-red-400 px-2.5 py-1.5 text-[11px] font-mono uppercase'
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
                </div>
              )}

              {/* Members Roster Table */}
              <div className='border border-kr0n-line bg-kr0n-surface'>
                <div className='p-5 border-b border-kr0n-line flex items-center justify-between'>
                  <div>
                    <h3 className='text-xs font-mono uppercase tracking-wider text-white font-bold'>
                      Team Members ({members.length})
                    </h3>
                    <p className='text-[11px] text-kr0n-muted mt-0.5'>
                      Manage role-based access control (RBAC) across your organization.
                    </p>
                  </div>

                  <button
                    type='button'
                    onClick={() => setInviteOpen(true)}
                    disabled={!activeOrg}
                    className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-50'
                  >
                    <Plus size={13} />
                    <span>Add / Invite Member</span>
                  </button>
                </div>

                {membersLoading ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    Loading organization members...
                  </div>
                ) : members.length === 0 ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    No members found in this organization.
                  </div>
                ) : (
                  <div className='divide-y divide-kr0n-line/60'>
                    {members.map((member) => {
                      const memberId = member.user_id || member.id;
                      const memberRole = member.role_id || member.role || 'member';
                      const memberName =
                        member.display_name ||
                        member.name ||
                        member.email?.split('@')[0] ||
                        'User';
                      return (
                        <div
                          key={memberId}
                          className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01]'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-kr0n-black border border-kr0n-line flex items-center justify-center font-mono text-xs text-white font-bold uppercase'>
                              {memberName.slice(0, 2)}
                            </div>
                            <div>
                              <div className='text-xs font-bold text-white flex items-center gap-2'>
                                <span>{memberName}</span>
                              </div>
                              <div className='text-[11px] font-mono text-kr0n-muted'>
                                {member.email}
                              </div>
                            </div>
                          </div>

                          <div className='flex items-center gap-3'>
                            <select
                              value={memberRole}
                              onChange={(e) => handleUpdateRole(memberId, e.target.value)}
                              className='bg-kr0n-black border border-kr0n-line text-xs font-mono text-white px-2.5 py-1 outline-none uppercase'
                            >
                              {availableRoleOptions.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name || r.id}
                                </option>
                              ))}
                            </select>

                            <button
                              type='button'
                              onClick={() => handleRemoveMember(memberId)}
                              className='text-kr0n-muted hover:text-red-400 p-1.5 transition-colors'
                              title='Remove member'
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB 3: INTEGRATIONS (GitHub App) ─── */}
          {activeTab === 'integrations' && (
            <div className='space-y-6'>
              <div className='border border-kr0n-line bg-kr0n-surface p-6 space-y-6'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-kr0n-line pb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-kr0n-black border border-kr0n-line flex items-center justify-center text-white'>
                      <Puzzle size={18} />
                    </div>
                    <div>
                      <h2 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
                        GitHub App Installations
                      </h2>
                      <p className='text-xs text-kr0n-muted mt-0.5'>
                        Connect GitHub accounts or organizations to import repositories into {activeOrg?.name || 'your workspace'}.
                      </p>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={handleConnectGitHub}
                    disabled={ghLoading || !activeOrg}
                    className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-2 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
                  >
                    <Plus size={13} />
                    <span>{ghLoading ? 'Connecting...' : 'Install GitHub App'}</span>
                  </button>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-xs font-mono text-kr0n-muted uppercase'>
                    <span>Connected Installations ({ghInstallations.length})</span>
                    {activeOrg && (
                      <button
                        type='button'
                        onClick={() => fetchOrgSubResources(activeOrg.id)}
                        className='flex items-center gap-1 text-kr0n-muted hover:text-white transition-colors'
                      >
                        <RefreshCw size={11} className={ghLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                      </button>
                    )}
                  </div>

                  {ghInstallations.length === 0 ? (
                    <div className='border border-dashed border-kr0n-line bg-kr0n-black/40 p-8 text-center space-y-3'>
                      <p className='text-xs font-mono text-white uppercase font-bold'>
                        No GitHub App Installations Linked
                      </p>
                      <p className='text-xs text-kr0n-muted max-w-md mx-auto'>
                        Install the KR0N GitHub App on your personal or organization GitHub account to discover repositories, branches, and build presets.
                      </p>
                    </div>
                  ) : (
                    <div className='divide-y divide-kr0n-line border border-kr0n-line bg-kr0n-black'>
                      {ghInstallations.map((inst) => {
                        const ghInstId = inst.installation_id || inst.installationId;
                        return (
                          <div
                            key={inst.id || ghInstId}
                            className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
                          >
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <span className='text-xs font-mono font-bold text-white'>
                                  {inst.account_login || `GitHub Account #${ghInstId}`}
                                </span>
                                <span className='text-[9px] font-mono uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'>
                                  {inst.status || 'Active'}
                                </span>
                                {inst.account_type && (
                                  <span className='text-[9px] font-mono uppercase px-1.5 py-0.5 bg-white/5 text-kr0n-muted border border-kr0n-line'>
                                    {inst.account_type}
                                  </span>
                                )}
                              </div>
                              <div className='text-[11px] font-mono text-kr0n-muted'>
                                GitHub Installation ID: <span className='text-white'>{ghInstId}</span>
                                {inst.repository_selection && (
                                  <span> &bull; Scope: {inst.repository_selection}</span>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-2'>
                              <a
                                href='https://github.com/settings/installations'
                                target='_blank'
                                rel='noreferrer'
                                className='flex items-center gap-1 border border-kr0n-line hover:border-white text-kr0n-muted hover:text-white px-2.5 py-1.5 text-[10px] font-mono uppercase transition-colors'
                              >
                                <span>Configure on GitHub</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type='button'
                                onClick={() => handleDisconnectGitHub(ghInstId)}
                                className='flex items-center gap-1 border border-red-500/30 hover:border-red-400 text-red-400 px-2.5 py-1.5 text-[10px] font-mono uppercase transition-colors'
                              >
                                <Trash2 size={11} />
                                <span>Disconnect</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: SECURITY & SESSIONS ─── */}
          {activeTab === 'security' && (
            <div className='space-y-6'>
              {/* Change Password */}
              <form
                onSubmit={handleChangePassword}
                className='border border-kr0n-line bg-kr0n-surface p-6 space-y-4'
              >
                <div className='border-b border-kr0n-line pb-4'>
                  <h3 className='text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2'>
                    <Lock size={14} />
                    <span>Change Account Password</span>
                  </h3>
                  <p className='text-[11px] text-kr0n-muted mt-0.5'>
                    Passwords must be between 8 characters and 72 UTF-8 bytes.
                  </p>
                </div>

                {passwordChangeError && (
                  <div className='border border-red-500/40 bg-red-500/10 p-2.5 text-xs font-mono text-red-400'>
                    {passwordChangeError}
                  </div>
                )}

                {passwordChangeSuccess && (
                  <div className='border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs font-mono text-emerald-400'>
                    {passwordChangeSuccess}
                  </div>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <div className='space-y-1'>
                    <label className='block text-[10px] font-mono uppercase text-kr0n-muted'>
                      Current Password
                    </label>
                    <input
                      type='password'
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder='••••••••'
                      className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='block text-[10px] font-mono uppercase text-kr0n-muted'>
                      New Password
                    </label>
                    <input
                      type='password'
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='8–72 bytes'
                      className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='block text-[10px] font-mono uppercase text-kr0n-muted'>
                      Confirm New Password
                    </label>
                    <input
                      type='password'
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder='Re-enter password'
                      className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <button
                    type='submit'
                    disabled={passwordChangeLoading || !currentPassword || !newPassword}
                    className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50'
                  >
                    {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Active Sessions */}
              <div className='border border-kr0n-line bg-kr0n-surface'>
                <div className='p-5 border-b border-kr0n-line'>
                  <h3 className='text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2'>
                    <Monitor size={14} />
                    <span>Active Sessions ({sessions.length})</span>
                  </h3>
                  <p className='text-[11px] text-kr0n-muted mt-0.5'>
                    Authenticated browser and device sessions for your account.
                  </p>
                </div>

                {sessionsLoading ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    Loading active sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    No active sessions found.
                  </div>
                ) : (
                  <div className='divide-y divide-kr0n-line/60'>
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className='p-4 flex items-center justify-between gap-4'
                      >
                        <div className='space-y-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs font-bold text-white truncate max-w-lg'>
                              {sess.user_agent || 'Authenticated Session'}
                            </span>
                            {sess.current && (
                              <span className='text-[9px] font-mono uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'>
                                Current
                              </span>
                            )}
                          </div>
                          <div className='text-[11px] font-mono text-kr0n-muted'>
                            IP: {sess.ip_address || '—'} &bull; Last Active: {formatTimestamp(sess.last_seen_at || sess.created_at)}
                          </div>
                        </div>

                        {!sess.current && (
                          <button
                            type='button'
                            onClick={() => handleRevokeSession(sess.id)}
                            className='text-xs font-mono uppercase text-red-400 hover:text-red-300 border border-red-500/30 px-2.5 py-1 transition-colors shrink-0'
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB 5: API TOKENS ─── */}
          {activeTab === 'tokens' && (
            <div className='space-y-6'>
              {createdTokenSecret && (
                <div className='border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-emerald-300 font-mono text-xs uppercase font-bold'>
                      <Key size={14} />
                      <span>Personal Access Token Generated &mdash; Copy Now</span>
                    </div>
                    <button
                      type='button'
                      onClick={() => setCreatedTokenSecret(null)}
                      className='text-[10px] font-mono text-kr0n-muted hover:text-white uppercase'
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className='text-xs text-emerald-200/80'>
                    For security reasons, this token secret is shown only once and cannot be retrieved again.
                  </p>
                  <div className='flex items-center justify-between bg-kr0n-black border border-emerald-500/30 p-3 font-mono text-xs text-emerald-300'>
                    <span className='truncate select-all'>{createdTokenSecret}</span>
                    <button
                      type='button'
                      onClick={() => handleCopyToken(createdTokenSecret)}
                      className='flex items-center gap-1.5 bg-emerald-500 text-black px-2.5 py-1 text-[10px] font-bold uppercase ml-3 shrink-0'
                    >
                      {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className='border border-kr0n-line bg-kr0n-surface'>
                <div className='p-5 border-b border-kr0n-line flex items-center justify-between'>
                  <div>
                    <h2 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
                      Organization API Tokens ({apiTokens.length})
                    </h2>
                    <p className='text-xs text-kr0n-muted mt-1'>
                      Scoped bearer tokens for CI/CD pipelines and programmatic API access to {activeOrg?.name || 'this organization'}.
                    </p>
                  </div>

                  <button
                    type='button'
                    onClick={() => setNewTokenOpen(true)}
                    disabled={!activeOrg}
                    className='clipped-btn flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-50'
                  >
                    <Plus size={13} />
                    <span>Create Token</span>
                  </button>
                </div>

                {tokensLoading ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    Loading API tokens...
                  </div>
                ) : apiTokens.length === 0 ? (
                  <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                    No API tokens have been created for this organization yet.
                  </div>
                ) : (
                  <div className='divide-y divide-kr0n-line/60'>
                    {apiTokens.map((tok) => (
                      <div
                        key={tok.id}
                        className='p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01]'
                      >
                        <div className='space-y-1.5'>
                          <div className='flex items-center gap-2.5 flex-wrap'>
                            <span className='text-sm font-bold text-white'>{tok.name}</span>
                            <span className='text-[11px] font-mono text-kr0n-muted bg-kr0n-black px-2 py-0.5 border border-kr0n-line'>
                              {tok.token_prefix}...
                            </span>
                          </div>
                          {Array.isArray(tok.permissions) && tok.permissions.length > 0 && (
                            <div className='flex flex-wrap gap-1 pt-0.5'>
                              {tok.permissions.map((perm) => (
                                <span
                                  key={perm}
                                  className='text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.04] border border-kr0n-line text-kr0n-text-secondary'
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className='flex items-center gap-3 text-[11px] font-mono text-kr0n-muted pt-0.5'>
                            <span>Created: {formatTimestamp(tok.created_at)}</span>
                            <span>&bull;</span>
                            <span>Expires: {formatTimestamp(tok.expires_at)}</span>
                            <span>&bull;</span>
                            <span>Last used: {tok.last_used_at ? formatTimestamp(tok.last_used_at) : 'Never'}</span>
                          </div>
                        </div>

                        <button
                          type='button'
                          onClick={() => handleRevokeToken(tok.id)}
                          className='flex items-center gap-1.5 text-xs font-mono uppercase text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 transition-colors self-start sm:self-center shrink-0'
                        >
                          <Trash2 size={13} />
                          <span>Revoke</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB 6: AUDIT LOG ─── */}
          {activeTab === 'audit' && (
            <div className='border border-kr0n-line bg-kr0n-surface'>
              <div className='p-5 border-b border-kr0n-line flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                  <h2 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
                    Organization Audit Trail
                  </h2>
                  <p className='text-xs text-kr0n-muted mt-1'>
                    Immutable security and administrative event ledger for {activeOrg?.name || 'this organization'}.
                  </p>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <input
                    type='text'
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder='Filter loaded events...'
                    className='bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-1.5 outline-none'
                  />

                  <select
                    value={auditActionFilter}
                    onChange={(e) => {
                      setAuditOffset(0);
                      setAuditActionFilter(e.target.value);
                    }}
                    aria-label='Filter by audit action'
                    className='bg-kr0n-black border border-kr0n-line text-xs font-mono text-white px-2.5 py-1.5 outline-none'
                  >
                    {AUDIT_ACTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {auditLoading ? (
                <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                  Loading audit trail...
                </div>
              ) : filteredAuditEvents.length === 0 ? (
                <div className='p-8 text-center text-xs font-mono text-kr0n-muted'>
                  No audit events recorded matching your filter.
                </div>
              ) : (
                <div className='divide-y divide-kr0n-line/60'>
                  {filteredAuditEvents.map((entry) => (
                    <div
                      key={entry.id}
                      className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.01]'
                    >
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2.5 flex-wrap'>
                          <span className='text-xs font-mono font-bold text-white bg-kr0n-black px-2 py-0.5 border border-kr0n-line'>
                            {entry.action}
                          </span>
                          {entry.resource_type && (
                            <span className='text-xs font-mono text-emerald-400'>
                              {entry.resource_type}
                              {entry.resource_id ? `:${entry.resource_id}` : ''}
                            </span>
                          )}
                        </div>
                        <div className='text-[11px] font-mono text-kr0n-muted'>
                          Actor: <span className='text-white'>{entry.actor_user_id || entry.actor_type || 'system'}</span>
                          {entry.ip_address ? ` • IP: ${entry.ip_address}` : ''}
                        </div>
                      </div>

                      <div className='flex items-center gap-1.5 text-[11px] font-mono text-kr0n-muted shrink-0'>
                        <Clock size={11} />
                        <span>{formatTimestamp(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Footer */}
              <div className='p-4 border-t border-kr0n-line flex items-center justify-between text-xs font-mono text-kr0n-muted'>
                <span>
                  Showing offset {auditOffset} ({filteredAuditEvents.length} events)
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={auditOffset === 0 || auditLoading}
                    onClick={() => setAuditOffset((prev) => Math.max(0, prev - AUDIT_PAGE_SIZE))}
                    className='flex items-center gap-1 border border-kr0n-line hover:border-white text-white px-2.5 py-1 disabled:opacity-40'
                  >
                    <ChevronLeft size={12} />
                    <span>Prev</span>
                  </button>
                  <button
                    type='button'
                    disabled={auditEvents.length < AUDIT_PAGE_SIZE || auditLoading}
                    onClick={() => setAuditOffset((prev) => prev + AUDIT_PAGE_SIZE)}
                    className='flex items-center gap-1 border border-kr0n-line hover:border-white text-white px-2.5 py-1 disabled:opacity-40'
                  >
                    <span>Next</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD / INVITE MEMBER MODAL ─── */}
      {inviteOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Add or Invite Team Member'
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
        >
          <div
            className='fixed inset-0 bg-black/80 backdrop-blur-sm'
            onClick={() => setInviteOpen(false)}
          />
          <form
            onSubmit={handleAddOrInviteMember}
            className='relative w-full max-w-md border border-kr0n-line-strong bg-kr0n-canvas-raised p-6 z-10 space-y-4'
          >
            <h3 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
              Add or Invite Team Member
            </h3>

            <div className='grid grid-cols-2 gap-2 p-1 bg-kr0n-black border border-kr0n-line'>
              <button
                type='button'
                onClick={() => setInviteMode('invite')}
                className={`py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  inviteMode === 'invite'
                    ? 'bg-white text-black font-bold'
                    : 'text-kr0n-muted hover:text-white'
                }`}
              >
                Send Email Invite
              </button>
              <button
                type='button'
                onClick={() => setInviteMode('direct')}
                className={`py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  inviteMode === 'direct'
                    ? 'bg-white text-black font-bold'
                    : 'text-kr0n-muted hover:text-white'
                }`}
              >
                Add Existing User
              </button>
            </div>

            <p className='text-[11px] font-mono text-kr0n-muted'>
              {inviteMode === 'invite'
                ? 'Dispatches an invitation email with an acceptance token link (/invites/accept?token=...).'
                : 'Directly adds an already-registered KR0N user to this organization by email.'}
            </p>

            <div className='space-y-1.5'>
              <label className='text-xs font-mono uppercase text-kr0n-muted'>
                Email Address
              </label>
              <input
                type='email'
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder='engineer@company.com'
                className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-mono uppercase text-kr0n-muted'>
                Role Assignment
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className='w-full bg-kr0n-black border border-kr0n-line text-xs font-mono text-white px-3 py-2 outline-none uppercase'
              >
                {availableRoleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.id}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line'>
              <button
                type='button'
                onClick={() => setInviteOpen(false)}
                className='border border-kr0n-line text-kr0n-muted hover:text-white px-3 py-1.5 text-xs font-mono uppercase'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={inviteLoading}
                className='clipped-btn bg-white text-black px-4 py-1.5 text-xs font-mono uppercase font-bold disabled:opacity-50'
              >
                {inviteLoading
                  ? 'Submitting...'
                  : inviteMode === 'invite'
                    ? 'Send Invitation'
                    : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── CREATE API TOKEN MODAL ─── */}
      {newTokenOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Generate Scoped API Token'
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
        >
          <div
            className='fixed inset-0 bg-black/80 backdrop-blur-sm'
            onClick={() => setNewTokenOpen(false)}
          />
          <form
            onSubmit={handleCreateToken}
            className='relative w-full max-w-lg border border-kr0n-line-strong bg-kr0n-canvas-raised p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto'
          >
            <h3 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
              Generate Scoped API Token
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <label className='text-xs font-mono uppercase text-kr0n-muted'>
                  Token Name
                </label>
                <input
                  type='text'
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder='e.g., github-actions-deploy'
                  className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-mono uppercase text-kr0n-muted'>
                  Expiration
                </label>
                <select
                  value={tokenExpirySeconds}
                  onChange={(e) => setTokenExpirySeconds(Number(e.target.value))}
                  className='w-full bg-kr0n-black border border-kr0n-line text-xs font-mono text-white px-3 py-2 outline-none'
                >
                  {TOKEN_EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.seconds} value={opt.seconds}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-mono uppercase text-kr0n-muted'>
                  Permissions ({tokenPermissions.length} selected)
                </label>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() =>
                      setTokenPermissions(
                        callerPermissions.filter((p) => p.endsWith(':read'))
                      )
                    }
                    className='text-[10px] font-mono text-kr0n-muted hover:text-white underline uppercase'
                  >
                    Read-Only
                  </button>
                  <button
                    type='button'
                    onClick={() => setTokenPermissions([...callerPermissions])}
                    className='text-[10px] font-mono text-kr0n-muted hover:text-white underline uppercase'
                  >
                    Select All
                  </button>
                  <button
                    type='button'
                    onClick={() => setTokenPermissions([])}
                    className='text-[10px] font-mono text-kr0n-muted hover:text-white underline uppercase'
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-2.5 bg-kr0n-black border border-kr0n-line'>
                {callerPermissions.map((perm) => {
                  const checked = tokenPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono cursor-pointer border transition-colors ${
                        checked
                          ? 'border-white/40 bg-white/[0.06] text-white'
                          : 'border-transparent text-kr0n-muted hover:text-white'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleTokenPermission(perm)}
                        className='accent-white'
                      />
                      <span className='truncate'>{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line'>
              <button
                type='button'
                onClick={() => setNewTokenOpen(false)}
                className='border border-kr0n-line text-kr0n-muted hover:text-white px-3 py-1.5 text-xs font-mono uppercase'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={tokenCreating || !tokenName.trim() || tokenPermissions.length === 0}
                className='clipped-btn bg-white text-black px-4 py-1.5 text-xs font-mono uppercase font-bold disabled:opacity-50'
              >
                {tokenCreating ? 'Generating...' : 'Generate Token'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── CREATE ORGANIZATION MODAL ─── */}
      {newOrgOpen && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Create New Organization'
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
        >
          <div
            className='fixed inset-0 bg-black/80 backdrop-blur-sm'
            onClick={() => setNewOrgOpen(false)}
          />
          <form
            onSubmit={handleCreateOrg}
            className='relative w-full max-w-md border border-kr0n-line-strong bg-kr0n-canvas-raised p-6 z-10 space-y-4'
          >
            <h3 className='text-sm font-mono uppercase tracking-wider text-white font-bold'>
              Create New Organization
            </h3>

            <div className='space-y-1.5'>
              <label className='text-xs font-mono uppercase text-kr0n-muted'>
                Organization Name
              </label>
              <input
                type='text'
                required
                maxLength={100}
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  setNewOrgSlug(slugifyOrgName(e.target.value));
                }}
                placeholder='e.g., Acme Cloud'
                className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-mono uppercase text-kr0n-muted'>
                Organization Slug (2–63 chars)
              </label>
              <input
                type='text'
                required
                minLength={2}
                maxLength={63}
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                placeholder='acme-cloud'
                className='w-full bg-kr0n-black border border-kr0n-line focus:border-white text-xs font-mono text-white px-3 py-2 outline-none'
              />
            </div>

            <div className='flex justify-end gap-2 pt-3 border-t border-kr0n-line'>
              <button
                type='button'
                onClick={() => setNewOrgOpen(false)}
                className='border border-kr0n-line text-kr0n-muted hover:text-white px-3 py-1.5 text-xs font-mono uppercase'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={newOrgLoading || !newOrgName.trim()}
                className='clipped-btn bg-white text-black px-4 py-1.5 text-xs font-mono uppercase font-bold disabled:opacity-50'
              >
                {newOrgLoading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
