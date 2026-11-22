import DocsHeader from '@/components/docs/DocsHeader';
import Link from 'next/link';

export const metadata = {
  title: 'Documentation — kr0n',
  description:
    'Control plane documentation for connecting GitHub repositories, configuring Railpack builds, and managing organization access in kr0n.',
};

export default function DocsRootLayout({ children }) {
  return (
    <div className='min-h-screen bg-kr0n-canvas text-kr0n-text flex flex-col font-sans'>
      <DocsHeader />

      <div className='flex-1 flex flex-col min-h-0'>{children}</div>

      <footer className='border-t border-kr0n-line bg-kr0n-black py-8 px-6 sm:px-8 mt-auto'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-kr0n-muted'>
          <div className='flex items-center gap-3'>
            <span className='font-mono font-semibold text-kr0n-text'>kr0n</span>
            <span>Control plane documentation</span>
          </div>
          <div className='flex items-center gap-6'>
            <Link href='/dashboard' className='hover:text-kr0n-text transition-colors duration-150'>
              Console
            </Link>
            <Link href='/projects' className='hover:text-kr0n-text transition-colors duration-150'>
              Projects
            </Link>
            <Link href='/settings' className='hover:text-kr0n-text transition-colors duration-150'>
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
