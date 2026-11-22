import DocsSidebar from '@/components/docs/DocsSidebar';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export const metadata = {
  title: 'Templates & Starters — KR0N Documentation',
  description: 'One-click project templates for KR0N are coming soon.',
};

export default function TemplatesDocsPage() {
  return (
    <div className='flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full'>
      <DocsSidebar activeSectionId='templates' currentSubsections={[]} />
      <main className='flex-1 min-w-0 flex flex-col'>
        <ComingSoonPage
          section='Docs'
          title='Templates & Starters'
          description='One-click repository templates and starter kits are coming soon. In the meantime, import any existing GitHub repository with automatic Railpack preset detection.'
          backHref='/docs'
          backLabel='Back to Docs'
          secondaryHref='/projects/new'
          secondaryLabel='Import GitHub Repo'
        />
      </main>
    </div>
  );
}
