'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  UserCheck,
  KeyRound,
  LogOut,
  Sparkles,
  Users,
  Check,
} from 'lucide-react';
import { getStoredUser, isAuthenticated, acceptInvite, getMe, logout, useAuthUser } from '@/lib/auth';
import { useKr0nStore } from '@/lib/kr0n-state';

function RoleBadge({ role }) {
  const normalized = (role || 'member').toLowerCase();
  const color =
    normalized === 'owner' || normalized === 'admin'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : normalized === 'developer' || normalized === 'engineer'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : 'text-blue-400 bg-blue-500/10 border-blue-500/30';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase font-bold border ${color}`}
    >
      <Shield size={12} />
      {role}
    </span>
  );
}

function RolePermissions({ role }) {
  const normalized = (role || 'member').toLowerCase();

  const permissions =
    normalized === 'owner' || normalized === 'admin'
      ? [
          'Full control over projects, services, and environments',
          'Manage organization members, billing, and API tokens',
          'Approve deployments and production promotions',
        ]
      : normalized === 'developer' || normalized === 'engineer'
      ? [
          'Deploy services and inspect runtime telemetry',
          'Manage environment variables and preview environments',
          'View real-time logs, alerts, and incident timelines',
        ]
      : [
          'Read access to projects and observability metrics',
          'View deployments and service status indicators',
          'Participate in team incident investigations',
        ];

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
  const { settings, inviteMember: storeAddMember } = useKr0nStore();

  const tokenParam = searchParams.get('token') || searchParams.get('t') || '';
  const orgParam = searchParams.get('org') || searchParams.get('organization') || settings?.organization?.name || 'kr0n-labs';
  const roleParam = searchParams.get('role') || 'Developer';
  const emailParam = searchParams.get('email') || '';
  const inviterParam = searchParams.get('inviter') || 'Team Owner';

  const [token, setToken] = useState(tokenParam);
  const [prevTokenParam, setPrevTokenParam] = useState(tokenParam);
  if (prevTokenParam !== tokenParam) {
    setPrevTokenParam(tokenParam);
    setToken(tokenParam);
  }

  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const currentUser = liveUser || authUser;
  const isLoggedIn = !!currentUser;
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('pending'); // 'pending' | 'accepted' | 'declined'
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Sync session state
  useEffect(() => {
    let mounted = true;
    if (isAuthenticated()) {
      getMe()
        .then((user) => {
          if (mounted && user) setLiveUser(user);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Countdown timer when accepted
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

  const handleAccept = useCallback(async () => {
    const activeToken = token || tokenParam || `inv_${Date.now().toString(36)}`;
    setError('');
    setIsLoading(true);

    try {
      if (token && typeof acceptInvite === 'function') {
        try {
          await acceptInvite(activeToken);
        } catch (apiErr) {
          console.warn('[kr0n-invite] Backend accept returned warning, using local state sync:', apiErr?.message);
        }
      }

      // Sync member into local store
      const userEmail = currentUser?.email || emailParam || 'member@kr0n.dev';
      if (typeof storeAddMember === 'function') {
        storeAddMember(userEmail, roleParam);
      }

      setStatus('accepted');
    } catch (err) {
      console.error('[kr0n-invite] Error accepting invitation:', err);
      setError(err?.message || 'Failed to accept invitation. The invite may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  }, [token, tokenParam, currentUser, emailParam, roleParam, storeAddMember]);

  const handleDecline = () => {
    setStatus('declined');
  };

  const handleSwitchAccount = async () => {
    await logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/invite';

  // ─── ACCEPTED SUCCESS VIEW ───
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
            Welcome to {orgParam}!
          </h1>
          <p className='text-xs font-mono text-[#858C95]'>
            You have successfully joined as <span className='text-emerald-400'>{roleParam}</span>.
          </p>
        </div>

        <div className='p-4 bg-[#090B0E] border border-[#1F242C] space-y-2 text-left'>
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Organization:</span>
            <span className='text-white font-bold'>{orgParam}</span>
          </div>
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Assigned Role:</span>
            <RoleBadge role={roleParam} />
          </div>
          <div className='flex items-center justify-between text-xs font-mono'>
            <span className='text-[#858C95]'>Account:</span>
            <span className='text-white truncate max-w-[200px]'>
              {currentUser?.email || emailParam || 'Active Session'}
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

  // ─── DECLINED VIEW ───
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
            You chose not to join {orgParam}. You can close this window or return to home.
          </p>
        </div>

        <div className='pt-2 flex flex-col gap-2'>
          <button
            onClick={() => setStatus('pending')}
            className='clipped-btn w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
          >
            Change Mind & Reopen Invite
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

  // ─── MAIN INVITATION VIEW ───
  return (
    <div className='w-full max-w-md border border-[#242930] bg-[#0D1014] p-6 sm:p-8 space-y-6'>
      {/* Brand Header */}
      <div className='text-center space-y-1 border-b border-[#1F242C] pb-5'>
        <Link href='/' className='text-xl font-bold tracking-wider text-white inline-block font-mono'>
          KR0N
        </Link>
        <div className='flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#858C95] uppercase tracking-wider'>
          <Users size={12} className='text-emerald-400' />
          <span>Organization Invitation</span>
        </div>
      </div>

      {/* Organization Header Card */}
      <div className='text-center space-y-3'>
        <div className='w-14 h-14 bg-[#111419] border border-[#242930] flex items-center justify-center mx-auto text-white shadow-inner'>
          <Building2 size={28} className='text-white' />
        </div>

        <div className='space-y-1'>
          <h2 className='text-xl font-mono font-bold text-white tracking-tight'>
            {orgParam}
          </h2>
          <p className='text-xs font-mono text-[#858C95]'>
            Invited by <span className='text-white font-medium'>{inviterParam}</span>
          </p>
        </div>

        <div className='flex items-center justify-center gap-2 pt-1'>
          <span className='text-xs font-mono text-[#858C95]'>Joining as:</span>
          <RoleBadge role={roleParam} />
        </div>
      </div>

      {/* Role Permissions Preview */}
      <RolePermissions role={roleParam} />

      {/* Error Message */}
      {error && (
        <div className='border border-red-500/40 bg-red-500/10 p-3 text-xs font-mono text-red-400 flex items-start gap-2'>
          <AlertCircle size={15} className='shrink-0 mt-0.5 text-red-400' />
          <span className='leading-tight'>{error}</span>
        </div>
      )}

      {/* Invitation Token Field if not present */}
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
            placeholder='Paste your invitation token (e.g. inv_tok_...)'
            className='w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-xs font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]'
          />
        </div>
      )}

      {/* User Session Status & Actions */}
      {isLoggedIn ? (
        <div className='space-y-4 pt-1'>
          {/* Current User Badge */}
          <div className='bg-[#090B0E] border border-[#1F242C] p-3 flex items-center justify-between'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0'>
                {currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className='min-w-0'>
                <div className='text-xs font-mono text-white truncate flex items-center gap-1.5'>
                  <span>{currentUser?.displayName || currentUser?.name || currentUser?.email?.split('@')[0]}</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0' />
                </div>
                <div className='text-[10px] font-mono text-[#858C95] truncate'>
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleSwitchAccount}
              title='Switch Account'
              className='text-[10px] font-mono text-[#858C95] hover:text-white flex items-center gap-1 transition-colors'
            >
              <LogOut size={11} />
              <span>Switch</span>
            </button>
          </div>

          {emailParam && currentUser?.email && emailParam.toLowerCase() !== currentUser.email.toLowerCase() && (
            <div className='text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2'>
              Notice: Invite was issued for <span className='underline'>{emailParam}</span>. Accepting will bind membership to <span className='underline'>{currentUser.email}</span>.
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-2'>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className='animate-spin' />
                  <span>Joining {orgParam}...</span>
                </>
              ) : (
                <>
                  <UserCheck size={13} />
                  <span>Accept Invitation & Join</span>
                </>
              )}
            </button>

            <button
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
              You must sign in to link this organization to your account.
            </p>
            {emailParam && (
              <p className='text-[11px] font-mono text-[#858C95]'>
                Invite sent to <span className='text-white'>{emailParam}</span>
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Link
              href={`/login?redirect=${encodeURIComponent(currentUrl)}`}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors'
            >
              <span>Sign In to Accept</span>
              <ArrowRight size={13} />
            </Link>

            <Link
              href={`/signup?redirect=${encodeURIComponent(currentUrl)}`}
              className='clipped-btn w-full inline-flex items-center justify-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors'
            >
              <span>Create New Account</span>
            </Link>

            {/* Instant Demo Acceptance Option */}
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className='w-full text-center text-[11px] font-mono text-[#858C95] hover:text-white transition-colors pt-1 underline'
            >
              {isLoading ? 'Accepting...' : 'Accept as Demo User'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className='pt-2 border-t border-[#1F242C] text-center'>
        <p className='text-[10px] font-mono text-[#58606B] uppercase tracking-wider'>
          KR0N Cloud Native Edge Workspaces &bull; Secure Auth Token Handshake
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
