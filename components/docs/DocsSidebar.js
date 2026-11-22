'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_SECTIONS } from '@/lib/docs-data';

export default function DocsSidebar({ activeSectionId = null }) {
  const pathname = usePathname();
  const activeSection = DOCS_SECTIONS.find(
    (s) => s.id === activeSectionId || pathname === s.slug
  );

  return (
    <aside className='hidden lg:block w-56 shrink-0 border-r border-kr0n-line bg-kr0n-black px-3 py-8 sticky top-13 h-[calc(100vh-3.25rem)] overflow-y-auto'>
      <div className='space-y-8'>
        <div className='space-y-0.5'>
          <div className='px-2.5 pb-1.5 text-xs text-kr0n-muted'>
            Guides
          </div>

          <Link
            href='/docs'
            className={`relative flex items-center h-8 px-2.5 text-[13px] transition-colors duration-150 ${
              pathname === '/docs'
                ? 'text-white font-medium'
                : 'text-kr0n-muted hover:text-white'
            }`}
          >
            {pathname === '/docs' && (
              <span aria-hidden='true' className='absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-kr0n-accent' />
            )}
            <span>Overview</span>
          </Link>

          {DOCS_SECTIONS.map((sec) => {
            const isActive = pathname === sec.slug;
            const isComingSoon = sec.status === 'COMING_SOON';
            return (
              <Link
                key={sec.id}
                href={sec.slug}
                className={`relative flex items-center justify-between gap-2 h-8 px-2.5 text-[13px] transition-colors duration-150 ${
                  isActive
                    ? 'text-white font-medium'
                    : isComingSoon
                    ? 'text-kr0n-faint hover:text-kr0n-text-secondary'
                    : 'text-kr0n-muted hover:text-white'
                }`}
              >
                {isActive && (
                  <span aria-hidden='true' className='absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-kr0n-accent' />
                )}
                <span className='truncate'>{sec.title}</span>
                {isComingSoon && (
                  <span className='text-[11px] font-mono text-kr0n-faint shrink-0'>
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {activeSection && activeSection.subsections?.length > 0 && (
          <div className='pt-5 border-t border-kr0n-line space-y-1'>
            <div className='px-2.5 pb-1.5 text-xs text-kr0n-muted'>
              On this page
            </div>
            <ul className='space-y-0.5'>
              {activeSection.subsections.map((sub) => (
                <li key={sub.id}>
                  <a
                    href={`#${sub.id}`}
                    className='block px-2.5 py-1.5 text-xs text-kr0n-muted hover:text-white transition-colors duration-150 truncate'
                  >
                    {sub.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
