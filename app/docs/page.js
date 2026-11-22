import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DOCS_SECTIONS } from '@/lib/docs-data';
import DocsSidebar from '@/components/docs/DocsSidebar';

export const metadata = {
  title: 'Documentation — kr0n',
  description:
    'Guides and control plane reference for connecting GitHub repositories, mapping monorepos, configuring builds, and managing organization access in kr0n.',
};

const API_SURFACE = [
  { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate with email/password and set HttpOnly session cookies.' },
  { method: 'GET', path: '/api/v1/orgs', desc: 'List organizations and your assigned role in each.' },
  { method: 'POST', path: '/api/v1/orgs/{org_id}/github/installations', desc: 'Link a verified GitHub App installation to an organization.' },
  { method: 'POST', path: '/api/v1/orgs/{org_id}/projects', desc: 'Create a project bound to a GitHub repository, branch, and root directory.' },
  { method: 'PUT', path: '/api/v1/orgs/{org_id}/projects/{project_id}/build-settings', desc: 'Update custom install, build, and output overrides with expected_revision.' },
  { method: 'GET', path: '/api/v1/orgs/{org_id}/audit', desc: 'Query paginated organization security and administrative events.' },
];

export default function DocsHomePage() {
  const activeGuides = DOCS_SECTIONS.filter((s) => s.status !== 'COMING_SOON');
  const plannedGuides = DOCS_SECTIONS.filter((s) => s.status === 'COMING_SOON');

  return (
    <div className='max-w-[1240px] mx-auto w-full flex flex-1'>
      <DocsSidebar />

      <main className='flex-1 min-w-0 px-6 sm:px-10 py-10 sm:py-12 max-w-4xl space-y-12'>
        <header className='space-y-4 border-b border-kr0n-line pb-8'>
          <h1 className='text-3xl sm:text-4xl font-semibold tracking-tight text-white'>
            Documentation
          </h1>
          <p className='text-base text-kr0n-text-secondary max-w-2xl leading-relaxed'>
            Everything needed to connect GitHub repositories, configure versioned builds, and manage organization access, scoped API tokens, and audit trails in kr0n.
          </p>
          <div className='pt-2 flex flex-wrap items-center gap-4'>
            <Link
              href='/docs/quick-start'
              className='inline-flex items-center gap-2 h-10 px-5 rounded-[6px] bg-kr0n-text hover:bg-white text-kr0n-black text-sm font-medium transition-colors duration-150'
            >
              <span>Read quick start</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href='/projects/new'
              className='inline-flex items-center h-10 px-4 rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong text-sm font-medium text-white transition-colors duration-150'
            >
              Import a repository
            </Link>
          </div>
        </header>

        {/* Active Guides */}
        <section className='space-y-4'>
          <h2 className='text-base font-medium text-white'>Guides</h2>
          <div className='space-y-3'>
            {activeGuides.map((sec) => (
              <Link
                key={sec.id}
                href={sec.slug}
                className='group rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150'
              >
                <div className='space-y-1.5 max-w-xl'>
                  <h3 className='text-base font-medium text-white group-hover:text-kr0n-accent transition-colors duration-150'>
                    {sec.title}
                  </h3>
                  <p className='text-sm text-kr0n-text-secondary leading-relaxed'>
                    {sec.shortDesc}
                  </p>
                </div>
                <span className='inline-flex items-center gap-1.5 text-sm font-medium text-white shrink-0'>
                  <span>Open</span>
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Control Plane API Overview */}
        <section className='space-y-4'>
          <div className='space-y-1'>
            <h2 className='text-base font-medium text-white'>Control plane API surface</h2>
            <p className='text-sm text-kr0n-muted'>
              All console operations run over <code className='font-mono text-xs text-kr0n-text'>/api/v1</code> using HttpOnly session cookies or scoped organization bearer tokens.
            </p>
          </div>
          <div className='rounded-[6px] border border-kr0n-line bg-kr0n-black overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-kr0n-line text-kr0n-muted'>
                  <th className='px-4 py-2.5 font-normal'>Method</th>
                  <th className='px-4 py-2.5 font-normal'>Endpoint</th>
                  <th className='px-4 py-2.5 font-normal'>Purpose</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-kr0n-line-soft'>
                {API_SURFACE.map((row) => (
                  <tr key={row.path}>
                    <td className='px-4 py-3 font-mono text-kr0n-accent font-medium shrink-0'>
                      {row.method}
                    </td>
                    <td className='px-4 py-3 font-mono text-white whitespace-nowrap'>
                      {row.path}
                    </td>
                    <td className='px-4 py-3 text-kr0n-text-secondary'>
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Roadmap Guides */}
        <section className='space-y-4'>
          <h2 className='text-base font-medium text-white'>Roadmap</h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {plannedGuides.map((sec) => (
              <Link
                key={sec.id}
                href={sec.slug}
                className='rounded-[6px] border border-kr0n-line bg-kr0n-black hover:border-kr0n-line-strong p-5 space-y-2 transition-colors duration-150'
              >
                <div className='flex items-center justify-between gap-2'>
                  <h3 className='text-sm font-medium text-white'>{sec.title}</h3>
                  <span className='text-xs font-mono text-kr0n-faint'>Soon</span>
                </div>
                <p className='text-xs text-kr0n-muted leading-relaxed'>
                  {sec.shortDesc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
