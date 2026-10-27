'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Server,
  Activity,
  GitBranch,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function ProjectSettingsPage({ params }) {
  const { projectId } = use(params);
  const router = useRouter();
  const {
    projects,
    updateProject,
    deleteProject,
    createEnvironment,
  } = useKr0nStore();

  const project = projects.find((p) => p.id === projectId);

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [environments, setEnvironments] = useState(project?.environments || ['production', 'staging']);
  const [newEnvInput, setNewEnvInput] = useState('');
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  if (!project) {
    return <BrandedNotFound type='Project' id={projectId} backHref='/projects' backLabel='Back to Projects' />;
  }

  const handleSave = () => {
    updateProject(projectId, {
      name: name.trim() || project.name,
      description: description.trim() || project.description,
      environments,
    });
    setIsDirty(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleAddEnv = (e) => {
    e.preventDefault();
    if (!newEnvInput.trim()) return;
    const cleanEnv = newEnvInput.trim().toLowerCase();
    if (!environments.includes(cleanEnv)) {
      const updated = [...environments, cleanEnv];
      setEnvironments(updated);
      createEnvironment(projectId, cleanEnv);
    }
    setNewEnvInput('');
    setShowAddEnvModal(false);
    setIsDirty(true);
  };

  const handleDeleteProject = () => {
    if (confirmName === project.name) {
      deleteProject(projectId);
      setShowDeleteModal(false);
      router.push('/projects');
    }
  };

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      {/* ─── Breadcrumb Bar ─── */}
      <div className='h-12 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0'>
        <div className='flex items-center gap-2.5 text-xs font-mono'>
          <Link
            href={`/projects/${projectId}`}
            className='flex items-center gap-1 text-kr0n-text-secondary hover:text-white transition-colors uppercase tracking-wider font-medium'
          >
            <ArrowLeft size={12} />
            <span>{project.name}</span>
          </Link>
          <span className='text-kr0n-muted'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>Project Settings</span>
        </div>

        <Link
          href={`/projects/${projectId}`}
          className='text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors'
        >
          View Overview →
        </Link>
      </div>

      {/* Dirty notification */}
      {isDirty && (
        <div className='sticky top-0 z-30 bg-kr0n-surface border-b border-white/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono shadow-xl'>
          <span className='text-white font-bold flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-amber-400 animate-pulse' />
            Unsaved changes to project parameters
          </span>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => {
                setName(project.name);
                setDescription(project.description);
                setIsDirty(false);
              }}
              className='text-kr0n-text-secondary hover:text-white px-2 py-1'
            >
              Reset
            </button>
            <button
              type='button'
              onClick={handleSave}
              className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1 font-bold uppercase tracking-wider'
            >
              Save Project
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {savedFeedback && (
        <div className='sticky top-0 z-30 bg-emerald-500/10 border-b border-emerald-500/30 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs font-mono text-emerald-400'>
          <CheckCircle2 size={14} />
          <span>Project settings saved successfully.</span>
        </div>
      )}

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-10'>
        {/* Header */}
        <div>
          <h1 className='text-xl font-bold font-mono text-white tracking-wide uppercase'>
            Project Settings
          </h1>
          <p className='text-xs font-mono text-kr0n-text-secondary mt-1'>
            Configure project identity, environment isolation tiers, and workspace deletion rules.
          </p>
        </div>

        {/* ─── 1. General Project Details ─── */}
        <section className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              Project Details
            </h2>
          </div>

          <div className='space-y-4 text-xs font-mono'>
            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Project Name
              </label>
              <input
                type='text'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsDirty(true);
                }}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white resize-none'
              />
            </div>

            <div className='p-3 border border-kr0n-line-soft bg-kr0n-black flex items-center justify-between text-xs'>
              <div>
                <span className='text-kr0n-muted text-[10px] uppercase font-bold block'>Project Identifier</span>
                <span className='text-white font-mono font-bold select-all'>{project.id}</span>
              </div>
              <span className='text-kr0n-text-secondary text-[11px]'>{project.services.length} Microservices</span>
            </div>
          </div>
        </section>

        {/* ─── 2. Environment Management ─── */}
        <section className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
                Environments
              </h2>
              <p className='text-xs text-kr0n-text-secondary mt-0.5'>
                Logical isolation barriers for staging, production, and transient preview branches.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowAddEnvModal(true)}
              className='px-3 py-1.5 border border-kr0n-line bg-white/5 hover:border-white text-white text-xs font-mono font-bold'
            >
              + Create Environment
            </button>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft font-mono text-xs'>
            {environments.map((env) => (
              <div key={env} className='p-4 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span
                    className={`w-2 h-2 rounded-full ${env === 'production' ? 'bg-emerald-400' : 'bg-blue-400'}`}
                  />
                  <div>
                    <span className='text-white font-bold uppercase'>{env}</span>
                    <span className='text-kr0n-text-secondary text-[11px] ml-2'>
                      {env === 'production' ? 'Primary live routing' : 'Ephemeral isolated pipeline'}
                    </span>
                  </div>
                </div>
                <span className='px-2 py-0.5 border border-kr0n-line text-[10px] text-kr0n-text-secondary uppercase font-bold'>
                  Active
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 3. Global Settings Pointer ─── */}
        <section className='p-4 border border-kr0n-line-soft bg-kr0n-surface/40 flex items-center justify-between font-mono text-xs'>
          <div>
            <span className='text-white font-bold block'>Team Access & Organization Membership</span>
            <span className='text-kr0n-text-secondary text-[11px] mt-0.5 block'>
              User permissions and workspace role access controls are managed globally across all projects.
            </span>
          </div>
          <Link
            href='/settings'
            className='px-3 py-1.5 border border-kr0n-line hover:border-white text-white transition-colors shrink-0'
          >
            Global Settings →
          </Link>
        </section>

        {/* ─── 4. Danger Zone ─── */}
        <section className='border border-red-500/30 bg-red-500/[0.03] p-5 space-y-4 font-mono'>
          <div className='flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs'>
            <ShieldAlert size={16} />
            <span>Danger Zone</span>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2'>
            <div className='space-y-0.5'>
              <h3 className='text-sm font-bold text-white'>Delete This Project</h3>
              <p className='text-xs text-kr0n-text-secondary font-sans leading-relaxed'>
                Deleting <strong className='text-white'>{project.name}</strong> will remove all registered microservices
                and release routing domains. Independent persistent storage volumes will remain unlinked.
              </p>
            </div>

            <button
              type='button'
              onClick={() => setShowDeleteModal(true)}
              className='px-4 py-2 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors shrink-0'
            >
              Delete Project
            </button>
          </div>
        </section>

        {/* Save Footer */}
        <div className='pt-6 border-t border-kr0n-line flex items-center justify-end gap-3'>
          <button
            type='button'
            disabled={!isDirty}
            onClick={handleSave}
            className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-40'
          >
            <Save size={13} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* ─── Create Environment Modal ─── */}
      {showAddEnvModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Create Environment</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Isolate service configs, secret variables, and deployment promotion paths.
            </p>
            <form onSubmit={handleAddEnv} className='space-y-4'>
              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Environment Name</label>
                <input
                  type='text'
                  required
                  value={newEnvInput}
                  onChange={(e) => setNewEnvInput(e.target.value)}
                  placeholder='e.g. preview, dev, canary'
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowAddEnvModal(false)}
                  className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase'
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Project Modal ─── */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-red-500/40 bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <div className='flex items-center gap-2 text-red-400 font-bold uppercase'>
              <AlertTriangle size={16} />
              <span>Confirm Project Deletion</span>
            </div>
            <p className='text-kr0n-text-secondary font-sans leading-relaxed'>
              This will permanently delete project <strong className='text-white'>{project.name}</strong> ({project.id})
              and all of its associated microservices.
            </p>
            <div className='space-y-1.5'>
              <label className='block text-kr0n-text-secondary'>
                Type <strong className='text-white'>{project.name}</strong> to confirm:
              </label>
              <input
                type='text'
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={project.name}
                className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-red-400'
              />
            </div>
            <div className='flex items-center justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmName('');
                }}
                className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={confirmName !== project.name}
                onClick={handleDeleteProject}
                className='clipped-btn bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 font-bold uppercase disabled:opacity-40'
              >
                Permanently Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
