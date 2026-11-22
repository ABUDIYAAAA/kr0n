import ComingSoonPage from '@/components/common/ComingSoonPage';

export default function IncidentDetailPage() {
  return (
    <ComingSoonPage
      section='Observability'
      title='Incident Management'
      description='Incident timelines, deployment correlation, and post-mortem notes are coming soon.'
      backHref='/dashboard'
      backLabel='Return to Dashboard'
    />
  );
}
