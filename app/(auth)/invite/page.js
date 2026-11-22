'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  LogOut,
  Check,
} from 'lucide-react';
import { acceptInvite, getMe, logout, useAuthUser } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace-context';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

const ROLE_CONFIG = {
  owner: {
    badge: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    permissions: [
      'Full administrative control over organization, members, and projects',
      'Manage GitHub App installations, API tokens, and audit logs',
      'Rename or delete the organization workspace',
    ],
  },
  admin: {
    badge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    permissions: [
      'Create, configure, and delete projects and build settings',
      'Invite members, manage roles, and provision API tokens',
      'View organization audit logs and manage GitHub installations',
    ],
  },
  member: {
    badge: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
    permissions: [
      'Read access to organization projects, build configurations, and repositories',
      'Collaborate within the shared organization workspace',
      'View organization members and connected integrations',
    ],
  },
};

function getRoleMeta(role) {
  const normalized = (role || 'member').toLowerCase();
  return {
    normalized,
    ...(ROLE_CONFIG[normalized] || ROLE_CONFIG.member),
  };
}

function RoleBadge({ role }) {
  const { normalized, badge } = getRoleMeta(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono border ${badge}`}
    >
      <Shield size={12} />
      {normalized}
    </span>
  );
}

function RolePermissions({ role }) {
  const { permissions } = getRoleMeta(role);

  return (
    <div className='rounded-lg bg-kr0n-black border border-kr0n-line-soft p-4 space-y-2.5 text-left'>
      <div className='text-xs font-medium text-kr0n-muted'>
        Included permissions
      </div>
      <ul className='space-y-2'>
        {permissions.map((p, idx) => (
          <li key={idx} className='text-xs text-kr0n-text-secondary flex items-start gap-2 leading-relaxed'>
            <Check size={13} className='text-kr0n-healthy shrink-0 mt-0.5' />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshOrganizations, setActiveOrgId, resetWorkspace } = useWorkspace({
    autoLoad: false,
  });

  const tokenParam = (searchParams.get('token') || searchParams.get('t') || '').trim();
  const orgParam = searchParams.get('org') || searchParams.get('organization') || '';
  const roleParam = (searchParams.get('role') || 'member').toLowerCase();
  const emailParam = searchParams.get('email') || '';
  const inviterParam = searchParams.get('inviter') || '';

  const [token, setToken] = useState(tokenParam);
  const [prevTokenParam, setPrevTokenParam] = useState(tokenParam);
  if (prevTokenParam !== tokenParam) {
    setPrevTokenParam(tokenParam);
    setToken(tokenParam);
  }

  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;
  const isLoggedIn = Boolean(currentUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [acceptedOrg, setAcceptedOrg] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted) {
          setLiveUser(user || null);
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        if (mounted) setIsCheckingAuth(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'accepted') return;
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  const activeToken = (token || tokenParam).trim();
  const currentInvitePath = activeToken
    ? `/invites/accept?token=${encodeURIComponent(activeToken)}`
    : '/invites/accept';

  const handleAccept = useCallback(async () => {
    if (!activeToken) {
      setError('A valid invitation token is required to join an organization.');
      return;
    }
    if (!isLoggedIn) {
      setError('Sign in to your account before accepting this invitation.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const joinedOrg = await acceptInvite(activeToken);
      setAcceptedOrg(joinedOrg || null);
      await refreshOrganizations().catch(() => {});
      if (joinedOrg?.id) {
        setActiveOrgId(joinedOrg.id);
      }
      setStatus('accepted');
    } catch (err) {
      setError(
        err?.message ||
          'Failed to accept invitation. The token may be expired, revoked, or issued for another email address.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeToken, isLoggedIn, refreshOrganizations, setActiveOrgId]);

  const handleDecline = () => {
    setStatus('declined');
  };

  const handleSwitchAccount = async () => {
    await logout();
    resetWorkspace();
    setLiveUser(null);
    router.push(`/login?redirect=${encodeURIComponent(currentInvitePath)}`);
  };

  const resolvedOrgName = acceptedOrg?.name || orgParam || 'Organization';
  const resolvedRole = acceptedOrg?.role_id || roleParam || 'member';

  if (status === 'accepted') {
    return (
      <AuthCard
        title={`Joined ${resolvedOrgName}`}
        subtitle={`You now have ${resolvedRole} access to this workspace.`}
        maxWidth='max-w-md'
      >
        <div className='w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400'>
          <CheckCircle2 size={20} />
        </div>

        <dl className='rounded-lg bg-kr0n-black border border-kr0n-line-soft divide-y divide-kr0n-line-soft text-xs'>
          <div className='px-4 py-2.5 flex items-center justify-between gap-4'>
            <dt className='text-kr0n-muted'>Organization</dt>
            <dd className='font-medium text-kr0n-text'>{resolvedOrgName}</dd>
          </div>
          {acceptedOrg?.slug && (
            <div className='px-4 py-2.5 flex items-center justify-between gap-4'>
              <dt className='text-kr0n-muted'>Slug</dt>
              <dd className='font-mono text-kr0n-text-secondary'>{acceptedOrg.slug}</dd>
            </div>
          )}
          <div className='px-4 py-2.5 flex items-center justify-between gap-4'>
            <dt className='text-kr0n-muted'>Role</dt>
            <dd><RoleBadge role={resolvedRole} /></dd>
          </div>
          <div className='px-4 py-2.5 flex items-center justify-between gap-4'>
            <dt className='text-kr0n-muted'>Account</dt>
            <dd className='font-mono text-kr0n-text-secondary truncate max-w-[200px]'>
              {currentUser?.email || 'Authenticated user'}
            </dd>
          </div>
        </dl>

        <div className='space-y-2.5'>
          <Link
            href='/dashboard'
            className='w-full h-10 rounded-lg inline-flex items-center justify-center gap-2 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
          >
            <span>Open console ({countdown}s)</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href='/projects'
            className='w-full h-10 rounded-lg inline-flex items-center justify-center border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150'
          >
            Go to projects
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (status === 'declined') {
    return (
      <AuthCard
        title='Invitation declined'
        subtitle='You chose not to accept this invitation. You can reopen it below or return home.'
        maxWidth='max-w-md'
      >
        <div className='w-10 h-10 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400'>
          <AlertCircle size={20} />
        </div>

        <div className='space-y-2.5'>
          <button
            type='button'
            onClick={() => setStatus('pending')}
            className='w-full h-10 rounded-lg border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text transition-colors duration-150 cursor-pointer'
          >
            Reopen invitation
          </button>
          <Link
            href='/'
            className='block text-center text-sm text-kr0n-muted hover:text-kr0n-text transition-colors duration-150 py-1'
          >
            Return home
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={orgParam || 'Organization invitation'}
      subtitle={
        inviterParam
          ? `Invited by ${inviterParam}`
          : 'Accept this invitation to join the organization on kr0n.'
      }
      maxWidth='max-w-md'
    >
      <div className='flex items-center justify-between rounded-lg bg-kr0n-black border border-kr0n-line-soft px-4 py-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-lg bg-kr0n-surface-2 border border-kr0n-line flex items-center justify-center text-kr0n-text shrink-0'>
            <Building2 size={17} />
          </div>
          <div className='min-w-0'>
            <div className='text-sm font-medium text-kr0n-text truncate'>
              {orgParam || 'Organization workspace'}
            </div>
            <div className='text-xs text-kr0n-muted'>Assigned role</div>
          </div>
        </div>
        <RoleBadge role={roleParam} />
      </div>

      <RolePermissions role={roleParam} />

      <AuthBanner type='error' message={error} />

      {!tokenParam && (
        <div className='space-y-1.5'>
          <label
            htmlFor='invite-token'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Invitation token
          </label>
          <input
            id='invite-token'
            type='text'
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='Paste invitation token from email'
            className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm font-mono text-kr0n-text px-3 outline-none transition-colors duration-150'
          />
        </div>
      )}

      {isCheckingAuth ? (
        <div className='py-4 text-center space-y-2'>
          <Loader2 size={18} className='animate-spin text-kr0n-muted mx-auto' />
          <p className='text-xs text-kr0n-muted'>Checking session...</p>
        </div>
      ) : isLoggedIn ? (
        <div className='space-y-4'>
          <div className='rounded-lg bg-kr0n-black border border-kr0n-line-soft p-3 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='w-8 h-8 rounded-md bg-kr0n-surface-2 border border-kr0n-line text-kr0n-text font-mono text-xs flex items-center justify-center shrink-0'>
                {currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className='min-w-0'>
                <div className='text-xs font-medium text-kr0n-text truncate'>
                  {currentUser?.display_name ||
                    currentUser?.displayName ||
                    currentUser?.email?.split('@')[0]}
                </div>
                <div className='text-xs text-kr0n-muted truncate'>
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <button
              type='button'
              onClick={handleSwitchAccount}
              className='text-xs text-kr0n-muted hover:text-kr0n-text inline-flex items-center gap-1 transition-colors duration-150 shrink-0 cursor-pointer'
            >
              <LogOut size={12} />
              <span>Switch</span>
            </button>
          </div>

          {emailParam &&
            currentUser?.email &&
            emailParam.toLowerCase() !== currentUser.email.toLowerCase() && (
              <div className='rounded-lg text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 p-3 leading-relaxed'>
                This invite was sent to <span className='font-mono'>{emailParam}</span>. You are signed in as{' '}
                <span className='font-mono'>{currentUser.email}</span>.
              </div>
            )}

          <div className='space-y-2'>
            <button
              type='button'
              onClick={handleAccept}
              disabled={isLoading || !activeToken}
              className='w-full h-10 rounded-lg inline-flex items-center justify-center gap-2 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className='animate-spin' />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  <span>Accept invitation</span>
                </>
              )}
            </button>

            <button
              type='button'
              onClick={handleDecline}
              disabled={isLoading}
              className='w-full h-10 rounded-lg border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-lg bg-kr0n-black border border-kr0n-line-soft p-3.5 text-center space-y-1'>
            <p className='text-xs text-kr0n-text-secondary leading-relaxed'>
              Sign in or create an account with the invited email address to accept this invitation.
            </p>
            {emailParam && (
              <p className='text-xs text-kr0n-muted'>
                Invite sent to <span className='font-mono text-kr0n-text'>{emailParam}</span>
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Link
              href={`/login?redirect=${encodeURIComponent(currentInvitePath)}`}
              className='w-full h-10 rounded-lg inline-flex items-center justify-center gap-2 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
            >
              <span>Sign in to accept</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href={`/signup?redirect=${encodeURIComponent(currentInvitePath)}`}
              className='w-full h-10 rounded-lg inline-flex items-center justify-center border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150'
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </AuthCard>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <AuthCard title='Organization invitation' maxWidth='max-w-md'>
          <div className='py-6 text-center space-y-3'>
            <Loader2 size={20} className='animate-spin text-kr0n-muted mx-auto' />
            <p className='text-sm text-kr0n-muted'>Loading invitation...</p>
          </div>
        </AuthCard>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
