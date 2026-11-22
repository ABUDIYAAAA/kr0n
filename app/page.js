'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, consumeOAuthRedirect } from '@/lib/auth';
import SiteHeader from './components/SiteHeader';
import HeroSection from './components/HeroSection';
import ManifestoScene from './components/ManifestoScene';
import RepoTypeDemo from './components/RepoTypeDemo';
import OperationalSurface from './components/OperationalSurface';
import FaqSection from './components/FaqSection';
import FinalCTA from './components/FinalCTA';
import SiteFooter from './components/SiteFooter';
import CommandLayer from './components/CommandLayer';

export default function HomePage() {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user) {
          router.replace(consumeOAuthRedirect('/dashboard'));
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className='min-h-svh bg-kr0n-canvas text-kr0n-text flex flex-col font-sans'>
      <CommandLayer
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
      />

      <SiteHeader />

      <main className='flex-1'>
        <HeroSection />
        <ManifestoScene />
        <RepoTypeDemo />
        <OperationalSurface />
        <FaqSection />
        <FinalCTA />
      </main>

      <SiteFooter onOpenCommand={() => setCommandOpen(true)} />
    </div>
  );
}
