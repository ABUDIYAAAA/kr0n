'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  Terminal,
  ShieldAlert,
  Copy,
  Server,
  GitBranch,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import ServiceHeaderTabs from '@/components/services/ServiceHeaderTabs';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function ServiceSettingsPage({ params }) {
  const { projectId, serviceId } = use(params);
  const router = useRouter();
  const {
    projects,
    updateServiceSettings,
    deleteService,
  } = useKr0nStore();

  const project = projects.find((p) => p.id === projectId);
  const service = project?.services?.find((s) => s.id === serviceId);

  // Form states initialized from service
  const [name, setName] = useState(service?.name || '');
  const [branch, setBranch] = useState(service?.branch || 'main');
  const [rootDir, setRootDir] = useState(service?.rootDir || '/');
  const [autoDeploy, setAutoDeploy] = useState(service?.autoDeploy ?? true);
  const [buildCommand, setBuildCommand] = useState(service?.buildCommand || 'npm run build');
  const [startCommand, setStartCommand] = useState(service?.startCommand || 'npm run start');
  const [port, setPort] = useState(String(service?.port || 8080));
  const [healthPath, setHealthPath] = useState(service?.healthCheck?.path || '/health');
  const [healthInterval, setHealthInterval] = useState(String(service?.healthCheck?.interval || 10));
  const [healthTimeout, setHealthTimeout] = useState(String(service?.healthCheck?.timeout || 5));
  const [minInstances, setMinInstances] = useState(String(service?.resources?.minInstances || 1));
  const [maxInstances, setMaxInstances] = useState(String(service?.resources?.maxInstances || 6));
  const [cpu, setCpu] = useState(service?.resources?.cpu || '0.5 vCPU');
  const [memory, setMemory] = useState(service?.resources?.memory || '1.8 GB');

  // Advanced toggles
  const [showAdvancedBuild, setShowAdvancedBuild] = useState(false);

  // Environment variables state
  const [envVars, setEnvVars] = useState(service?.envVars || [
    { key: 'NODE_ENV', value: 'production', isSecret: false },
    { key: 'DATABASE_URL', value: 'postgresql://kr0n_admin:••••••••@edge.db:5432/main', isSecret: true },
    { key: 'KR0N_SIGNING_SECRET', value: 'kr0n_sec_••••••••••••••••••••••••', isSecret: true },
  ]);
  const [showMasked, setShowMasked] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [newEnvSecret, setNewEnvSecret] = useState(false);

  // Domains & Volumes state
  const [customDomains, setCustomDomains] = useState(service?.customDomains || [
    { domain: 'api.coffee-orvea.com', status: 'verified', tls: 'active', renewal: 'Auto (64 days)' }
  ]);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');

  const [volumes, setVolumes] = useState(service?.volumes || []);
  const [showAddVolumeModal, setShowAddVolumeModal] = useState(false);
  const [volName, setVolName] = useState('');
  const [volSize, setVolSize] = useState('20 GB');
  const [volMount, setVolMount] = useState('/mnt/data');

  // UI status feedback
  const [isDirty, setIsDirty] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!project) {
    return <BrandedNotFound type='Project' id={projectId} backHref='/projects' backLabel='Back to Projects' />;
  }

  if (!service) {
    return (
      <BrandedNotFound
        type='Service'
        id={serviceId}
        backHref={`/projects/${projectId}`}
        backLabel={`Back to ${project.name}`}
      />
    );
  }

  const handleFieldChange = (setter, val) => {
    setter(val);
    setIsDirty(true);
  };

  const handleAddEnv = (e) => {
    e.preventDefault();
    if (!newEnvKey.trim()) return;
    setEnvVars((prev) => [...prev, { key: newEnvKey.trim(), value: newEnvVal.trim(), isSecret: newEnvSecret }]);
    setNewEnvKey('');
    setNewEnvVal('');
    setNewEnvSecret(false);
    setIsDirty(true);
  };

  const handleRemoveEnv = (idx) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    const cleanDomain = newDomainInput.trim().toLowerCase();
    setCustomDomains((prev) => [
      ...prev,
      { domain: cleanDomain, status: 'verified', tls: 'active', renewal: 'Auto (90 days)' }
    ]);
    setNewDomainInput('');
    setShowAddDomainModal(false);
    setIsDirty(true);
  };

  const handleRemoveDomain = (domainName) => {
    setCustomDomains((prev) => prev.filter((d) => d.domain !== domainName));
    setIsDirty(true);
  };

  const handleAddVolume = (e) => {
    e.preventDefault();
    if (!volName.trim()) return;
    const newVol = {
      id: `vol_${Date.now().toString(36)}`,
      name: volName.trim(),
      size: volSize,
      mountPath: volMount.trim(),
      status: 'attached',
      createdAt: 'Just now',
    };
    setVolumes((prev) => [...prev, newVol]);
    setVolName('');
    setShowAddVolumeModal(false);
    setIsDirty(true);
  };

  const handleDetachVolume = (volId) => {
    setVolumes((prev) => prev.filter((v) => v.id !== volId));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateServiceSettings(projectId, serviceId, {
      name: name.trim() || service.name,
      branch: branch.trim() || 'main',
      rootDir: rootDir.trim() || '/',
      autoDeploy,
      buildCommand,
      startCommand,
      port: port ? Number(port) : 8080,
      envVars,
      customDomains,
      volumes,
      healthCheck: {
        ...service.healthCheck,
        path: healthPath,
        interval: Number(healthInterval),
        timeout: Number(healthTimeout),
      },
      resources: {
        ...service.resources,
        cpu,
        memory,
        minInstances: Number(minInstances),
        maxInstances: Number(maxInstances),
      },
    });

    setIsDirty(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleDeleteServiceConfirm = () => {
    if (deleteConfirmText === service.name) {
      deleteService(projectId, serviceId);
      setShowDeleteModal(false);
      router.push(`/projects/${projectId}`);
    }
  };

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      <ServiceHeaderTabs project={project} service={service} />

      {/* Dirty state notification bar */}
      {isDirty && (
        <div className='sticky top-0 z-30 bg-kr0n-surface border-b border-white/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono shadow-xl'>
          <span className='text-white font-bold flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-amber-400 animate-pulse' />
            Unsaved changes to service configuration
          </span>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setIsDirty(false)}
              className='text-kr0n-text-secondary hover:text-white px-2 py-1'
            >
              Reset
            </button>
            <button
              type='button'
              onClick={handleSave}
              className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1 font-bold uppercase tracking-wider'
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Success feedback toast */}
      {savedFeedback && (
        <div className='sticky top-0 z-30 bg-emerald-500/10 border-b border-emerald-500/30 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs font-mono text-emerald-400'>
          <CheckCircle2 size={14} />
          <span>Service configuration updated successfully and recorded in desired state.</span>
        </div>
      )}

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-10'>
        {/* ─── 1. General Settings ─── */}
        <section id='general' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              General Service Identity
            </h2>
            <p className='text-xs text-kr0n-text-secondary mt-0.5'>
              Human-readable name, unique system identifier, and workload execution model.
            </p>
          </div>

          <div className='space-y-4 text-xs font-mono'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Service Name
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => handleFieldChange(setName, e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Workload Identifier
                </label>
                <input
                  type='text'
                  readOnly
                  value={service.id}
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-kr0n-muted outline-none cursor-not-allowed select-all'
                />
              </div>
            </div>

            <div className='p-3 border border-kr0n-line-soft bg-kr0n-surface/40 flex items-center justify-between text-xs'>
              <div>
                <span className='text-white font-bold block'>Runtime Type: {service.runtime || 'Long-running'}</span>
                <span className='text-kr0n-text-secondary text-[11px] mt-0.5 block'>
                  {service.runtimeLabel || 'KR0N V8 Edge Worker isolated in gVisor sandbox'}
                </span>
              </div>
              <span className='px-2 py-0.5 border border-kr0n-line text-[10px] text-kr0n-text-secondary uppercase font-bold'>
                Managed
              </span>
            </div>
          </div>
        </section>

        {/* ─── 2. Source & Git ─── */}
        <section id='source' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              Source Repository & Branches
            </h2>
            <p className='text-xs text-kr0n-text-secondary mt-0.5'>
              Source code provider connection and automated trigger rules.
            </p>
          </div>

          <div className='space-y-4 text-xs font-mono'>
            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Git Repository
              </label>
              <div className='flex items-center gap-2 p-2.5 border border-kr0n-line bg-kr0n-black text-white'>
                <GitBranch size={14} className='text-kr0n-muted' />
                <span>{service.repository || 'github.com/kr0n-org/template'}</span>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Production Branch
                </label>
                <input
                  type='text'
                  value={branch}
                  onChange={(e) => handleFieldChange(setBranch, e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Root Directory
                </label>
                <input
                  type='text'
                  value={rootDir}
                  onChange={(e) => handleFieldChange(setRootDir, e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>
            </div>

            <label className='flex items-start gap-3 p-3 border border-kr0n-line bg-kr0n-surface cursor-pointer'>
              <input
                type='checkbox'
                checked={autoDeploy}
                onChange={(e) => handleFieldChange(setAutoDeploy, e.target.checked)}
                className='accent-white mt-0.5'
              />
              <div>
                <span className='font-bold text-white block'>Automated Deployment on Git Push</span>
                <span className='text-kr0n-text-secondary text-[11px] block mt-0.5'>
                  When enabled, kr0n automatically synthesizes and rolls out changes pushed to branch <code className='text-white'>{branch}</code>.
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* ─── 3. Build & Deploy ─── */}
        <section id='build' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              Build & Start Commands
            </h2>
            <p className='text-xs text-kr0n-text-secondary mt-0.5'>
              BuildKit synthesis harness commands and internal container binding ports.
            </p>
          </div>

          <div className='space-y-4 text-xs font-mono'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Build Command
                </label>
                <input
                  type='text'
                  value={buildCommand}
                  onChange={(e) => handleFieldChange(setBuildCommand, e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                  Start Command
                </label>
                <input
                  type='text'
                  value={startCommand}
                  onChange={(e) => handleFieldChange(setStartCommand, e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Exposed Port
              </label>
              <input
                type='number'
                value={port}
                onChange={(e) => handleFieldChange(setPort, e.target.value)}
                className='w-full sm:w-48 bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
              <span className='text-[11px] text-kr0n-muted mt-1 block font-sans'>
                The TCP port your service listens on inside the sandbox container.
              </span>
            </div>

            {/* Collapsed Advanced Overrides */}
            <div className='pt-2'>
              <button
                type='button'
                onClick={() => setShowAdvancedBuild(!showAdvancedBuild)}
                className='flex items-center gap-2 text-xs font-mono text-kr0n-text-secondary hover:text-white'
              >
                <ChevronDown size={14} className={`transition-transform ${showAdvancedBuild ? 'rotate-180' : ''}`} />
                <span className='uppercase font-bold tracking-wider'>Advanced Build Overrides</span>
              </button>

              {showAdvancedBuild && (
                <div className='mt-3 p-4 border border-kr0n-line bg-kr0n-surface space-y-3 text-xs'>
                  <div>
                    <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>Custom Dockerfile Path</label>
                    <input
                      type='text'
                      placeholder='Dockerfile (optional)'
                      className='w-full bg-kr0n-black border border-kr0n-line px-3 py-1.5 text-white outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-kr0n-text-secondary uppercase font-bold mb-1'>Build Target Stage</label>
                    <input
                      type='text'
                      placeholder='runner (optional)'
                      className='w-full bg-kr0n-black border border-kr0n-line px-3 py-1.5 text-white outline-none'
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── 4. Environment Variables ─── */}
        <section id='env' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
                Environment Variables & Secrets
              </h2>
              <p className='text-xs text-kr0n-text-secondary mt-0.5'>
                Encrypted environment variables passed into runtime execution. Secrets are never logged.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowMasked(!showMasked)}
              className='text-xs font-mono text-kr0n-text-secondary hover:text-white flex items-center gap-1.5'
            >
              {showMasked ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showMasked ? 'Mask Secrets' : 'Show Secrets'}</span>
            </button>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft font-mono text-xs'>
            {envVars.map((env, idx) => (
              <div key={idx} className='p-3 sm:p-4 flex items-center justify-between gap-3'>
                <div className='min-w-0 flex items-center gap-3'>
                  <span className='font-bold text-white'>{env.key}</span>
                  <span className='text-kr0n-muted font-bold'>=</span>
                  <span className='text-kr0n-text-secondary truncate'>
                    {env.isSecret && !showMasked ? '••••••••••••••••' : env.value}
                  </span>
                  {env.isSecret && (
                    <span className='px-1.5 py-0.2 bg-white/5 border border-kr0n-line text-[9px] text-kr0n-muted uppercase font-bold'>
                      Secret
                    </span>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => handleRemoveEnv(idx)}
                  className='text-kr0n-muted hover:text-red-400 p-1 shrink-0 transition-colors'
                  title='Remove variable'
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add variable form */}
          <form onSubmit={handleAddEnv} className='p-4 border border-kr0n-line bg-kr0n-surface/60 space-y-3 font-mono text-xs'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <input
                type='text'
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder='VARIABLE_NAME'
                className='bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
              <input
                type='text'
                value={newEnvVal}
                onChange={(e) => setNewEnvVal(e.target.value)}
                placeholder='value'
                className='bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>
            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 text-kr0n-text-secondary cursor-pointer'>
                <input
                  type='checkbox'
                  checked={newEnvSecret}
                  onChange={(e) => setNewEnvSecret(e.target.checked)}
                  className='accent-white'
                />
                <span>Encrypt as secret</span>
              </label>
              <button
                type='submit'
                className='px-4 py-1.5 border border-kr0n-line bg-white/5 hover:border-white text-white font-bold transition-colors'
              >
                + Add Variable
              </button>
            </div>
          </form>
        </section>

        {/* ─── 5. Networking & Domains ─── */}
        <section id='networking' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
                Networking & Custom Domains
              </h2>
              <p className='text-xs text-kr0n-text-secondary mt-0.5'>
                Platform subdomains, DNS records, and automated Let&apos;s Encrypt TLS certificates.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowAddDomainModal(true)}
              className='px-3 py-1.5 border border-kr0n-line bg-white/5 hover:border-white text-white text-xs font-mono font-bold'
            >
              + Add Domain
            </button>
          </div>

          <div className='space-y-3 font-mono text-xs'>
            {/* Platform Subdomain */}
            <div className='p-4 border border-kr0n-line bg-kr0n-surface flex items-center justify-between'>
              <div>
                <span className='text-[10px] text-kr0n-muted uppercase font-bold block'>Platform Subdomain</span>
                <span className='text-white font-bold mt-0.5 block'>{service.url || 'subdomain.kr0n.dev'}</span>
              </div>
              <span className='px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                ROUTED
              </span>
            </div>

            {/* Custom Domains */}
            {customDomains.map((cd) => (
              <div key={cd.domain} className='p-4 border border-kr0n-line bg-kr0n-surface flex items-center justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-white font-bold'>{cd.domain}</span>
                    <span className='px-1.5 py-0.2 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase'>
                      {cd.tls} TLS
                    </span>
                  </div>
                  <div className='text-[11px] text-kr0n-text-secondary mt-1'>
                    DNS: <span className='text-emerald-400 font-bold'>Verified</span> · Renewal: {cd.renewal}
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => handleRemoveDomain(cd.domain)}
                  className='text-kr0n-muted hover:text-red-400 p-1.5 transition-colors'
                  title='Detach domain'
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. Resources & Quota Feedback ─── */}
        <section id='resources' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              Resource Allocation & Scale Limits
            </h2>
            <p className='text-xs text-kr0n-text-secondary mt-0.5'>
              CPU, memory constraints, and instance autoscaling parameters.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono'>
            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                CPU Allocation
              </label>
              <select
                value={cpu}
                onChange={(e) => handleFieldChange(setCpu, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              >
                <option value='0.25 vCPU'>0.25 vCPU (Shared)</option>
                <option value='0.5 vCPU'>0.5 vCPU (Standard)</option>
                <option value='1.0 vCPU'>1.0 vCPU (Dedicated)</option>
                <option value='2.0 vCPU'>2.0 vCPU (High Performance)</option>
              </select>
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Memory Allocation
              </label>
              <select
                value={memory}
                onChange={(e) => handleFieldChange(setMemory, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              >
                <option value='0.5 GB'>0.5 GB</option>
                <option value='0.9 GB'>0.9 GB</option>
                <option value='1.8 GB'>1.8 GB</option>
                <option value='3.4 GB'>3.4 GB</option>
              </select>
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Minimum Instances
              </label>
              <input
                type='number'
                min='1'
                max='10'
                value={minInstances}
                onChange={(e) => handleFieldChange(setMinInstances, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Maximum Instances
              </label>
              <input
                type='number'
                min='1'
                max='20'
                value={maxInstances}
                onChange={(e) => handleFieldChange(setMaxInstances, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>
          </div>

          <div className='p-3 border border-kr0n-line-soft bg-kr0n-black text-xs font-mono text-kr0n-text-secondary flex items-center justify-between'>
            <span>Project Memory Quota Remaining:</span>
            <span className='text-emerald-400 font-bold'>38 GB Available / 80 GB Total</span>
          </div>
        </section>

        {/* ─── 7. Health Checks ─── */}
        <section id='health' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2'>
            <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
              Health Check Probes
            </h2>
            <p className='text-xs text-kr0n-text-secondary mt-0.5'>
              Automated HTTP probe configuration for zero-downtime rolling promotions.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono'>
            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                HTTP Probe Path
              </label>
              <input
                type='text'
                value={healthPath}
                onChange={(e) => handleFieldChange(setHealthPath, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Interval (Seconds)
              </label>
              <input
                type='number'
                value={healthInterval}
                onChange={(e) => handleFieldChange(setHealthInterval, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>

            <div>
              <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1.5'>
                Timeout (Seconds)
              </label>
              <input
                type='number'
                value={healthTimeout}
                onChange={(e) => handleFieldChange(setHealthTimeout, e.target.value)}
                className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />
            </div>
          </div>
        </section>

        {/* ─── 8. Storage & Persistent Volumes ─── */}
        <section id='storage' className='space-y-4'>
          <div className='border-b border-kr0n-line-soft pb-2 flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
                Persistent Storage & Volumes
              </h2>
              <p className='text-xs text-kr0n-text-secondary mt-0.5'>
                Volumes possess an independent lifecycle. Deleting a service preserves persistent data.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowAddVolumeModal(true)}
              className='px-3 py-1.5 border border-kr0n-line bg-white/5 hover:border-white text-white text-xs font-mono font-bold'
            >
              + Create Volume
            </button>
          </div>

          <div className='space-y-3 font-mono text-xs'>
            {volumes.length > 0 ? (
              volumes.map((vol) => (
                <div key={vol.id} className='p-4 border border-kr0n-line bg-kr0n-surface flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-white font-bold'>{vol.name}</div>
                    <div className='text-[11px] text-kr0n-text-secondary mt-0.5'>
                      Mount Path: <span className='text-white font-bold'>{vol.mountPath}</span> · Size: {vol.size}
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleDetachVolume(vol.id)}
                    className='px-2.5 py-1 border border-kr0n-line text-[11px] text-kr0n-text-secondary hover:text-white'
                  >
                    Detach
                  </button>
                </div>
              ))
            ) : (
              <div className='p-6 border border-dashed border-kr0n-line text-center text-kr0n-text-secondary'>
                No persistent volumes attached. Workload disk is ephemeral.
              </div>
            )}
          </div>
        </section>

        {/* ─── 9. Danger Zone ─── */}
        <section className='border border-red-500/30 bg-red-500/[0.03] p-5 space-y-4 font-mono'>
          <div className='flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs'>
            <ShieldAlert size={16} />
            <span>Danger Zone</span>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2'>
            <div className='space-y-0.5'>
              <h3 className='text-sm font-bold text-white'>Delete This Service</h3>
              <p className='text-xs text-kr0n-text-secondary font-sans leading-relaxed'>
                Deleting this service will release all allocated compute instances and routing rules.
                <strong> Persistent volumes will NOT be deleted</strong> and can be attached to another workload.
              </p>
            </div>

            <button
              type='button'
              onClick={() => setShowDeleteModal(true)}
              className='px-4 py-2 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors shrink-0'
            >
              Delete Service
            </button>
          </div>
        </section>

        {/* Save button footer */}
        <div className='pt-6 border-t border-kr0n-line flex items-center justify-end gap-3'>
          <button
            type='button'
            disabled={!isDirty}
            onClick={handleSave}
            className='clipped-btn inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-40'
          >
            <Save size={13} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* ─── Add Domain Modal ─── */}
      {showAddDomainModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Attach Custom Domain</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Enter your fully-qualified domain name. Automated TLS certificates will be provisioned.
            </p>
            <form onSubmit={handleAddDomain} className='space-y-4'>
              <input
                type='text'
                required
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder='e.g. api.yourdomain.com'
                className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
              />

              <div className='p-3 bg-kr0n-black border border-kr0n-line text-[11px] text-kr0n-text-secondary space-y-1'>
                <span className='text-white font-bold block text-[10px] uppercase'>Required DNS Record:</span>
                <div>Type: <strong className='text-white'>CNAME</strong></div>
                <div>Host: <strong className='text-white'>@</strong> (or subdomain)</div>
                <div>Value: <strong className='text-white'>edge.kr0n.dev</strong></div>
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowAddDomainModal(false)}
                  className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase'
                >
                  Verify & Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Volume Modal ─── */}
      {showAddVolumeModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Create Persistent Volume</h3>
            <p className='text-kr0n-text-secondary font-sans'>
              Provision isolated block storage with independent retention and backup snapshots.
            </p>
            <form onSubmit={handleAddVolume} className='space-y-4'>
              <div>
                <label className='block text-kr0n-text-secondary mb-1'>Volume Name</label>
                <input
                  type='text'
                  required
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  placeholder='e.g. redis-data-vol'
                  className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-kr0n-text-secondary mb-1'>Size</label>
                  <select
                    value={volSize}
                    onChange={(e) => setVolSize(e.target.value)}
                    className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none'
                  >
                    <option value='10 GB'>10 GB</option>
                    <option value='20 GB'>20 GB</option>
                    <option value='50 GB'>50 GB</option>
                    <option value='100 GB'>100 GB</option>
                  </select>
                </div>
                <div>
                  <label className='block text-kr0n-text-secondary mb-1'>Mount Path</label>
                  <input
                    type='text'
                    value={volMount}
                    onChange={(e) => setVolMount(e.target.value)}
                    className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none'
                  />
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowAddVolumeModal(false)}
                  className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 font-bold uppercase'
                >
                  Provision Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Service Confirmation Modal ─── */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-red-500/40 bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <div className='flex items-center gap-2 text-red-400 font-bold uppercase'>
              <AlertTriangle size={16} />
              <span>Confirm Service Deletion</span>
            </div>
            <p className='text-kr0n-text-secondary font-sans leading-relaxed'>
              This will remove workload <strong className='text-white'>{service.name}</strong> from project{' '}
              <strong className='text-white'>{project.name}</strong>. Attached persistent volumes will be retained.
            </p>
            <div className='space-y-1.5'>
              <label className='block text-kr0n-text-secondary'>
                Type <strong className='text-white'>{service.name}</strong> to confirm:
              </label>
              <input
                type='text'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={service.name}
                className='w-full bg-kr0n-black border border-kr0n-line px-3 py-2 text-white outline-none focus:border-red-400'
              />
            </div>
            <div className='flex items-center justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
              >
                Cancel
              </button>
              <button
                type='button'
                disabled={deleteConfirmText !== service.name}
                onClick={handleDeleteServiceConfirm}
                className='clipped-btn bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 font-bold uppercase disabled:opacity-40'
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
