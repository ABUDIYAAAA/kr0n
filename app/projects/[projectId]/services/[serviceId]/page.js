import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function ServiceOverviewPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Services'
      title='Service Runtime Overview'
      description='Service instances, health check probes, autoscaling, and runtime status are coming soon. Manage your project repository and Railpack build configuration in Project Settings.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
