import AppShell from '@/components/navigation/AppShell';

export const metadata = {
  title: 'Status — KR0N',
  description: 'KR0N platform health and system status.',
};

export default function StatusLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
