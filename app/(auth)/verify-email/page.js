'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { verifyEmail, resendVerification } from '@/lib/auth';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendOpen, setResendOpen] = useState(false);

  const handleVerify = useCallback(
    async (tokenToUse) => {
      const t = tokenToUse || token;
      if (!t) return;

      setError('');
      setSuccess('');
      setIsLoading(true);

      try {
        await verifyEmail(t);
        setSuccess('Your email address has been verified. Redirecting to sign in...');
        setTimeout(() => router.push('/login'), 2500);
      } catch (err) {
        console.error('[kr0n-verify] Error:', err);
        setError(
          err.message || 'Failed to verify email. The token may be invalid or expired.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token, router]
  );

  useEffect(() => {
    if (tokenParam) {
      const timer = setTimeout(() => {
        handleVerify(tokenParam);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tokenParam, handleVerify]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await resendVerification(email);
      setSuccess('A new verification email has been sent. Check your inbox.');
      setResendOpen(false);
    } catch (err) {
      console.error('[kr0n-verify] Resend error:', err);
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title='Verify email address'
      subtitle={
        resendOpen
          ? 'Request a fresh verification token for your account.'
          : 'Enter the verification token sent to your inbox.'
      }
    >
      <AuthBanner type='error' message={error} />
      <AuthBanner type='success' message={success} />

      {!resendOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className='space-y-4'
        >
          <div className='space-y-1.5'>
            <label
              htmlFor='verify-token'
              className='block text-xs font-medium text-kr0n-text-secondary'
            >
              Verification token
            </label>
            <input
              id='verify-token'
              type='text'
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder='Paste token from verification email'
              disabled={isLoading}
              className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm font-mono text-kr0n-text px-3 outline-none transition-colors duration-150'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading || !token}
            className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
          >
            {isLoading ? 'Verifying...' : 'Verify email'}
          </button>

          <div className='pt-1 flex items-center justify-between text-xs text-kr0n-muted'>
            <button
              type='button'
              onClick={() => {
                setResendOpen(true);
                setError('');
                setSuccess('');
              }}
              className='hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
            >
              Resend verification
            </button>
            <Link href='/login' className='text-kr0n-text font-medium hover:underline'>
              Sign in
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResend} className='space-y-4'>
          <div className='space-y-1.5'>
            <label
              htmlFor='resend-email'
              className='block text-xs font-medium text-kr0n-text-secondary'
            >
              Account email
            </label>
            <input
              id='resend-email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='name@company.com'
              disabled={isLoading}
              className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading || !email}
            className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
          >
            {isLoading ? 'Sending...' : 'Send verification email'}
          </button>

          <button
            type='button'
            onClick={() => {
              setResendOpen(false);
              setError('');
              setSuccess('');
            }}
            className='w-full h-10 rounded-lg border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
          >
            Back to verification
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title='Verify email address'>
          <div className='py-6 text-center space-y-3'>
            <Loader2 size={20} className='animate-spin text-kr0n-muted mx-auto' />
            <p className='text-sm text-kr0n-muted'>Loading verification...</p>
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
