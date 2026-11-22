'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  KeyRound,
  LogOut,
  Sparkles,
  Users,
  Check,
} from 'lucide-react';
import { acceptInvite, getMe, logout, useAuthUser } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace-context';

const ROLE_CONFIG = {
  owner: {
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    permissions: [
      'Full administrative control over organization, members, and projects',
      'Manage GitHub App installations, API tokens, and audit logs',
      'Rename or delete the organization workspace',
    ],
  },
  admin: {
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    permissions: [
      'Create, configure, and delete projects and build settings',
      'Invite members, manage roles, and provision API tokens',
      'View organization audit logs and manage GitHub installations',
    ],
  },
  member: {
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
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
  const { normalized, color } = getRoleMeta(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase font-bold border ${color}`}
    >
      <Shield size={12} />
      {normalized}
    </span>
  );
}

function RolePermissions({ role }) {
  const { permissions } = getRoleMeta(role);

  return (
    <div className='bg-[#0A0D10] border border-[#1F242C] p-3.5 space-y-2 text-left'>
      <div className='text-[10px] font-mono text-[#858C95] uppercase tracking-wider font-bold flex items-center gap-1.5'>
        <Sparkles size={11} className='text-amber-400' />
        Included Role Permissions
      </div>
      <ul className='space-y-1.5'>
        {permissions.map((p, idx) => (
          <li key={idx} className='text-xs font-mono text-[#C4C8CE] flex items-start gap-2'>
            <Check size={13} className='text-emerald-400 shrink-0 mt-0.5' />
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
  const [status, setStatus] = useState('pending'); // 'pending' | 'accepted' | 'declined'
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
      setError('Please sign in to your account before accepting this invitation.');
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
          'Failed to accept invitation. The invite token may be expired, revoked, or issued for another email address.'
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

  const resolvedOrgName = acceptedOrg?.name || orgParam || 'Organization Workspace';
  const resolvedRole = acceptedOrg?.role_id || roleParam || 'member';

  if (status === 'accepted') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='w-full max-w-md border border-emerald-500/30 bg-[#0D1014] p-6 sm:p-8 space-y-6 text-center'
      >
        <div className='w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400'>
          <CheckCircle2 size={24} />
        </div>

        <div className='space-y-1.5'>
          <h1 className='text-lg font-mono font-bold uppercase tracking-wider text-white'>
            Welcome to {resolvedOrgName}!
          </h1>
          <p className='text-xs font-mono text-[#858C95]'>
            You have joined as <span className='text-emerald-400 uppercase'>{resolvedRole}</span>.
          </p>
        </div>

        <div className='p-4 bg-[#090B0E] border border-[#1F242C] space-y-2 text-left'>
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Organization:</span>
            <span className='text-white font-bold'>{resolvedOrgName}</span>
          </div>
          {acceptedOrg?.slug && (
            <div className='flex items-center justify-between text-xs font-mono'>
              <span className='text-[#858C95]'>Slug:</span>
              <span className='text-[#C4C8CE]'>{acceptedOrg.slug}</span>
            </div>
          )}
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Assigned Role:</span>
            <RoleBadge role={resolvedRole} />
          </div>
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Account:</span>
            <span className='text-white truncate max-w-[200px]'>
              {currentUser?.email || 'Authenticated User'}
            </span>
          </div>
        </div>

        <div className='space-y-3 pt-2'>
          <Link
            href='/dashboard'
            className='clipped-btn w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors'
          >
            <span>Open Dashboard ({countdown}s)</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href='/projects'
            className='clipped-btn w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
          >
            Go to Projects Workspace
          </Link>
        </div>
      </motion.div>
    );
  }

  if (status === 'declined') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='w-full max-w-md border border-[#242930] bg-[#0D1014] p-6 sm:p-8 space-y-6 text-center'
      >
        <div className='w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400'>
          <AlertCircle size={24} />
        </div>

        <div className='space-y-1.5'>
          <h1 className='text-lg font-mono font-bold uppercase tracking-wider text-white'>
            Invitation Declined
          </h1>
          <p className='text-xs font-mono text-[#858C95]'>
            You chose not to accept this invitation. You can reopen it below or return home.
          </p>
        </div>

        <div className='pt-2 flex flex-col gap-2'>
          <button
            type='button'
            onClick={() => setStatus('pending')}
            className='clipped-btn w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
          >
            Reopen Invitation
          </button>
          <Link
            href='/'
            className='text-xs font-mono text-[#858C95] hover:text-white transition-colors py-1'
          >
            Return to Homepage
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className='w-full max-w-md border border-[#242930] bg-[#0D1014] p-6 sm:p-8 space-y-6'>
      <div className='text-center space-y-1 border-b border-[#1F242C] pb-5'>
        <Link href='/' className='text-xl font-bold tracking-wider text-white inline-block font-mono'>
          KR0N
        </Link>
        <div className='flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#858C95] uppercase tracking-wider'>
          <Users size={12} className='text-emerald-400' />
          <span>Organization Invitation</span>
        </div>
      </div>

      <div className='text-center space-y-3'>
        <div className='w-14 h-14 bg-[#111419] border border-[#242930] flex items-center justify-center mx-auto text-white shadow-inner'>
          <Building2 size={28} className='text-white' />
        </div>

        <div className='space-y-1'>
          <h2 className='text-xl font-mono font-bold text-white tracking-tight'>
            {orgParam || 'Join Organization'}
          </h2>
          {inviterParam ? (
            <p className='text-xs font-mono text-[#858C95]'>
              Invited by <span className='text-white font-medium'>{inviterParam}</span>
            </p>
          ) : (
            <p className='text-xs font-mono text-[#858C95]'>
              Accept this invitation to join the organization on KR0N.
            </p>
          )}
        </div>

        <div className='flex items-center justify-center gap-2 pt-1'>
          <span className='text-xs font-mono text-[#858C95]'>Role:</span>
          <RoleBadge role={roleParam} />
        </div>
      </div>

      <RolePermissions role={roleParam} />

      {error && (
        <div className='border border-red-500/40 bg-red-500/10 p-3 text-xs font-mono text-red-400 flex items-start gap-2'>
          <AlertCircle size={15} className='shrink-0 mt-0.5 text-red-400' />
          <span className='leading-tight'>{error}</span>
        </div>
      )}

      {!tokenParam && (
        <div className='space-y-1.5 text-left'>
          <label className='block text-xs font-mono text-[#C4C8CE] flex items-center gap-1.5'>
            <KeyRound size={12} className='text-[#858C95]' />
            Invitation Token
          </label>
          <input
            type='text'
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='Paste your invitation token from the invite email'
            className='w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-xs font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]'
          />
        </div>
      )}

      {isCheckingAuth ? (
        <div className='py-4 text-center space-y-2'>
          <Loader2 size={18} className='animate-spin text-white mx-auto' />
          <p className='text-xs font-mono text-[#858C95]'>Checking session...</p>
        </div>
      ) : isLoggedIn ? (
        <div className='space-y-4 pt-1'>
          <div className='bg-[#090B0E] border border-[#1F242C] p-3 flex items-center justify-between'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0'>
                {currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className='min-w-0'>
                <div className='text-xs font-mono text-white truncate flex items-center gap-1.5'>
                  <span>
                    {currentUser?.display_name ||
                      currentUser?.displayName ||
                      currentUser?.email?.split('@')[0]}
                  </span>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0' />
                </div>
                <div className='text-[10px] font-mono text-[#858C95] truncate'>
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <button
              type='button'
              onClick={handleSwitchAccount}
              title='Switch Account'
              className='text-[10px] font-mono text-[#858C95] hover:text-white flex items-center gap-1 transition-colors'
            >
              <LogOut size={11} />
              <span>Switch</span>
            </button>
          </div>

          {emailParam &&
            currentUser?.email &&
            emailParam.toLowerCase() !== currentUser.email.toLowerCase() && (
              <div className='text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2'>
                Note: This invite was addressed to <span className='underline'>{emailParam}</span>.
                You are signed in as <span className='underline'>{currentUser.email}</span>.
              </div>
            )}

          <div className='space-y-2'>
            <button
              type='button'
              onClick={handleAccept}
              disabled={isLoading || !activeToken}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className='animate-spin' />
                  <span>Accepting Invitation...</span>
                </>
              ) : (
                <>
                  <UserCheck size={13} />
                  <span>Accept Invitation & Join</span>
                </>
              )}
            </button>

            <button
              type='button'
              onClick={handleDecline}
              disabled={isLoading}
              className='w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#858C95] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-4 pt-1'>
          <div className='bg-[#090B0E] border border-[#1F242C] p-3 text-center space-y-1'>
            <p className='text-xs font-mono text-[#C4C8CE]'>
              Sign in or create an account with the invited email address to accept this invitation.
            </p>
            {emailParam && (
              <p className='text-[11px] font-mono text-[#858C95]'>
                Invite sent to <span className='text-white'>{emailParam}</span>
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Link
              href={`/login?redirect=${encodeURIComponent(currentInvitePath)}`}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors'
            >
              <span>Sign In to Accept</span>
              <ArrowRight size={13} />
            </Link>

            <Link
              href={`/signup?redirect=${encodeURIComponent(currentInvitePath)}`}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
            >
              <span>Create New Account</span>
            </Link>
          </div>
        </div>
      )}

      <div className='pt-2 border-t border-[#1F242C] text-center'>
        <p className='text-[10px] font-mono text-[#58606B] uppercase tracking-wider'>
          KR0N Control Plane &bull; Organization Membership Handshake
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className='min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4 selection:bg-white selection:text-black'>
      <Suspense
        fallback={
          <div className='w-full max-w-md border border-[#242930] bg-[#0D1014] p-8 text-center space-y-3'>
            <Loader2 size={24} className='animate-spin text-white mx-auto' />
            <p className='text-xs font-mono text-[#858C95] uppercase tracking-wider'>
              Loading invitation details...
            </p>
          </div>
        }
      >
        <InviteContent />
      </Suspense>
    </div>
  );
}
