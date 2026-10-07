import AppShell from '@/components/navigation/AppShell';

export const metadata = {
  title: 'Capacity — KR0N',
  description: 'Your available deployment and resource headroom on KR0N.',
};

export default function CapacityLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
