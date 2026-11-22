export const DOCS_SECTIONS = [
  {
    id: 'quick-start',
    title: 'Quick start',
    slug: '/docs/quick-start',
    shortDesc:
      'Create an organization, install the GitHub App, import a repository, and tune Railpack build settings.',
    status: 'OPERATIONAL',
    subsections: [
      { id: 'overview', title: 'Overview' },
      { id: 'prerequisites', title: 'Prerequisites' },
      { id: 'connect-github', title: '1. Connect GitHub App' },
      { id: 'import-repository', title: '2. Import a repository' },
      { id: 'build-settings', title: '3. Configure Railpack builds' },
      { id: 'team-access', title: '4. Team access and API tokens' },
      { id: 'roadmap', title: 'Roadmap' },
    ],
  },
  {
    id: 'ai',
    title: 'AI diagnostics',
    slug: '/docs/ai',
    shortDesc:
      'Automated build diagnostics and optimization recommendations are coming soon.',
    status: 'COMING_SOON',
    subsections: [],
  },
  {
    id: 'cli',
    title: 'CLI tooling',
    slug: '/docs/cli',
    shortDesc:
      'Terminal authentication, project linking, and log streaming commands are coming soon.',
    status: 'COMING_SOON',
    subsections: [],
  },
  {
    id: 'templates',
    title: 'Templates',
    slug: '/docs/templates',
    shortDesc:
      'Starter repository blueprints are coming soon. Import any existing GitHub repository today.',
    status: 'COMING_SOON',
    subsections: [],
  },
];

export const SEARCH_INDEX = [
  {
    title: 'Quick start: Overview',
    section: 'Quick start',
    slug: '/docs/quick-start#overview',
    snippet:
      'How organizations, GitHub App installations, and Railpack build settings work together in kr0n.',
    keywords: ['quick start', 'getting started', 'setup', 'workflow', 'overview'],
  },
  {
    title: 'Quick start: Connect GitHub App',
    section: 'Quick start',
    slug: '/docs/quick-start#connect-github',
    snippet:
      'Install the KR0N GitHub App on a personal account or GitHub organization.',
    keywords: ['git', 'github', 'app', 'installation', 'oauth'],
  },
  {
    title: 'Quick start: Import a repository',
    section: 'Quick start',
    slug: '/docs/quick-start#import-repository',
    snippet:
      'Select a repository, choose a production branch, and browse monorepo root directories.',
    keywords: ['repository', 'import', 'branch', 'monorepo', 'root directory'],
  },
  {
    title: 'Quick start: Configure Railpack builds',
    section: 'Quick start',
    slug: '/docs/quick-start#build-settings',
    snippet:
      'Pick an application preset and override install, build, or output directory settings with revision tracking.',
    keywords: ['build', 'railpack', 'preset', 'override', 'settings', 'revision'],
  },
  {
    title: 'Quick start: Team access and API tokens',
    section: 'Quick start',
    slug: '/docs/quick-start#team-access',
    snippet:
      'Invite organization members with RBAC roles, issue scoped API tokens, and review the audit log.',
    keywords: ['rbac', 'organization', 'members', 'invite', 'token', 'audit'],
  },
  {
    title: 'AI diagnostics (Coming soon)',
    section: 'Roadmap',
    slug: '/docs/ai',
    snippet: 'Automated build diagnostics and optimization recommendations are coming soon.',
    keywords: ['ai', 'diagnostics', 'coming soon'],
  },
  {
    title: 'CLI tooling (Coming soon)',
    section: 'Roadmap',
    slug: '/docs/cli',
    snippet: 'The kr0n CLI is coming soon.',
    keywords: ['cli', 'terminal', 'coming soon'],
  },
  {
    title: 'Templates (Coming soon)',
    section: 'Roadmap',
    slug: '/docs/templates',
    snippet: 'Starter blueprints are coming soon.',
    keywords: ['templates', 'starters', 'coming soon'],
  },
];
