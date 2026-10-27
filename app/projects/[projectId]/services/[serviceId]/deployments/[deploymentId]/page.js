'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
  Layers,
  FileCode,
  Lock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Rocket,
  Copy,
} from 'lucide-react';
import { useKr0nStore } from '@/lib/kr0n-state';
import ServiceHeaderTabs from '@/components/services/ServiceHeaderTabs';
import BrandedNotFound from '@/components/common/BrandedNotFound';

export default function DeploymentDetailPage({ params }) {
  const { projectId, serviceId, deploymentId } = use(params);
  const {
    projects,
    deployments,
    triggerDeploy,
    triggerRollback,
  } = useKr0nStore();

  const project = projects.find((p) => p.id === projectId);
  const service = project?.services?.find((s) => s.id === serviceId);

  const [expandedSection, setExpandedSection] = useState('sbom'); // 'sbom' | 'cve' | 'provenance' | 'sig' | 'admission'
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

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

  const allDeployments = deployments[serviceId] || deployments.svc_api || [];
  const deployment = allDeployments.find((d) => d.id === deploymentId) || allDeployments[0];

  if (!deployment) {
    return (
      <BrandedNotFound
        type='Deployment'
        id={deploymentId}
        backHref={`/projects/${projectId}/services/${serviceId}/deployments`}
        backLabel='Back to Deployments'
      />
    );
  }

  const handleRedeploy = () => {
    setIsRedeploying(true);
    setTimeout(() => {
      triggerDeploy(serviceId, `Redeploy of ${deployment.version}`);
      setIsRedeploying(false);
    }, 1800);
  };

  const handleRollback = () => {
    triggerRollback(serviceId, deployment.id);
    setShowRollbackConfirm(false);
  };

  const isFailed = deployment.status === 'failed' || deployment.status === 'rejected';
  const isActive = deployment.status === 'active';

  // Default lifecycle steps if not on object
  const lifecycle = deployment.lifecycle || [
    { stage: 'Queued', status: 'completed', duration: '2s', detail: 'Accepted by kr0n dispatcher' },
    { stage: 'Building', status: 'completed', duration: '58s', detail: 'Compiled successfully' },
    { stage: 'Built', status: 'completed', duration: '4s', detail: 'Synthesized container artifact' },
    { stage: 'Security Checks', status: 'completed', duration: '14s', detail: 'SBOM, CVE, & SLSA signatures verified' },
    { stage: 'Planning', status: 'completed', duration: '3s', detail: 'Desired state generated' },
    { stage: 'Deploying', status: 'completed', duration: '11s', detail: 'Rolling canary rollout' },
    { stage: 'Health Checking', status: 'completed', duration: '8s', detail: '3/3 probes HTTP 200 OK' },
    { stage: 'Ready', status: 'completed', duration: '2s', detail: 'Mesh connected' },
    { stage: 'Active', status: 'completed', duration: 'ongoing', detail: 'Serving production traffic' },
  ];

  return (
    <div className='flex-1 flex flex-col h-full overflow-auto bg-kr0n-canvas text-kr0n-text'>
      <ServiceHeaderTabs project={project} service={service} />

      <div className='flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8'>
        {/* Breadcrumb back link to deployments */}
        <div className='flex items-center justify-between'>
          <Link
            href={`/projects/${projectId}/services/${serviceId}/deployments`}
            className='inline-flex items-center gap-1.5 text-xs font-mono text-kr0n-text-secondary hover:text-white transition-colors uppercase tracking-wider font-medium'
          >
            <ArrowLeft size={13} />
            <span>All Deployments</span>
          </Link>

          <div className='flex items-center gap-2'>
            {!isActive && !isFailed && (
              <button
                type='button'
                onClick={() => setShowRollbackConfirm(true)}
                className='px-3 py-1.5 border border-kr0n-line hover:border-amber-400 text-xs font-mono text-kr0n-text-secondary hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5'
              >
                <RotateCcw size={12} />
                <span>Rollback to this Release</span>
              </button>
            )}

            <button
              type='button'
              disabled={isRedeploying}
              onClick={handleRedeploy}
              className='clipped-btn inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors disabled:opacity-50'
            >
              <Rocket size={12} className={isRedeploying ? 'animate-spin' : ''} />
              <span>{isRedeploying ? 'Triggering...' : 'Redeploy'}</span>
            </button>
          </div>
        </div>

        {/* ─── Hero Summary Banner ─── */}
        <div className='border border-kr0n-line bg-kr0n-surface p-6 space-y-4'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-3'>
                <span
                  className={`w-3 h-3 rounded-full ${
                    isActive ? 'bg-emerald-400 animate-pulse' : isFailed ? 'bg-red-400' : 'bg-zinc-400'
                  }`}
                />
                <h1 className='text-2xl font-bold font-mono text-white tracking-wide uppercase'>
                  {deployment.version}
                </h1>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                      : deployment.status === 'rejected'
                      ? 'bg-red-400/10 text-red-400 border border-red-400/30'
                      : isFailed
                      ? 'bg-red-400/10 text-red-400'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {deployment.status === 'rejected' ? 'REJECTED (QUOTA)' : deployment.status}
                </span>
              </div>
              <p className='text-sm text-kr0n-text-secondary font-sans max-w-2xl'>
                {deployment.commitMsg}
              </p>
            </div>

            {/* Quick Metadata */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs'>
              <div className='border border-kr0n-line-soft bg-kr0n-black p-3'>
                <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Commit</div>
                <div className='text-white font-bold mt-0.5'>{deployment.commit}</div>
              </div>
              <div className='border border-kr0n-line-soft bg-kr0n-black p-3'>
                <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Author</div>
                <div className='text-white font-bold mt-0.5'>{deployment.author}</div>
              </div>
              <div className='border border-kr0n-line-soft bg-kr0n-black p-3'>
                <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Duration</div>
                <div className='text-white font-bold mt-0.5'>{deployment.duration}</div>
              </div>
              <div className='border border-kr0n-line-soft bg-kr0n-black p-3'>
                <div className='text-[10px] text-kr0n-muted uppercase font-bold'>Deployed</div>
                <div className='text-white font-bold mt-0.5'>{deployment.timestamp}</div>
              </div>
            </div>
          </div>

          {/* Immutable Artifact Digest */}
          {deployment.artifactDigest && (
            <div className='pt-3 border-t border-kr0n-line-soft flex items-center justify-between text-xs font-mono text-kr0n-text-secondary'>
              <div className='flex items-center gap-2 truncate'>
                <span className='text-kr0n-muted uppercase text-[10px] font-bold'>Artifact Digest:</span>
                <span className='text-white truncate'>{deployment.artifactDigest}</span>
              </div>
              <button
                type='button'
                onClick={() => {
                  navigator.clipboard.writeText(deployment.artifactDigest);
                  setCopiedDigest(true);
                  setTimeout(() => setCopiedDigest(false), 2000);
                }}
                className='text-[10px] uppercase font-bold text-kr0n-muted hover:text-white transition-colors shrink-0 ml-3'
              >
                {copiedDigest ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* ─── Failure / Rejection Diagnostics Banner ─── */}
        {deployment.status === 'rejected' && (
          <div className='border border-red-400/40 bg-red-400/[0.04] p-5 space-y-3 font-mono text-xs'>
            <div className='flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm'>
              <XCircle size={16} />
              <span>Deployment Admission Rejected: Quota Exceeded</span>
            </div>
            <p className='text-kr0n-text-secondary font-sans leading-relaxed text-xs'>
              {deployment.rejectionReason}
            </p>
            <div className='p-3 border border-red-400/20 bg-red-400/5 text-xs text-kr0n-text-secondary space-y-1 font-mono'>
              <div className='text-white font-bold uppercase text-[10px] tracking-wider'>Recommended Remediation</div>
              <p>{deployment.suggestedRemediation}</p>
            </div>
            <div className='flex items-center gap-3 pt-1'>
              <Link
                href='/billing'
                className='text-white underline underline-offset-4 font-bold hover:text-kr0n-text-secondary'
              >
                Go to Billing & Quotas →
              </Link>
              <span className='text-kr0n-muted'>|</span>
              <Link
                href={`/projects/${projectId}/services/${serviceId}/settings#resources`}
                className='text-kr0n-text-secondary hover:text-white'
              >
                Adjust Service Allocation →
              </Link>
            </div>
          </div>
        )}

        {deployment.status === 'failed' && (
          <div className='border border-red-400/40 bg-red-400/[0.04] p-5 space-y-3 font-mono text-xs'>
            <div className='flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm'>
              <XCircle size={16} />
              <span>Build Pipeline Failed (Exit Code 1)</span>
            </div>
            <p className='text-kr0n-text-secondary font-sans leading-relaxed text-xs'>
              {deployment.failureReason}
            </p>
            <div className='p-3 border border-red-400/20 bg-red-400/5 text-xs text-kr0n-text-secondary space-y-1 font-mono'>
              <div className='text-white font-bold uppercase text-[10px] tracking-wider'>Remediation</div>
              <p>{deployment.suggestedRemediation}</p>
            </div>
          </div>
        )}

        {/* ─── Release Lifecycle Rail ─── */}
        <div className='space-y-3 font-mono'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
              Release Lifecycle Progression
            </h2>
            <span className='text-[10px] text-kr0n-muted'>
              {lifecycle.length} Pipeline Stages
            </span>
          </div>

          {/* Desktop horizontal rail / mobile vertical sequence */}
          <div className='border border-kr0n-line bg-kr0n-surface p-4 sm:p-5 overflow-x-auto'>
            <div className='min-w-[700px] flex items-center justify-between relative'>
              {/* Connecting line */}
              <div className='absolute top-3.5 left-6 right-6 h-[1px] bg-kr0n-line-strong -z-0' />

              {lifecycle.map((step, idx) => {
                const isStepFailed = step.status === 'failed';
                const isDone = step.status === 'completed';

                return (
                  <div key={step.stage} className='flex flex-col items-center relative z-10 text-center px-1'>
                    <div
                      className={`w-7 h-7 border flex items-center justify-center text-[11px] font-bold ${
                        isStepFailed
                          ? 'border-red-400 bg-red-400/20 text-red-400'
                          : isDone
                          ? 'border-emerald-400 bg-kr0n-black text-emerald-400'
                          : 'border-kr0n-line bg-kr0n-canvas text-kr0n-muted'
                      }`}
                    >
                      {isStepFailed ? '✕' : isDone ? '✓' : idx + 1}
                    </div>
                    <div className='mt-2'>
                      <span className='text-[11px] font-bold text-white block whitespace-nowrap'>
                        {step.stage}
                      </span>
                      <span className='text-[9px] text-kr0n-muted block mt-0.5 tabular-nums'>
                        {step.duration}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Security Checks Accordion ─── */}
        <div className='space-y-3 font-mono'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ShieldCheck size={14} className='text-emerald-400' />
              <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
                Security & Supply Chain Checks
              </h2>
            </div>
            <span className='text-[10px] text-emerald-400 font-bold uppercase'>
              Admission Verified
            </span>
          </div>

          <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft text-xs'>
            {/* 1. SBOM */}
            <div className='p-4'>
              <div
                onClick={() => setExpandedSection(expandedSection === 'sbom' ? null : 'sbom')}
                className='flex items-center justify-between cursor-pointer'
              >
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={14} className='text-emerald-400' />
                  <span className='font-bold text-white uppercase text-xs'>Software Bill of Materials (SBOM)</span>
                  <span className='text-[10px] text-kr0n-muted'>42 packages scanned</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-kr0n-muted transition-transform ${expandedSection === 'sbom' ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedSection === 'sbom' && (
                <div className='mt-3 pt-3 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary space-y-2'>
                  <p>SPDX 2.3 JSON specification synthesized during AST dependency tree analysis. Zero unapproved copyleft licenses detected.</p>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono'>
                    <div className='p-2 bg-kr0n-black border border-kr0n-line-soft'>
                      <div className='text-kr0n-muted text-[10px]'>Direct Dependencies</div>
                      <div className='text-white font-bold'>8 packages</div>
                    </div>
                    <div className='p-2 bg-kr0n-black border border-kr0n-line-soft'>
                      <div className='text-kr0n-muted text-[10px]'>Transitive Total</div>
                      <div className='text-white font-bold'>42 packages</div>
                    </div>
                    <div className='p-2 bg-kr0n-black border border-kr0n-line-soft'>
                      <div className='text-kr0n-muted text-[10px]'>Ecosystem</div>
                      <div className='text-white font-bold'>npm (Node 22)</div>
                    </div>
                    <div className='p-2 bg-kr0n-black border border-kr0n-line-soft'>
                      <div className='text-kr0n-muted text-[10px]'>License Health</div>
                      <div className='text-emerald-400 font-bold'>100% Permissive</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Vulnerability Scan */}
            <div className='p-4'>
              <div
                onClick={() => setExpandedSection(expandedSection === 'cve' ? null : 'cve')}
                className='flex items-center justify-between cursor-pointer'
              >
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={14} className='text-emerald-400' />
                  <span className='font-bold text-white uppercase text-xs'>CVE Vulnerability Inspection</span>
                  <span className='text-[10px] text-kr0n-muted'>0 Critical · 0 High</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-kr0n-muted transition-transform ${expandedSection === 'cve' ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedSection === 'cve' && (
                <div className='mt-3 pt-3 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary space-y-2'>
                  <p>Trivy static container image vulnerability scan passed. Base image Alpine 3.19 patched against known CVE database.</p>
                  <div className='flex items-center gap-4 text-xs font-mono pt-1'>
                    <span className='text-kr0n-muted'>Critical: <strong className='text-emerald-400'>0</strong></span>
                    <span className='text-kr0n-muted'>High: <strong className='text-emerald-400'>0</strong></span>
                    <span className='text-kr0n-muted'>Medium: <strong className='text-amber-400'>2</strong></span>
                    <span className='text-kr0n-muted'>Low: <strong className='text-zinc-400'>4</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Provenance & Attestation */}
            <div className='p-4'>
              <div
                onClick={() => setExpandedSection(expandedSection === 'provenance' ? null : 'provenance')}
                className='flex items-center justify-between cursor-pointer'
              >
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={14} className='text-emerald-400' />
                  <span className='font-bold text-white uppercase text-xs'>SLSA Level 3 Provenance</span>
                  <span className='text-[10px] text-kr0n-muted'>Hermetic build worker verified</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-kr0n-muted transition-transform ${expandedSection === 'provenance' ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedSection === 'provenance' && (
                <div className='mt-3 pt-3 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary space-y-1.5'>
                  <p>in-toto attestation generated in an isolated non-reusable build harness with cryptographically verifiable source commit reference.</p>
                  <div className='font-mono text-white text-[10px] bg-kr0n-black p-2 border border-kr0n-line-soft'>
                    predicateType: https://slsa.dev/provenance/v1<br />
                    builder.id: https://kr0n.dev/attestation/worker-us-east-1
                  </div>
                </div>
              )}
            </div>

            {/* 4. Signature & Admission */}
            <div className='p-4'>
              <div
                onClick={() => setExpandedSection(expandedSection === 'admission' ? null : 'admission')}
                className='flex items-center justify-between cursor-pointer'
              >
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={14} className='text-emerald-400' />
                  <span className='font-bold text-white uppercase text-xs'>Cosign Signature & Admission Policy</span>
                  <span className='text-[10px] text-kr0n-muted'>Sigstore OIDC verified</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-kr0n-muted transition-transform ${expandedSection === 'admission' ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedSection === 'admission' && (
                <div className='mt-3 pt-3 border-t border-kr0n-line-soft text-[11px] text-kr0n-text-secondary space-y-2'>
                  <p>Cosign keyless signature confirmed via Sigstore OIDC token for developer <strong className='text-white'>{deployment.author}@kr0n.dev</strong>. OPA Gatekeeper policy enforced: container runs as unprivileged user with read-only rootfs and gVisor isolation sandbox.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Build & Synthesis Logs ─── */}
        <div className='space-y-3 font-mono'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Terminal size={14} className='text-kr0n-muted' />
              <h2 className='text-xs uppercase tracking-widest text-kr0n-text-secondary font-bold'>
                Build & Synthesis Terminal Output
              </h2>
            </div>
            <span className='text-[10px] text-kr0n-muted'>
              {deployment.logs?.length || 12} Log Lines
            </span>
          </div>

          <div className='border border-kr0n-line bg-kr0n-black p-4 font-mono text-xs leading-relaxed space-y-1 overflow-x-auto select-text'>
            {deployment.logs && deployment.logs.length > 0 ? (
              deployment.logs.map((line, i) => (
                <div key={i} className='text-kr0n-text-secondary hover:text-white'>
                  {line}
                </div>
              ))
            ) : (
              <div className='text-kr0n-muted'>No build logs recorded for this deployment attempt.</div>
            )}
          </div>
        </div>
      </div>

      {/* Rollback confirmation modal */}
      {showRollbackConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono text-xs'>
          <div className='max-w-md w-full border border-kr0n-line bg-kr0n-surface p-6 space-y-4 shadow-2xl'>
            <h3 className='text-sm font-bold text-white uppercase'>Confirm Target Rollback</h3>
            <p className='text-kr0n-text-secondary font-sans leading-relaxed'>
              This action will promote release <strong className='text-white'>{deployment.version}</strong> back to active status, routing 100% of production traffic to this build.
            </p>
            <div className='flex items-center justify-end gap-3 pt-2'>
              <button
                type='button'
                onClick={() => setShowRollbackConfirm(false)}
                className='px-3 py-1.5 border border-kr0n-line text-kr0n-text-secondary hover:text-white'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleRollback}
                className='clipped-btn bg-amber-400 hover:bg-amber-300 text-black px-4 py-1.5 font-bold uppercase'
              >
                Promote & Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
