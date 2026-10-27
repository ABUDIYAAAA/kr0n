import AppShell from '@/components/navigation/AppShell';

export const metadata = {
  title: 'Incidents — KR0N',
  description: 'Incident diagnostics and event timeline on KR0N.',
};

export default function IncidentsLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
