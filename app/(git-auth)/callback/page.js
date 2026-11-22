'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import {
  completeOAuthCallback,
  consumeOAuthRedirect,
  getMe,
} from '@/lib/auth';
import AuthCard, { AuthBanner } from '@/components/auth/AuthCard';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState('Verifying authorization...');
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function processCallback() {
      const errParam = searchParams.get('error');
      const errDesc = searchParams.get('error_description');
      if (errParam) {
        if (active) {
          setError(errDesc || `Authentication failed: ${errParam}`);
        }
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const providerParam = searchParams.get('provider');

      if (code) {
        if (active) {
          setStatus('Completing sign-in...');
        }

        try {
          const { redirect } = await completeOAuthCallback(
            providerParam,
            code,
            state
          );

          if (active) {
            setIsSuccess(true);
            setStatus('Signed in. Redirecting to console...');
            setTimeout(() => router.replace(redirect), 500);
          }
          return;
        } catch (err) {
          if (active) {
            setError(err.message || 'Failed to exchange OAuth authorization code.');
          }
          return;
        }
      }

      const existingUser = await getMe();
      if (!active) return;

      if (existingUser) {
        router.replace(consumeOAuthRedirect('/dashboard'));
      } else {
        router.replace('/login');
      }
    }

    processCallback();

    return () => {
      active = false;
    };
  }, [searchParams, router]);

  return (
    <AuthCard title={error ? 'Sign-in failed' : isSuccess ? 'Signed in' : 'Signing in'}>
      {error ? (
        <div className='space-y-4'>
          <AuthBanner type='error' message={error} />
          <Link
            href='/login'
            className='flex items-center justify-center w-full h-10 rounded-lg bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors duration-150'
          >
            Back to sign in
          </Link>
        </div>
      ) : isSuccess ? (
        <div className='py-4 text-center space-y-3'>
          <CheckCircle2 size={24} className='text-kr0n-healthy mx-auto' />
          <p className='text-sm text-kr0n-text-secondary'>{status}</p>
        </div>
      ) : (
        <div className='py-4 text-center space-y-3'>
          <Loader2 size={22} className='animate-spin text-kr0n-muted mx-auto' />
          <p className='text-sm text-kr0n-muted'>{status}</p>
        </div>
      )}
    </AuthCard>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title='Signing in'>
          <div className='py-4 text-center space-y-3'>
            <Loader2 size={22} className='animate-spin text-kr0n-muted mx-auto' />
            <p className='text-sm text-kr0n-muted'>Loading session...</p>
          </div>
        </AuthCard>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
