import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function ServiceSettingsPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Services'
      title='Service Runtime Configuration'
      description='Runtime environment variables, custom domains, scaling profiles, and persistent volumes are coming soon. You can configure repository branch, root directory, and Railpack build overrides in Project Settings.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
