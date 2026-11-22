'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  register,
  login,
  loginWithOAuth,
  resolveAuthRedirect,
  validateDisplayNamePolicy,
  validatePasswordPolicy,
  getMe,
} from '@/lib/auth';
import OAuthButtons from '@/components/auth/OAuthButtons';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
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

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    const nameCheck = validateDisplayNamePolicy(name);
    if (!nameCheck.valid) {
      setError(nameCheck.error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.valid) {
      setError(passCheck.error);
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);

      try {
        await login(email, password);
        setSuccessMsg('Account created. Redirecting...');
        router.push(resolveAuthRedirect());
      } catch (loginErr) {
        if (
          loginErr.message &&
          loginErr.message.toLowerCase().includes('verif')
        ) {
          setSuccessMsg(
            'Account created. Verify your email address before signing in.'
          );
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setSuccessMsg(
            'Account registered. Sign in with your credentials.'
          );
          setTimeout(() => router.push('/login'), 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
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
      title='Create your account'
      subtitle='Set up your kr0n workspace and connect repositories.'
      footer={
        <>
          Already have an account?{' '}
          <Link href='/login' className='text-kr0n-text font-medium hover:underline'>
            Sign in
          </Link>
        </>
      }
    >
      <AuthBanner type='error' message={error} />
      <AuthBanner type='success' message={successMsg} />

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
            htmlFor='signup-name'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Display name
          </label>
          <input
            id='signup-name'
            type='text'
            required
            maxLength={100}
            autoComplete='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Your name'
            disabled={isLoading}
            className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
          />
        </div>

        <div className='space-y-1.5'>
          <label
            htmlFor='signup-email'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Email
          </label>
          <input
            id='signup-email'
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
          <label
            htmlFor='signup-password'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Password
          </label>
          <div className='relative'>
            <input
              id='signup-password'
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete='new-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='8 to 72 characters'
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

        <div className='space-y-1.5'>
          <label
            htmlFor='signup-confirm-password'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Confirm password
          </label>
          <div className='relative'>
            <input
              id='signup-confirm-password'
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Re-enter password'
              disabled={isLoading}
              className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 pr-10 outline-none transition-colors duration-150'
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-kr0n-muted hover:text-kr0n-text p-1 rounded cursor-pointer'
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading || !!socialLoading}
          className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
