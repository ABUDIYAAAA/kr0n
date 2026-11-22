'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMe, logout, useAuthUser } from '@/lib/auth';
import { Menu, X } from 'lucide-react';
import Kr0nMark from '@/components/common/Kr0nMark';

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authUser = useAuthUser();
  const [liveUser, setLiveUser] = useState(null);
  const user = liveUser || authUser;

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((me) => {
        if (mounted && me) setLiveUser(me);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setLiveUser(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className='sticky top-0 z-40 bg-kr0n-canvas'>
      <div className='max-w-[1320px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-6'>
        <div className='flex items-center gap-10'>
          <Link
            href='/'
            className='inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-white'
          >
            <Kr0nMark size={19} />
            <span>kr0n</span>
          </Link>

          <nav aria-label='Primary' className='hidden md:flex items-center gap-7 text-sm text-kr0n-text-secondary'>
            <a href='#how-it-works' className='hover:text-white transition-colors duration-150'>
              Workflow
            </a>
            <a href='#platform' className='hover:text-white transition-colors duration-150'>
              Platform
            </a>
            <a href='#faq' className='hover:text-white transition-colors duration-150'>
              Questions
            </a>
            <Link href='/docs' className='hover:text-white transition-colors duration-150'>
              Docs
            </Link>
          </nav>
        </div>

        <div className='flex items-center gap-5'>
          {user ? (
            <div className='hidden sm:flex items-center gap-5'>
              <button
                type='button'
                onClick={handleLogout}
                className='text-sm text-kr0n-text-secondary hover:text-white transition-colors duration-150 cursor-pointer'
              >
                Sign out
              </button>
              <Link
                href='/dashboard'
                className='inline-flex items-center h-10 px-5 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium transition-colors duration-150'
              >
                Open console
              </Link>
            </div>
          ) : (
            <div className='hidden sm:flex items-center gap-5'>
              <Link
                href='/login'
                className='text-sm text-kr0n-text-secondary hover:text-white transition-colors duration-150'
              >
                Log in
              </Link>
              <Link
                href='/signup'
                className='inline-flex items-center h-10 px-5 bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium transition-colors duration-150'
              >
                Start building
              </Link>
            </div>
          )}

          <button
            type='button'
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className='md:hidden p-2 text-kr0n-text-secondary hover:text-white transition-colors duration-150'
            aria-label='Toggle navigation menu'
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className='md:hidden bg-kr0n-black px-6 py-5 space-y-5'>
          <div className='flex flex-col space-y-3 text-base text-kr0n-text-secondary'>
            <a href='#how-it-works' onClick={() => setMobileMenuOpen(false)} className='hover:text-white'>
              Workflow
            </a>
            <a href='#platform' onClick={() => setMobileMenuOpen(false)} className='hover:text-white'>
              Platform
            </a>
            <a href='#faq' onClick={() => setMobileMenuOpen(false)} className='hover:text-white'>
              Questions
            </a>
            <Link href='/docs' onClick={() => setMobileMenuOpen(false)} className='hover:text-white'>
              Docs
            </Link>
          </div>
          <div className='flex items-center gap-3'>
            {user ? (
              <>
                <Link
                  href='/dashboard'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex-1 text-center py-2.5 bg-kr0n-text text-kr0n-black text-sm font-medium'
                >
                  Open console
                </Link>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='px-4 py-2.5 bg-kr0n-surface-2 text-sm text-kr0n-text'
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex-1 text-center py-2.5 bg-kr0n-surface-2 text-sm text-kr0n-text'
                >
                  Log in
                </Link>
                <Link
                  href='/signup'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex-1 text-center py-2.5 bg-kr0n-text text-kr0n-black text-sm font-medium'
                >
                  Start building
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
