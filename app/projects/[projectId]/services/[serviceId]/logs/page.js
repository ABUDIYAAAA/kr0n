import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function ServiceLogsPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Observability'
      title='Runtime & Build Logs'
      description='Live container log streaming and historical log search are coming soon.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
