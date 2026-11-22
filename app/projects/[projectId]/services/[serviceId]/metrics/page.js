import ComingSoonPage from '@/components/common/ComingSoonPage';

export default async function ServiceMetricsPage({ params }) {
  const { projectId } = await params;
  return (
    <ComingSoonPage
      section='Observability'
      title='Service Metrics & Traces'
      description='Request latency percentiles, resource utilization charts, and distributed traces are coming soon.'
      backHref={`/projects/${projectId}`}
      backLabel='Back to Project'
      secondaryHref={`/projects/${projectId}/settings`}
      secondaryLabel='Project Settings'
    />
  );
}
