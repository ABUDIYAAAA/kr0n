import { Suspense } from 'react';
import GitHubProjectPicker from '@/components/projects/GitHubProjectPicker';

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-kr0n-canvas p-10 text-kr0n-muted text-sm flex items-center justify-center'>
          Loading repository importer...
        </div>
      }
    >
      <GitHubProjectPicker />
    </Suspense>
  );
}
