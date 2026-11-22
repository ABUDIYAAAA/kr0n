import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function DeploymentDetailPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Deployments'
      title='Deployment Details & Build Attestations'
      description='Stage-by-stage build pipeline progress, container image verification, and build logs are coming soon.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
