'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  login,
  loginWithOAuth,
  requestPasswordReset,
  resolveAuthRedirect,
  getMe,
} from '@/lib/auth';
import OAuthButtons from '@/components/auth/OAuthButtons';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const search =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const resetTokenParam = search?.get('token');
    if (resetTokenParam) {
      router.replace(`/reset-password?token=${encodeURIComponent(resetTokenParam)}`);
      return;
    }

    const destination = resolveAuthRedirect();

    getMe()
      .then((user) => {
        if (user) {
          router.replace(destination);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      setSuccessMsg('Signed in. Redirecting...');
      router.push(resolveAuthRedirect());
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email) return;

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setForgotSent(true);
      setSuccessMsg(
        'Password reset instructions sent. Check your inbox for the reset link.'
      );
    } catch (err) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setSuccessMsg('');
    setSocialLoading(provider);

    try {
      await loginWithOAuth(provider, { redirect: resolveAuthRedirect() });
    } catch (err) {
      setError(err.message || `Unable to authenticate with ${provider}.`);
      setSocialLoading(null);
    }
  };

  return (
    <AuthCard
      title={showForgot ? 'Reset password' : 'Sign in to kr0n'}
      subtitle={
        showForgot
          ? 'Enter your account email to receive a reset link.'
          : 'Continue with your workspace account.'
      }
      footer={
        !showForgot ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href='/signup' className='text-kr0n-text font-medium hover:underline'>
              Sign up
            </Link>
          </>
        ) : null
      }
    >
      <AuthBanner type='error' message={error} />
      <AuthBanner type='success' message={successMsg} />

      {!showForgot ? (
        <>
          <OAuthButtons
            onSelectProvider={handleOAuth}
            socialLoading={socialLoading}
            disabled={isLoading}
          />

          <div className='relative flex items-center justify-center'>
            <div className='w-full border-t border-kr0n-line' />
            <span className='absolute bg-kr0n-surface px-2.5 text-xs text-kr0n-muted'>
              or
            </span>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1.5'>
              <label
                htmlFor='login-email'
                className='block text-xs font-medium text-kr0n-text-secondary'
              >
                Email
              </label>
              <input
                id='login-email'
                type='email'
                required
                autoComplete='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='name@company.com'
                disabled={isLoading}
                className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
              />
            </div>

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='login-password'
                  className='text-xs font-medium text-kr0n-text-secondary'
                >
                  Password
                </label>
                <button
                  type='button'
                  onClick={() => {
                    setShowForgot(true);
                    setForgotSent(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className='text-xs text-kr0n-muted hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
                >
                  Forgot password?
                </button>
              </div>
              <div className='relative'>
                <input
                  id='login-password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete='current-password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  disabled={isLoading}
                  className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 pr-10 outline-none transition-colors duration-150'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2.5 top-1/2 -translate-y-1/2 text-kr0n-muted hover:text-kr0n-text p-1 rounded cursor-pointer'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading || !!socialLoading}
              className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </>
      ) : (
        <div className='space-y-4'>
          {!forgotSent ? (
            <form onSubmit={handleForgot} className='space-y-4'>
              <div className='space-y-1.5'>
                <label
                  htmlFor='forgot-email'
                  className='block text-xs font-medium text-kr0n-text-secondary'
                >
                  Account email
                </label>
                <input
                  id='forgot-email'
                  type='email'
                  required
                  autoComplete='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='name@company.com'
                  disabled={isLoading}
                  className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
                />
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className='space-y-3'>
              <p className='text-sm text-kr0n-text-secondary leading-relaxed'>
                Follow the link in your email, or enter your reset token directly on the password reset page.
              </p>
              <Link
                href='/reset-password'
                className='flex items-center justify-center w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
              >
                Enter reset token
              </Link>
            </div>
          )}

          <button
            type='button'
            onClick={() => {
              setShowForgot(false);
              setForgotSent(false);
              setError('');
              setSuccessMsg('');
            }}
            className='w-full h-10 rounded-lg border border-kr0n-line bg-kr0n-surface-2 hover:bg-kr0n-surface-3 hover:border-kr0n-line-strong text-sm font-medium text-kr0n-text-secondary hover:text-kr0n-text transition-colors duration-150 cursor-pointer'
          >
            Back to sign in
          </button>
        </div>
      )}
    </AuthCard>
  );
}
