import AppShell from '@/components/navigation/AppShell';

export const metadata = {
  title: 'Dashboard — KR0N',
  description: 'Your KR0N workspace overview.',
};

export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
