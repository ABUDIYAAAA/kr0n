import { Suspense } from 'react';
import GitHubProjectPicker from '@/components/projects/GitHubProjectPicker';

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kr0n-canvas p-10 text-white font-mono text-sm">Loading repository importer…</div>}>
      <GitHubProjectPicker />
    </Suspense>
  );
}
