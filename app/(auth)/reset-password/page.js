'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { confirmPasswordReset, validatePasswordPolicy } from '@/lib/auth';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passCheck = validatePasswordPolicy(newPassword);
    if (!passCheck.valid) {
      setError(passCheck.error);
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(token, newPassword);
      setSuccess('Password updated. Redirecting to sign in...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      console.error('[kr0n-reset] Error:', err);
      setError(
        err.message || 'Failed to reset password. The token may be invalid or expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title='Set a new password'
      subtitle='Choose a password between 8 and 72 characters.'
      footer={
        <Link href='/login' className='text-kr0n-muted hover:text-kr0n-text transition-colors duration-150'>
          Back to sign in
        </Link>
      }
    >
      <AuthBanner type='error' message={error} />
      <AuthBanner type='success' message={success} />

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-1.5'>
          <label
            htmlFor='reset-token'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Reset token
          </label>
          <input
            id='reset-token'
            type='text'
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='Paste token from reset email'
            disabled={isLoading}
            className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm font-mono text-kr0n-text px-3 outline-none transition-colors duration-150'
          />
        </div>

        <div className='space-y-1.5'>
          <label
            htmlFor='reset-new-password'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            New password
          </label>
          <input
            id='reset-new-password'
            type='password'
            required
            autoComplete='new-password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder='Minimum 8 characters'
            disabled={isLoading}
            className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
          />
        </div>

        <div className='space-y-1.5'>
          <label
            htmlFor='reset-confirm-password'
            className='block text-xs font-medium text-kr0n-text-secondary'
          >
            Confirm password
          </label>
          <input
            id='reset-confirm-password'
            type='password'
            required
            autoComplete='new-password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder='Re-enter password'
            disabled={isLoading}
            className='w-full h-10 rounded-lg bg-kr0n-black border border-kr0n-line hover:border-kr0n-line-strong focus:border-kr0n-accent text-sm text-kr0n-text px-3 outline-none transition-colors duration-150'
          />
        </div>

        <button
          type='submit'
          disabled={isLoading || !token || !newPassword}
          className='w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150 disabled:opacity-50 cursor-pointer'
        >
          {isLoading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title='Set a new password'>
          <div className='py-6 text-center space-y-3'>
            <Loader2 size={20} className='animate-spin text-kr0n-muted mx-auto' />
            <p className='text-sm text-kr0n-muted'>Loading reset form...</p>
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
