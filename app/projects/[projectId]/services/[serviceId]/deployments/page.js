import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function ServiceDeploymentsPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Deployments'
      title='Deployment History'
      description='Automated builds, release history, and instant rollbacks will appear here once the deployment execution plane is live.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
