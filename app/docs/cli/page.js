import DocsSidebar from '@/components/docs/DocsSidebar';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export const metadata = {
  title: 'CLI Reference — KR0N Documentation',
  description: 'The KR0N Developer CLI is coming soon.',
};

export default function CliDocsPage() {
  return (
    <div className='flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full'>
      <DocsSidebar activeSectionId='cli' currentSubsections={[]} />
      <main className='flex-1 min-w-0 flex flex-col'>
        <ComingSoonPage
          section='Docs'
          title='KR0N Developer CLI'
          description='Command-line login, project linking, and terminal deployment commands are coming soon. You can manage organizations, API tokens, and GitHub projects through the web console today.'
          backHref='/docs'
          backLabel='Back to Docs'
          secondaryHref='/settings'
          secondaryLabel='Manage API Tokens'
        />
      </main>
    </div>
  );
}
