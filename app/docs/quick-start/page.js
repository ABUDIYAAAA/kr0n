import Link from 'next/link';
import DocsSidebar from '@/components/docs/DocsSidebar';
import CodeBlock from '@/components/docs/CodeBlock';
import DocsCallout from '@/components/docs/DocsCallout';
import DocsPagination from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Quick start — kr0n docs',
  description:
    'Connect the kr0n GitHub App, import a repository, configure versioned build overrides, and set up team access.',
};

export default function QuickStartPage() {
  return (
    <div className='max-w-[1240px] mx-auto w-full flex flex-1'>
      <DocsSidebar activeSectionId='quick-start' />

      <article className='flex-1 min-w-0 px-6 sm:px-10 py-10 sm:py-12 max-w-3xl'>
        <header id='overview' className='scroll-mt-20 space-y-3 border-b border-kr0n-line pb-8'>
          <h1 className='text-3xl font-semibold tracking-tight text-white'>
            Quick start
          </h1>
          <p className='text-base text-kr0n-text-secondary leading-relaxed'>
            Connect a GitHub repository to your organization, select its branch and root directory, and configure versioned build settings.
          </p>
        </header>

        <div className='mt-10 space-y-12 text-[15px] text-kr0n-text-secondary leading-7'>
          <section id='prerequisites' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Prerequisites
            </h2>
            <p>Before importing your first repository, make sure you have:</p>
            <ul className='list-disc pl-5 space-y-2 text-sm text-kr0n-text-secondary'>
              <li>
                A kr0n account created via email/password, Google, or GitHub OAuth at{' '}
                <Link href='/signup' className='text-white underline underline-offset-4'>
                  /signup
                </Link>
                .
              </li>
              <li>
                An active organization workspace (created automatically on first import or manually under{' '}
                <Link href='/settings' className='text-white underline underline-offset-4'>
                  Settings
                </Link>
                ).
              </li>
              <li>
                Permission to install a GitHub App on the personal account or GitHub organization holding your repository.
              </li>
            </ul>
          </section>

          <section id='connect-github' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Connect the GitHub App
            </h2>
            <p>
              Open{' '}
              <Link href='/projects/new' className='text-white underline underline-offset-4'>
                /projects/new
              </Link>{' '}
              or go to <strong className='text-white font-medium'>Settings → Integrations</strong> and choose{' '}
              <strong className='text-white font-medium'>Install GitHub App</strong>.
            </p>
            <p>
              Select the account and exact repositories you want kr0n to read. GitHub redirects back to{' '}
              <code className='font-mono text-xs bg-kr0n-black px-1.5 py-0.5 rounded border border-kr0n-line text-white'>
                /github/callback
              </code>
              , where kr0n verifies the installation state token and binds the installation to your active organization.
            </p>
            <DocsCallout type='info' title='Repository scope'>
              Only repositories granted to the GitHub App installation appear in kr0n. Update repository permissions or disconnect an installation anytime under Settings → Integrations.
            </DocsCallout>
          </section>

          <section id='import-repository' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Import a repository
            </h2>
            <p>
              Pick a repository from the importer table and click{' '}
              <strong className='text-white font-medium'>Import</strong>. On the configuration screen:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-sm text-kr0n-text-secondary'>
              <li>
                Select the <strong className='text-white font-medium'>Production branch</strong> fetched live from GitHub.
              </li>
              <li>
                For monorepos, click <strong className='text-white font-medium'>Browse</strong> next to Root directory to explore subdirectories and detected stack presets.
              </li>
              <li>
                Review the live summary rail on the right and click <strong className='text-white font-medium'>Create project</strong>.
              </li>
            </ul>
          </section>

          <section id='build-settings' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Configure build overrides
            </h2>
            <p>
              Every project starts from an application preset and supports custom overrides for install, build, and output directory settings under{' '}
              <strong className='text-white font-medium'>Project → Settings</strong>:
            </p>
            <CodeBlock
              language='json'
              filename='PUT /api/v1/orgs/{org_id}/projects/{project_id}/build-settings'
              code={`{
  "expected_revision": 1,
  "build_settings": {
    "install_command_override": true,
    "install_command": "pnpm install --frozen-lockfile",
    "build_command_override": true,
    "build_command": "pnpm build",
    "output_directory_override": true,
    "output_directory": ".next"
  }
}`}
            />
            <p className='text-sm text-kr0n-muted'>
              Updates enforce optimistic concurrency via{' '}
              <code className='font-mono text-xs text-white'>expected_revision</code> so concurrent edits never silently overwrite a teammate&apos;s changes.
            </p>
          </section>

          <section id='team-access' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Team access and API tokens
            </h2>
            <p>
              Under{' '}
              <Link href='/settings' className='text-white underline underline-offset-4'>
                Settings
              </Link>
              , organization owners and admins can invite teammates with explicit roles, generate scoped bearer tokens with expiration windows, and inspect the paginated audit log.
            </p>
          </section>

          <section id='roadmap' className='scroll-mt-20 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight text-white'>
              Roadmap
            </h2>
            <p>
              Container build execution, live log streaming, encrypted environment variables, CLI tooling, and operational observability dashboards are marked as coming soon while the execution plane connects.
            </p>
          </section>
        </div>

        <DocsPagination prev={{ title: 'Documentation overview', slug: '/docs' }} />
      </article>
    </div>
  );
}
