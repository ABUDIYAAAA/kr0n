'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GitBranch,
  Layers,
  Database,
  Server,
  Terminal,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const APPROVED_TEMPLATES = [
  {
    id: 'postgres',
    name: 'PostgreSQL Database',
    category: 'Relational Database',
    desc: 'High-availability PostgreSQL 16 with automated replication and persistent volume attachment.',
    defaultPort: 5432,
    defaultImage: 'postgres:16-alpine',
    defaultEnv: [
      { key: 'POSTGRES_DB', value: 'production', isSecret: false },
      { key: 'POSTGRES_USER', value: 'kr0n_admin', isSecret: false },
      { key: 'POSTGRES_PASSWORD', value: 'kr0n_db_••••••••', isSecret: true },
    ],
  },
  {
    id: 'redis',
    name: 'Redis In-Memory Cache',
    category: 'Cache & Queue',
    desc: 'Redis 7.2 standalone or clustered instance with optional append-only file persistence.',
    defaultPort: 6379,
    defaultImage: 'redis:7.2-alpine',
    defaultEnv: [
      { key: 'REDIS_PASSWORD', value: 'kr0n_redis_••••••••', isSecret: true },
      { key: 'MAXMEMORY', value: '512mb', isSecret: false },
    ],
  },
  {
    id: 'kafka',
    name: 'Apache Kafka Event Bus',
    category: 'Message Broker',
    desc: 'Distributed streaming platform with KRaft mode consensus; zero ZooKeeper dependencies.',
    defaultPort: 9092,
    defaultImage: 'confluentinc/cp-kafka:7.5.0',
    defaultEnv: [
      { key: 'KAFKA_BROKER_ID', value: '1', isSecret: false },
      { key: 'KAFKA_AUTO_CREATE_TOPICS_ENABLE', value: 'true', isSecret: false },
    ],
  },
  {
    id: 'mysql',
    name: 'MySQL Server',
    category: 'Relational Database',
    desc: 'MySQL 8.0 enterprise-compatible database server with InnoDB engine and utf8mb4 collation.',
    defaultPort: 3306,
    defaultImage: 'mysql:8.0',
    defaultEnv: [
      { key: 'MYSQL_DATABASE', value: 'main', isSecret: false },
      { key: 'MYSQL_ROOT_PASSWORD', value: 'kr0n_mysql_••••••••', isSecret: true },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB Document Store',
    category: 'Document Database',
    desc: 'MongoDB 7.0 Community Edition wired Tiger engine with replica set initialization.',
    defaultPort: 27017,
    defaultImage: 'mongo:7.0',
    defaultEnv: [
      { key: 'MONGO_INITDB_DATABASE', value: 'app_db', isSecret: false },
      { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'kr0n_mongo_••••••••', isSecret: true },
    ],
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse Analytics Engine',
    category: 'OLAP Columnar',
    desc: 'Ultra-fast column-oriented DBMS for real-time analytical telemetry and event log aggregation.',
    defaultPort: 8123,
    defaultImage: 'clickhouse/clickhouse-server:24.1',
    defaultEnv: [
      { key: 'CLICKHOUSE_DB', value: 'telemetry', isSecret: false },
      { key: 'CLICKHOUSE_PASSWORD', value: 'kr0n_ch_••••••••', isSecret: true },
    ],
  },
];

const FIXTURE_REPOS = [
  { name: 'github.com/kr0n-org/orvea-core', defaultBranch: 'main', detected: 'Go FastHTTP API (gVisor ready)' },
  { name: 'github.com/kr0n-org/orvea-web', defaultBranch: 'main', detected: 'Next.js 15 App Router (Serverless)' },
  { name: 'github.com/kr0n-org/cart-service', defaultBranch: 'main', detected: 'Node.js 22 Express / Fastify' },
  { name: 'github.com/kr0n-org/auth-token-engine', defaultBranch: 'main', detected: 'Rust Axum Microservice' },
];

export default function AddServiceWizardModal({
  isOpen,
  onClose,
  projectId,
  onServiceCreated,
}) {
  const router = useRouter();

  // Wizard state: 1: Type, 2: Source/Template, 3: Detection, 4: Configure, 5: Env, 6: Review, 7: Deploy
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('app'); // 'app' | 'template'
  const [selectedTemplate, setSelectedTemplate] = useState(APPROVED_TEMPLATES[0]);
  const [selectedRepo, setSelectedRepo] = useState(FIXTURE_REPOS[0]);
  const [branch, setBranch] = useState('main');
  const [serviceName, setServiceName] = useState('');
  const [runtime, setRuntime] = useState('Long-running');
  const [port, setPort] = useState('8080');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [startCommand, setStartCommand] = useState('npm run start');
  const [envVars, setEnvVars] = useState([
    { key: 'NODE_ENV', value: 'production', isSecret: false },
    { key: 'DATABASE_URL', value: 'postgresql://kr0n_admin:••••••••@edge.db:5432/main', isSecret: true },
  ]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newSecret, setNewSecret] = useState(false);
  const [showMasked, setShowMasked] = useState(false);

  // Deployment progress simulation
  const [deployStep, setDeployStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setServiceName(tmpl.id);
    setPort(String(tmpl.defaultPort));
    setRuntime('Long-running');
    setBuildCommand('docker pull ' + tmpl.defaultImage);
    setStartCommand('docker run ' + tmpl.defaultImage);
    setEnvVars(tmpl.defaultEnv);
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    const inferred = repo.name.split('/').pop().replace(/[^a-z0-9]/gi, '-');
    setServiceName(inferred);
    setBranch(repo.defaultBranch);
  };

  const handleAddEnvVar = () => {
    if (!newKey.trim()) return;
    setEnvVars((prev) => [...prev, { key: newKey.trim(), value: newVal.trim(), isSecret: newSecret }]);
    setNewKey('');
    setNewVal('');
    setNewSecret(false);
  };

  const handleRemoveEnvVar = (idx) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartDeploy = () => {
    setStep(7);
    setIsDeploying(true);

    const steps = ['Queued for synthesis', 'Analyzing container build manifest', 'Running security admission checks', 'Allocating edge instances', 'Healthcheck probe 200 OK', 'Service Active'];

    let curr = 0;
    const interval = setInterval(() => {
      curr += 1;
      setDeployStep(curr);
      if (curr >= steps.length) {
        clearInterval(interval);
        setIsDeploying(false);

        const createdId = onServiceCreated({
          name: serviceName || (serviceType === 'template' ? selectedTemplate.id : 'my-service'),
          type: serviceType === 'template' ? 'worker' : 'web',
          runtime,
          runtimeLabel: serviceType === 'template' ? selectedTemplate.name : `${runtime} Workload`,
          repository: serviceType === 'template' ? `template/${selectedTemplate.id}` : selectedRepo.name,
          branch,
          port: port ? Number(port) : 8080,
          buildCommand,
          startCommand,
          envVars,
        });

        setTimeout(() => {
          onClose();
          router.push(`/projects/${projectId}/services/${createdId}`);
        }, 600);
      }
    }, 700);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
      <div className='max-w-2xl w-full border border-kr0n-line bg-kr0n-canvas-raised flex flex-col max-h-[90vh] shadow-2xl'>
        {/* Header */}
        <div className='h-14 border-b border-kr0n-line bg-kr0n-surface px-6 flex items-center justify-between shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-6 h-6 border border-kr0n-line bg-kr0n-black flex items-center justify-center text-xs font-mono font-bold text-white'>
              {step < 7 ? `0${step}` : '✓'}
            </div>
            <div>
              <h2 className='text-sm font-mono font-bold text-white uppercase tracking-wider'>
                Add Service Wizard
              </h2>
              <p className='text-[10px] font-mono text-kr0n-text-secondary'>
                Step {step} of 6 · {step === 1 ? 'Workload Type' : step === 2 ? 'Source Selection' : step === 3 ? 'Detection' : step === 4 ? 'Configuration' : step === 5 ? 'Environment' : step === 6 ? 'Review' : 'Deploying'}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 text-kr0n-muted hover:text-white transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Wizard Step Content */}
        <div className='p-6 overflow-y-auto flex-1 space-y-6'>
          {/* STEP 1: TYPE */}
          {step === 1 && (
            <div className='space-y-4'>
              <div className='space-y-1'>
                <h3 className='text-sm font-bold text-white font-mono uppercase'>Select Service Architecture</h3>
                <p className='text-xs text-kr0n-text-secondary'>
                  Deploy custom software directly from git repositories or provision platform-managed infrastructure templates.
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'>
                <div
                  onClick={() => setServiceType('app')}
                  className={`p-5 border cursor-pointer transition-all space-y-3 ${
                    serviceType === 'app'
                      ? 'border-white bg-kr0n-surface'
                      : 'border-kr0n-line bg-kr0n-surface/50 hover:border-kr0n-line-strong'
                  }`}
                >
                  <div className='w-8 h-8 border border-kr0n-line bg-kr0n-black flex items-center justify-center text-white'>
                    <Server size={16} />
                  </div>
                  <div>
                    <div className='text-sm font-bold text-white font-mono uppercase'>Application Service</div>
                    <p className='text-xs text-kr0n-text-secondary mt-1'>
                      Web API, fullstack frontend, or worker consumer cloned from GitHub or private Git.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setServiceType('template')}
                  className={`p-5 border cursor-pointer transition-all space-y-3 ${
                    serviceType === 'template'
                      ? 'border-white bg-kr0n-surface'
                      : 'border-kr0n-line bg-kr0n-surface/50 hover:border-kr0n-line-strong'
                  }`}
                >
                  <div className='w-8 h-8 border border-kr0n-line bg-kr0n-black flex items-center justify-center text-emerald-400'>
                    <Database size={16} />
                  </div>
                  <div>
                    <div className='text-sm font-bold text-white font-mono uppercase'>Infrastructure Template</div>
                    <p className='text-xs text-kr0n-text-secondary mt-1'>
                      Platform-authored components: Postgres, Redis, Kafka, MySQL, Mongo, ClickHouse.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SOURCE / TEMPLATE */}
          {step === 2 && (
            <div className='space-y-4'>
              {serviceType === 'app' ? (
                <>
                  <div className='space-y-1'>
                    <h3 className='text-sm font-bold text-white font-mono uppercase'>Select Git Repository</h3>
                    <p className='text-xs text-kr0n-text-secondary'>
                      Connected through verified GitHub integration (@kr0n-org).
                    </p>
                  </div>
                  <div className='space-y-2 border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
                    {FIXTURE_REPOS.map((repo) => (
                      <div
                        key={repo.name}
                        onClick={() => handleSelectRepo(repo)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                          selectedRepo.name === repo.name ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <GitBranch size={15} className='text-kr0n-muted' />
                          <div>
                            <div className='text-xs font-mono font-bold text-white'>{repo.name}</div>
                            <div className='text-[10px] font-mono text-kr0n-text-secondary mt-0.5'>{repo.detected}</div>
                          </div>
                        </div>
                        <span className='px-2 py-0.5 border border-kr0n-line text-[10px] font-mono text-kr0n-text-secondary'>
                          {repo.defaultBranch}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className='space-y-1'>
                    <h3 className='text-sm font-bold text-white font-mono uppercase'>Select Platform Template</h3>
                    <p className='text-xs text-kr0n-text-secondary'>
                      Pre-configured with zero-cold-start synthesis and automated persistent volumes.
                    </p>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto'>
                    {APPROVED_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`p-3.5 border cursor-pointer transition-all space-y-1.5 ${
                          selectedTemplate.id === tmpl.id
                            ? 'border-white bg-kr0n-surface'
                            : 'border-kr0n-line bg-kr0n-surface/50 hover:border-kr0n-line-strong'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-mono font-bold text-white'>{tmpl.name}</span>
                          <span className='text-[9px] font-mono px-1.5 py-0.5 border border-kr0n-line text-emerald-400'>
                            :{tmpl.defaultPort}
                          </span>
                        </div>
                        <p className='text-[11px] text-kr0n-text-secondary leading-snug'>{tmpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: DETECTION */}
          {step === 3 && (
            <div className='space-y-4 font-mono'>
              <div className='space-y-1 font-sans'>
                <h3 className='text-sm font-bold text-white font-mono uppercase'>Automated Framework Detection</h3>
                <p className='text-xs text-kr0n-text-secondary'>
                  kr0n BuildKit analyzed project manifests and declared architecture.
                </p>
              </div>

              <div className='p-4 border border-kr0n-line bg-kr0n-surface space-y-3 text-xs'>
                <div className='flex items-center justify-between pb-3 border-b border-kr0n-line-soft'>
                  <span className='text-kr0n-text-secondary'>Source:</span>
                  <span className='text-white font-bold'>{serviceType === 'template' ? selectedTemplate.name : selectedRepo.name}</span>
                </div>
                <div className='flex items-center justify-between pb-3 border-b border-kr0n-line-soft'>
                  <span className='text-kr0n-text-secondary'>Detected Stack:</span>
                  <span className='text-emerald-400 font-bold'>
                    {serviceType === 'template' ? selectedTemplate.category : selectedRepo.detected}
                  </span>
                </div>
                <div className='flex items-center justify-between pb-3 border-b border-kr0n-line-soft'>
                  <span className='text-kr0n-text-secondary'>Runtime Target:</span>
                  <span className='text-white font-bold'>{runtime} Workload</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-kr0n-text-secondary'>Isolation Sandbox:</span>
                  <span className='text-white font-bold'>gVisor Virtualized Kernel Sandbox</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIGURE */}
          {step === 4 && (
            <div className='space-y-4 text-xs font-mono'>
              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1'>Service Name</label>
                <input
                  type='text'
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder='e.g. payment-gateway'
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1'>Branch</label>
                  <input
                    type='text'
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                  />
                </div>
                <div>
                  <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1'>HTTP Port</label>
                  <input
                    type='number'
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                  />
                </div>
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1'>Build Command</label>
                <input
                  type='text'
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>

              <div>
                <label className='block text-kr0n-text-secondary uppercase tracking-wider font-bold mb-1'>Start Command</label>
                <input
                  type='text'
                  value={startCommand}
                  onChange={(e) => setStartCommand(e.target.value)}
                  className='w-full bg-kr0n-surface border border-kr0n-line px-3 py-2 text-white outline-none focus:border-white'
                />
              </div>
            </div>
          )}

          {/* STEP 5: ENVIRONMENT */}
          {step === 5 && (
            <div className='space-y-4 text-xs font-mono'>
              <div className='flex items-center justify-between'>
                <h3 className='font-bold text-white uppercase tracking-wider'>Environment Variables</h3>
                <button
                  type='button'
                  onClick={() => setShowMasked(!showMasked)}
                  className='text-[10px] text-kr0n-text-secondary hover:text-white flex items-center gap-1'
                >
                  {showMasked ? <EyeOff size={11} /> : <Eye size={11} />}
                  <span>{showMasked ? 'Mask Secrets' : 'Reveal Values'}</span>
                </button>
              </div>

              <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft max-h-48 overflow-y-auto'>
                {envVars.map((env, i) => (
                  <div key={i} className='p-2.5 flex items-center justify-between gap-3'>
                    <div className='min-w-0 flex items-center gap-2'>
                      <span className='font-bold text-white'>{env.key}</span>
                      <span className='text-kr0n-muted font-bold'>=</span>
                      <span className='text-kr0n-text-secondary truncate'>
                        {env.isSecret && !showMasked ? '••••••••' : env.value}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveEnvVar(i)}
                      className='text-kr0n-muted hover:text-red-400 p-1 shrink-0'
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className='p-3 border border-kr0n-line bg-kr0n-black/50 space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  <input
                    type='text'
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder='KEY_NAME'
                    className='bg-kr0n-surface border border-kr0n-line px-2.5 py-1.5 text-white outline-none'
                  />
                  <input
                    type='text'
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    placeholder='value'
                    className='bg-kr0n-surface border border-kr0n-line px-2.5 py-1.5 text-white outline-none'
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <label className='flex items-center gap-2 text-[11px] text-kr0n-text-secondary cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={newSecret}
                      onChange={(e) => setNewSecret(e.target.checked)}
                      className='accent-white'
                    />
                    <span>Mask as Secret (encrypted in storage)</span>
                  </label>
                  <button
                    type='button'
                    onClick={handleAddEnvVar}
                    className='px-3 py-1 border border-kr0n-line bg-white/5 hover:border-white text-white text-[11px] font-bold'
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW */}
          {step === 6 && (
            <div className='space-y-4 font-mono text-xs'>
              <h3 className='font-bold text-white uppercase tracking-wider font-sans'>Review Service Declaration</h3>
              <div className='p-4 border border-kr0n-line bg-kr0n-surface space-y-2.5'>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Service Name:</span>
                  <span className='text-white font-bold'>{serviceName || 'default-service'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Workload Type:</span>
                  <span className='text-white font-bold'>{serviceType === 'template' ? 'Infrastructure Template' : 'Application Workload'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Source:</span>
                  <span className='text-white font-bold'>{serviceType === 'template' ? selectedTemplate.name : selectedRepo.name}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Branch / Target:</span>
                  <span className='text-white font-bold'>{branch}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Port:</span>
                  <span className='text-white font-bold'>{port}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-kr0n-text-secondary'>Environment Variables:</span>
                  <span className='text-white font-bold'>{envVars.length} variables configured</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: DEPLOYING PROGRESS */}
          {step === 7 && (
            <div className='py-8 text-center space-y-6'>
              <div className='w-12 h-12 border border-kr0n-line bg-kr0n-surface flex items-center justify-center mx-auto text-white'>
                {isDeploying ? <Loader2 size={24} className='animate-spin' /> : <CheckCircle2 size={24} className='text-emerald-400' />}
              </div>
              <div className='space-y-1'>
                <h3 className='text-base font-bold font-mono text-white uppercase'>
                  {isDeploying ? 'Synthesizing Service...' : 'Service Deployed'}
                </h3>
                <p className='text-xs font-mono text-kr0n-text-secondary'>
                  Stage {deployStep} of 6: {['Allocating build runner', 'Synthesizing AST container', 'Evaluating admission policy', 'Routing Anycast IP', 'Validating probe HTTP 200', 'Ready'][deployStep - 1] || 'Initializing...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {step < 7 && (
          <div className='h-14 border-t border-kr0n-line bg-kr0n-surface px-6 flex items-center justify-between shrink-0 font-mono text-xs'>
            <button
              type='button'
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className='flex items-center gap-1 text-kr0n-text-secondary hover:text-white disabled:opacity-30'
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            {step < 6 ? (
              <button
                type='button'
                onClick={() => setStep(step + 1)}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-4 py-2 uppercase font-bold tracking-wider transition-colors'
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type='button'
                onClick={handleStartDeploy}
                className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-5 py-2 uppercase font-bold tracking-wider transition-colors'
              >
                <span>Deploy Service</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
