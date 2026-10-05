import AppShell from '@/components/navigation/AppShell';

export const metadata = {
  title: 'Projects — KR0N',
  description: 'Manage and deploy your application projects on KR0N.',
};

export default function ProjectsLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
