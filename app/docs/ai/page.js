import DocsSidebar from '@/components/docs/DocsSidebar';
import ComingSoonPage from '@/components/common/ComingSoonPage';

export const metadata = {
  title: 'AI & Build Intelligence — KR0N Documentation',
  description: 'Build intelligence and automated optimization features for KR0N are coming soon.',
};

export default function AiDocsPage() {
  return (
    <div className='flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full'>
      <DocsSidebar activeSectionId='ai' currentSubsections={[]} />
      <main className='flex-1 min-w-0 flex flex-col'>
        <ComingSoonPage
          section='Docs'
          title='AI & Build Intelligence'
          description='Automated build diagnostics and optimization guidance are coming soon. Today, KR0N uses Railpack application presets and per-project build overrides.'
          backHref='/docs'
          backLabel='Back to Docs'
          secondaryHref='/projects/new'
          secondaryLabel='Import Repository'
        />
      </main>
    </div>
  );
}
