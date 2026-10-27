'use client';

/**
 * KR0N Centralized Frontend State & Fixtures Layer
 *
 * Provides deterministic data, stable IDs, SSR-safe localStorage persistence,
 * and reactive subscribers for all projects, services, deployments, alerts,
 * incidents, billing, and settings.
 *
 * All operations are purely client-side demo mutations.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kr0n_state_v1.2';

// ─── INITIAL MOCK FIXTURES ──────────────────────────────────────────

export const INITIAL_PROJECTS = [
  {
    id: 'proj_orvea_prod',
    index: '01',
    group: 'ORVEA',
    name: 'Orvea',
    description: 'Coffee commerce platform',
    environment: 'production',
    environments: ['production', 'staging', 'preview'],
    status: 'healthy',
    services: [
      {
        id: 'svc_api',
        name: 'api',
        type: 'web',
        runtime: 'Long-running',
        runtimeLabel: 'KR0N V8 Edge Worker (Long-running)',
        repository: 'github.com/kr0n-org/orvea-core',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        port: 8080,
        url: 'api.orvea.app',
        customDomains: [
          { domain: 'api.coffee-orvea.com', status: 'verified', tls: 'active', renewal: 'Auto (64 days)' }
        ],
        resources: { cpu: '0.5 vCPU', memory: '1.8 GB', instances: 3, maxInstances: 6, minInstances: 2 },
        healthCheck: { path: '/api/v1/health', port: 8080, timeout: 5, interval: 10, threshold: 3, status: 'healthy', passingPercent: '100%' },
        volumes: [
          { id: 'vol_orvea_data', name: 'orvea-catalog-data', size: '50 GB', mountPath: '/mnt/data', status: 'attached', createdAt: '2026-09-12' }
        ],
        envVars: [
          { key: 'DATABASE_URL', value: 'postgresql://kr0n_admin:••••••••@edge.db:5432/main', isSecret: true },
          { key: 'KR0N_SIGNING_SECRET', value: 'kr0n_sec_••••••••••••••••••••••••', isSecret: true },
          { key: 'REDIS_CACHE_URL', value: 'redis://default:••••••••@cache.kr0n.internal:6379', isSecret: true },
          { key: 'NODE_ENV', value: 'production', isSecret: false },
          { key: 'PORT', value: '8080', isSecret: false },
        ],
      },
      {
        id: 'svc_web',
        name: 'web',
        type: 'web',
        runtime: 'Serverless',
        runtimeLabel: 'Next.js 15 Serverless SSR',
        repository: 'github.com/kr0n-org/orvea-web',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'next build',
        startCommand: 'next start',
        port: 3000,
        url: 'orvea.app',
        customDomains: [
          { domain: 'coffee-orvea.com', status: 'verified', tls: 'active', renewal: 'Auto (64 days)' }
        ],
        resources: { cpu: '0.25 vCPU', memory: '0.9 GB', instances: 2, maxInstances: 8, minInstances: 1 },
        healthCheck: { path: '/', port: 3000, timeout: 5, interval: 15, threshold: 2, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [
          { key: 'NEXT_PUBLIC_API_URL', value: 'https://api.orvea.app', isSecret: false },
          { key: 'NEXT_PUBLIC_ANALYTICS_ID', value: 'kr0n_an_9831', isSecret: false },
        ],
      },
      {
        id: 'svc_worker',
        name: 'worker',
        type: 'worker',
        runtime: 'Long-running',
        runtimeLabel: 'Node.js Queue Consumer',
        repository: 'github.com/kr0n-org/orvea-worker',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'node dist/index.js',
        port: null,
        url: null,
        customDomains: [],
        resources: { cpu: '0.5 vCPU', memory: '1.2 GB', instances: 2, maxInstances: 4, minInstances: 1 },
        healthCheck: { path: '/healthz', port: 9090, timeout: 5, interval: 10, threshold: 3, status: 'healthy', passingPercent: '100%' },
        volumes: [
          { id: 'vol_worker_cache', name: 'worker-scratch-vol', size: '20 GB', mountPath: '/mnt/scratch', status: 'attached', createdAt: '2026-09-18' }
        ],
        envVars: [
          { key: 'KAFKA_BROKERS', value: 'kafka.kr0n.internal:9092', isSecret: true },
          { key: 'WORKER_CONCURRENCY', value: '8', isSecret: false },
        ],
      },
    ],
    currentDeployment: {
      id: 'dep_a83f2c1',
      version: 'v1.8.4',
      commit: 'a83f2c1',
      status: 'active',
      timestamp: '14m ago',
      branch: 'main',
    },
    url: 'api.orvea.app',
    repository: 'github.com/kr0n-org/orvea-core',
    resources: { cpu: 34, memory: '1.8 GB' },
    deploymentCount: 7,
    updatedAt: '2m ago',
    position: { x: 80, y: 80 },
    linkedTo: 'proj_orvea_stage',
  },
  {
    id: 'proj_orvea_stage',
    index: '01',
    group: 'ORVEA',
    name: 'Orvea',
    description: 'Coffee commerce platform',
    environment: 'staging',
    environments: ['production', 'staging', 'preview'],
    status: 'healthy',
    services: [
      {
        id: 'svc_api_s',
        name: 'api',
        type: 'web',
        runtime: 'Long-running',
        runtimeLabel: 'KR0N V8 Edge Worker (Staging)',
        repository: 'github.com/kr0n-org/orvea-core',
        branch: 'develop',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        port: 8080,
        url: 'staging.api.orvea.app',
        customDomains: [],
        resources: { cpu: '0.25 vCPU', memory: '0.9 GB', instances: 1, maxInstances: 2, minInstances: 1 },
        healthCheck: { path: '/api/v1/health', port: 8080, timeout: 5, interval: 10, threshold: 3, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [{ key: 'NODE_ENV', value: 'staging', isSecret: false }],
      },
    ],
    currentDeployment: {
      id: 'dep_f1c2a8b',
      version: 'v1.9.0-rc.2',
      commit: 'f1c2a8b',
      status: 'deploying',
      timestamp: '1m ago',
      branch: 'develop',
    },
    url: 'staging.orvea.app',
    repository: 'github.com/kr0n-org/orvea-core',
    resources: { cpu: 12, memory: '0.9 GB' },
    deploymentCount: 14,
    updatedAt: '1m ago',
    position: { x: 80, y: 280 },
    linkedTo: 'proj_orvea_prod',
  },
  {
    id: 'proj_atlas',
    index: '02',
    name: 'Atlas',
    description: 'Internal tooling dashboard & gatekeeper',
    environment: 'production',
    environments: ['production', 'staging'],
    status: 'healthy',
    services: [
      {
        id: 'svc_atlas_web',
        name: 'dashboard',
        type: 'web',
        runtime: 'Serverless',
        runtimeLabel: 'React / Vite Serverless Engine',
        repository: 'github.com/kr0n-org/atlas',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'npm run preview',
        port: 4000,
        url: 'atlas.internal.dev',
        customDomains: [],
        resources: { cpu: '0.25 vCPU', memory: '0.8 GB', instances: 1, maxInstances: 3, minInstances: 1 },
        healthCheck: { path: '/', port: 4000, timeout: 5, interval: 15, threshold: 2, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [],
      },
      {
        id: 'svc_atlas_api',
        name: 'gateway',
        type: 'web',
        runtime: 'Long-running',
        runtimeLabel: 'Go API Gateway (gVisor isolated)',
        repository: 'github.com/kr0n-org/atlas-gw',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'go build -o server',
        startCommand: './server',
        port: 8000,
        url: 'api.atlas.internal.dev',
        customDomains: [],
        resources: { cpu: '0.5 vCPU', memory: '1.2 GB', instances: 2, maxInstances: 4, minInstances: 1 },
        healthCheck: { path: '/health', port: 8000, timeout: 3, interval: 10, threshold: 2, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [],
      },
    ],
    currentDeployment: {
      id: 'dep_9d4e1f0',
      version: 'v3.2.1',
      commit: '9d4e1f0',
      status: 'active',
      timestamp: '14m ago',
      branch: 'main',
    },
    url: 'atlas.internal.dev',
    repository: 'github.com/kr0n-org/atlas',
    resources: { cpu: 18, memory: '1.2 GB' },
    deploymentCount: 3,
    updatedAt: '14m ago',
    position: { x: 420, y: 100 },
    linkedTo: null,
  },
  {
    id: 'proj_nebula',
    index: '03',
    name: 'Nebula',
    description: 'Real-time telemetry ingestion engine',
    environment: 'production',
    environments: ['production', 'staging'],
    status: 'warning',
    services: [
      {
        id: 'svc_neb_ingest',
        name: 'ingest',
        type: 'worker',
        runtime: 'Long-running',
        runtimeLabel: 'Rust High-throughput Collector',
        repository: 'github.com/kr0n-org/nebula',
        branch: 'main',
        rootDir: '/ingest',
        autoDeploy: true,
        buildCommand: 'cargo build --release',
        startCommand: './target/release/ingest',
        port: 9090,
        url: null,
        customDomains: [],
        resources: { cpu: '1.0 vCPU', memory: '3.4 GB', instances: 4, maxInstances: 8, minInstances: 2 },
        healthCheck: { path: '/health', port: 9090, timeout: 2, interval: 5, threshold: 2, status: 'warning', passingPercent: '88%' },
        volumes: [
          { id: 'vol_neb_buffer', name: 'ingest-buffer-vol', size: '100 GB', mountPath: '/var/buffer', status: 'attached', createdAt: '2026-08-20' }
        ],
        envVars: [],
      },
      {
        id: 'svc_neb_query',
        name: 'query',
        type: 'web',
        runtime: 'Long-running',
        runtimeLabel: 'ClickHouse Query Gateway',
        repository: 'github.com/kr0n-org/nebula',
        branch: 'main',
        rootDir: '/query',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        port: 8080,
        url: 'nebula.kr0n.dev',
        customDomains: [],
        resources: { cpu: '0.5 vCPU', memory: '1.6 GB', instances: 2, maxInstances: 4, minInstances: 1 },
        healthCheck: { path: '/health', port: 8080, timeout: 5, interval: 10, threshold: 2, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [],
      },
    ],
    currentDeployment: {
      id: 'dep_b72c4d3',
      version: 'v2.1.0',
      commit: 'b72c4d3',
      status: 'active',
      timestamp: '48m ago',
      branch: 'main',
    },
    url: 'nebula.kr0n.dev',
    repository: 'github.com/kr0n-org/nebula',
    resources: { cpu: 67, memory: '3.4 GB' },
    deploymentCount: 11,
    updatedAt: '48m ago',
    position: { x: 420, y: 320 },
    linkedTo: null,
  },
  {
    id: 'proj_herald',
    index: '04',
    name: 'Herald',
    description: 'Multi-channel event notification bus',
    environment: 'production',
    environments: ['production'],
    status: 'healthy',
    services: [
      {
        id: 'svc_herald_api',
        name: 'api',
        type: 'web',
        runtime: 'Long-running',
        runtimeLabel: 'Node.js Fastify Gateway',
        repository: 'github.com/kr0n-org/herald',
        branch: 'main',
        rootDir: '/',
        autoDeploy: true,
        buildCommand: 'npm run build',
        startCommand: 'node dist/server.js',
        port: 3000,
        url: 'herald.kr0n.dev',
        customDomains: [],
        resources: { cpu: '0.25 vCPU', memory: '0.6 GB', instances: 1, maxInstances: 2, minInstances: 1 },
        healthCheck: { path: '/health', port: 3000, timeout: 5, interval: 10, threshold: 3, status: 'healthy', passingPercent: '100%' },
        volumes: [],
        envVars: [],
      },
    ],
    currentDeployment: {
      id: 'dep_e5f6a2c',
      version: 'v1.0.3',
      commit: 'e5f6a2c',
      status: 'active',
      timestamp: '2h ago',
      branch: 'main',
    },
    url: 'herald.kr0n.dev',
    repository: 'github.com/kr0n-org/herald',
    resources: { cpu: 8, memory: '0.6 GB' },
    deploymentCount: 5,
    updatedAt: '2h ago',
    position: { x: 760, y: 180 },
    linkedTo: null,
  },
];

export const INITIAL_DEPLOYMENTS = {
  svc_api: [
    {
      id: 'dep_a83f2c1',
      version: 'v1.8.4',
      commit: 'a83f2c1',
      commitMsg: 'optimize edge routing and streaming response headers',
      author: 'alex.chen',
      branch: 'main',
      trigger: 'git push',
      status: 'active',
      duration: '1m 42s',
      timestamp: '14m ago',
      exactTime: '2026-10-27T14:28:12Z',
      artifactDigest: 'sha256:4a8b79e1c40f82d33458e0a1329a43c72b12f6',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '2s', detail: 'Accepted by build dispatch' },
        { stage: 'Building', status: 'completed', duration: '58s', detail: 'Compiled via kr0n BuildKit cache (AST optimized)' },
        { stage: 'Built', status: 'completed', duration: '4s', detail: 'Container image synthesized: 48.2 MB' },
        { stage: 'Security Checks', status: 'completed', duration: '14s', detail: 'SBOM generated · 0 CVEs found · SLSA Level 3 signed' },
        { stage: 'Planning', status: 'completed', duration: '3s', detail: 'Desired state generated: 3 edge instances targeted' },
        { stage: 'Deploying', status: 'completed', duration: '11s', detail: 'Canary traffic ramped to 100%' },
        { stage: 'Health Checking', status: 'completed', duration: '8s', detail: '3/3 probes responded HTTP 200 (1.4ms)' },
        { stage: 'Ready', status: 'completed', duration: '2s', detail: 'Endpoints registered in global edge mesh' },
        { stage: 'Active', status: 'completed', duration: 'ongoing', detail: 'Serving 100% production traffic' },
      ],
      security: {
        sbom: { packageCount: 42, ecosystem: 'npm / Node.js 22', licenseCompliant: true, status: 'passed' },
        vulnerabilities: { critical: 0, high: 0, medium: 2, low: 4, scannedAt: '14m ago', status: 'passed' },
        provenance: { slsaLevel: 'Level 3', builder: 'kr0n-worker-us-east-1', verified: true, status: 'passed' },
        signature: { signedBy: 'alex.chen@kr0n.dev (Sigstore OIDC)', keyless: true, status: 'passed' },
        admission: { policy: 'kr0n-strict-edge-v2', sandbox: 'gVisor runtime sandbox active', nonRoot: true, status: 'passed' },
      },
      logs: [
        '[08:45:10] → BUILD_INIT: worker assigned [kr0n-buildkit-us-east]',
        '[08:45:12] → GIT_CLONE: commit a83f2c1 fetched from main in 1.4s',
        '[08:45:14] → RUN: npm install --frozen-lockfile (cached 98%)',
        '[08:45:28] → RUN: npm run build',
        '[08:46:08] → OPTIMIZE: Next.js tree-shaking completed; artifact size 48.2 MB',
        '[08:46:12] → SCAN: Trivy vulnerability inspection started',
        '[08:46:24] → SCAN: 0 critical, 0 high vulnerabilities found',
        '[08:46:26] → SIGN: Cosign keyless attestation generated via Sigstore OIDC',
        '[08:46:30] → DISPATCH: Rolling update triggered across 3 edge locations',
        '[08:46:42] → PROBE: Probe us-east-1a HTTP 200 OK (1.2ms)',
        '[08:46:45] → PROBE: Probe us-east-1b HTTP 200 OK (1.5ms)',
        '[08:46:48] → PROBE: Probe eu-west-1a HTTP 200 OK (2.1ms)',
        '[08:46:52] → ACTIVE: Release v1.8.4 marked ACTIVE. Traffic fully switched.',
      ],
    },
    {
      id: 'dep_b94e21a',
      version: 'v1.8.3',
      commit: 'b94e21a',
      commitMsg: 'bump telemetry instrumentation and grpc bindings',
      author: 'sarah.m',
      branch: 'main',
      trigger: 'git push',
      status: 'ready',
      duration: '2m 04s',
      timestamp: '2h ago',
      exactTime: '2026-10-27T12:34:00Z',
      artifactDigest: 'sha256:9c12b7a8d43f01e23a4b5c6d7e8f9a0b1c2d3e4f',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '3s', detail: 'Accepted' },
        { stage: 'Building', status: 'completed', duration: '1m 12s', detail: 'Compiled successfully' },
        { stage: 'Built', status: 'completed', duration: '5s', detail: 'Artifact packaged' },
        { stage: 'Security Checks', status: 'completed', duration: '16s', detail: 'Checks passed' },
        { stage: 'Planning', status: 'completed', duration: '3s', detail: 'Plan ready' },
        { stage: 'Deploying', status: 'completed', duration: '14s', detail: 'Ramped traffic' },
        { stage: 'Health Checking', status: 'completed', duration: '9s', detail: 'All probes 200' },
        { stage: 'Ready', status: 'completed', duration: '—', detail: 'Replaced by v1.8.4' },
      ],
      security: {
        sbom: { packageCount: 41, ecosystem: 'npm', licenseCompliant: true, status: 'passed' },
        vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3, scannedAt: '2h ago', status: 'passed' },
        provenance: { slsaLevel: 'Level 3', builder: 'kr0n-worker-us-east-1', verified: true, status: 'passed' },
        signature: { signedBy: 'sarah.m@kr0n.dev (Sigstore OIDC)', keyless: true, status: 'passed' },
        admission: { policy: 'kr0n-strict-edge-v2', sandbox: 'gVisor runtime sandbox active', nonRoot: true, status: 'passed' },
      },
      logs: [
        '[06:31:02] → BUILD_INIT: worker assigned',
        '[06:31:45] → COMPILE: Complete (72s)',
        '[06:32:10] → SCAN: Complete — 0 issues found',
        '[06:33:04] → ACTIVE: Release v1.8.3 became active',
      ],
    },
    {
      id: 'dep_f99e31d',
      version: 'v1.8.5-quota-err',
      commit: 'f99e31d',
      commitMsg: 'scale in-memory response cache buffer',
      author: 'alex.chen',
      branch: 'main',
      trigger: 'manual deploy',
      status: 'rejected',
      duration: '12s',
      timestamp: '3h ago',
      exactTime: '2026-10-27T11:12:00Z',
      rejectionReason: 'Project memory entitlement exceeded. Current: 7.8 GB / 8.0 GB. Requested addition: 2.0 GB. Entitlement limit is hard-capped on the current Team Tier.',
      suggestedRemediation: 'Upgrade to Scale Tier on the Billing page or reduce instance count / memory buffer in Service Settings.',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '2s', detail: 'Accepted' },
        { stage: 'Building', status: 'completed', duration: '6s', detail: 'Manifest analyzed' },
        { stage: 'Built', status: 'completed', duration: '1s', detail: 'Specification verified' },
        { stage: 'Security Checks', status: 'completed', duration: '2s', detail: 'Passed' },
        { stage: 'Planning', status: 'failed', duration: '1s', detail: 'Rejected by Admission Controller: Quota Exceeded' },
      ],
      security: null,
      logs: [
        '[11:12:01] → ADMISSION_CHECK: Evaluating project resource entitlements...',
        '[11:12:03] → CURRENT_ALLOCATION: Memory=7.8 GB / 8.0 GB (97.5% capacity)',
        '[11:12:04] → REQUESTED: Service requested +2.0 GB across 3 instances',
        '[11:12:05] → REJECTED: Operation rejected. HARD_QUOTA_EXCEEDED (Memory).',
        '[11:12:06] → HINT: Visit /billing to increase project quota or /usage to review consumption.',
      ],
    },
    {
      id: 'dep_c33a101',
      version: 'v1.8.5-fail-test',
      commit: 'c33a101',
      commitMsg: 'refactor telemetry export bindings',
      author: 'sarah.m',
      branch: 'staging',
      trigger: 'git push',
      status: 'failed',
      duration: '38s',
      timestamp: '5h ago',
      exactTime: '2026-10-27T09:44:00Z',
      failureReason: "TypeScript compilation failed: TS2307 Cannot find module '@kr0n/edge-telemetry' or its corresponding type declarations.",
      suggestedRemediation: 'Verify package.json dependencies and ensure @kr0n/edge-telemetry is installed or updated in the repository.',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '1s', detail: 'Accepted' },
        { stage: 'Building', status: 'failed', duration: '37s', detail: 'Exit code 1 during `npm run build`' },
      ],
      security: null,
      logs: [
        '[09:44:02] → BUILD_INIT: worker assigned',
        '[09:44:10] → RUN: npm run build',
        '[09:44:28] ❌ ERROR in src/telemetry/index.ts(12,24):',
        "[09:44:28] TS2307: Cannot find module '@kr0n/edge-telemetry' or its corresponding type declarations.",
        '[09:44:30] Command failed with exit code 1.',
        '[09:44:32] → BUILD_FAILED: Build harness aborted. Running version v1.8.4 was left undisturbed.',
      ],
    },
    {
      id: 'dep_48c10fa',
      version: 'v1.8.2',
      commit: '48c10fa',
      commitMsg: 'hotfix database query connection pooling timeout',
      author: 'gurmehar',
      branch: 'main',
      trigger: 'git push',
      status: 'ready',
      duration: '1m 58s',
      timestamp: '1d ago',
      exactTime: '2026-10-26T14:10:00Z',
      artifactDigest: 'sha256:7739a82c1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '2s', detail: 'Accepted' },
        { stage: 'Building', status: 'completed', duration: '1m 05s', detail: 'Compiled' },
        { stage: 'Built', status: 'completed', duration: '4s', detail: 'Built' },
        { stage: 'Security Checks', status: 'completed', duration: '15s', detail: 'Passed' },
        { stage: 'Planning', status: 'completed', duration: '2s', detail: 'Planned' },
        { stage: 'Deploying', status: 'completed', duration: '18s', detail: 'Deployed' },
        { stage: 'Health Checking', status: 'completed', duration: '10s', detail: 'Probes 200' },
        { stage: 'Ready', status: 'completed', duration: '—', detail: 'Archived release' },
      ],
      security: {
        sbom: { packageCount: 40, ecosystem: 'npm', licenseCompliant: true, status: 'passed' },
        vulnerabilities: { critical: 0, high: 0, medium: 1, low: 2, scannedAt: '1d ago', status: 'passed' },
        provenance: { slsaLevel: 'Level 3', builder: 'kr0n-worker-us-east-1', verified: true, status: 'passed' },
        signature: { signedBy: 'gurmehar@kr0n.dev (Sigstore OIDC)', keyless: true, status: 'passed' },
        admission: { policy: 'kr0n-strict-edge-v2', sandbox: 'gVisor runtime sandbox active', nonRoot: true, status: 'passed' },
      },
      logs: [
        '[14:10:02] → BUILD_INIT: worker assigned',
        '[14:11:45] → ACTIVE: Release v1.8.2 became active',
      ],
    },
  ],
};

export const INITIAL_ALERTS = [
  {
    id: 'alt_01',
    title: 'Elevated p99 latency on /api/v1/checkout',
    description: 'p99 response latency exceeds 300ms threshold for 5 consecutive minutes (observed 340ms).',
    severity: 'critical',
    status: 'firing',
    source: 'Metric Threshold (Latency)',
    projectId: 'proj_orvea_prod',
    projectName: 'Orvea',
    environment: 'production',
    serviceId: 'svc_api',
    serviceName: 'api',
    incidentId: 'inc_01',
    triggeredAt: '18m ago',
    timestamp: '2026-10-27T14:40:00Z',
  },
  {
    id: 'alt_02',
    title: 'Worker memory pressure approaching limit',
    description: 'Memory utilization reached 87% of allocated quota (3.4 GB / 4.0 GB).',
    severity: 'warning',
    status: 'firing',
    source: 'Quota Engine (Memory)',
    projectId: 'proj_nebula',
    projectName: 'Nebula',
    environment: 'production',
    serviceId: 'svc_neb_ingest',
    serviceName: 'ingest',
    incidentId: 'inc_02',
    triggeredAt: '42m ago',
    timestamp: '2026-10-27T14:16:00Z',
  },
  {
    id: 'alt_03',
    title: 'TLS certificate renewal scheduled',
    description: 'Automated Let&apos;s Encrypt certificate renewal pending for api.coffee-orvea.com.',
    severity: 'info',
    status: 'acknowledged',
    source: 'Edge TLS Manager',
    projectId: 'proj_orvea_prod',
    projectName: 'Orvea',
    environment: 'production',
    serviceId: 'svc_api',
    serviceName: 'api',
    incidentId: null,
    triggeredAt: '2d ago',
    timestamp: '2026-10-25T08:00:00Z',
  },
  {
    id: 'alt_04',
    title: 'Upstream connection pool saturated',
    description: 'Connection pool exhausted on upstream primary; connections queued for 4.2s.',
    severity: 'critical',
    status: 'resolved',
    source: 'Healthcheck Probes',
    projectId: 'proj_atlas',
    projectName: 'Atlas',
    environment: 'production',
    serviceId: 'svc_atlas_api',
    serviceName: 'gateway',
    incidentId: null,
    triggeredAt: '4h ago',
    timestamp: '2026-10-27T10:30:00Z',
  },
  {
    id: 'alt_05',
    title: 'Build synthesis duration spike',
    description: 'Build runner synthesis exceeded 4 minutes; artifact cache miss recorded.',
    severity: 'warning',
    status: 'resolved',
    source: 'BuildKit Pipeline',
    projectId: 'proj_herald',
    projectName: 'Herald',
    environment: 'production',
    serviceId: 'svc_herald_api',
    serviceName: 'api',
    incidentId: null,
    triggeredAt: '1d ago',
    timestamp: '2026-10-26T11:00:00Z',
  },
];

export const INITIAL_INCIDENTS = [
  {
    id: 'inc_01',
    title: 'Elevated Checkout Latency & Connection Queueing',
    status: 'investigating',
    severity: 'critical',
    severityLabel: 'P1 - High Impact',
    startedAt: '18m ago',
    timestamp: '2026-10-27T14:40:00Z',
    affectedProjects: [{ id: 'proj_orvea_prod', name: 'Orvea', environment: 'production' }],
    affectedServices: [{ id: 'svc_api', name: 'api', runtime: 'Long-running' }],
    impact: 'p99 checkout latency elevated to 340ms, affecting approximately 2.4% of shopping cart completion requests. Catalog read queries and edge CDN cache hits remain unaffected.',
    relatedAlertIds: ['alt_01'],
    relatedDeploymentId: 'dep_a83f2c1',
    diagnosticLinks: [
      { label: 'View Error Logs (api)', href: '/projects/proj_orvea_prod/services/svc_api/logs' },
      { label: 'View Latency Metrics', href: '/projects/proj_orvea_prod/services/svc_api/metrics' },
    ],
    timeline: [
      { time: '14:40 UTC', label: 'Automated Alert Fired', detail: 'Latency p99 threshold exceeded 300ms on /api/v1/checkout' },
      { time: '14:42 UTC', label: 'Acknowledged', detail: 'Incident automatically assigned to on-call engineering' },
      { time: '14:46 UTC', label: 'Diagnostics Collected', detail: 'Edge proxy reports upstream pool connection saturation (12/12 busy)' },
      { time: '14:52 UTC', label: 'Mitigation Started', detail: 'Scaling worker pool concurrency and warming read-replica connections' },
    ],
  },
  {
    id: 'inc_02',
    title: 'Telemetry Ingestion Rate Spike & Memory Pressure',
    status: 'monitoring',
    severity: 'warning',
    severityLabel: 'P2 - Moderate',
    startedAt: '42m ago',
    timestamp: '2026-10-27T14:16:00Z',
    affectedProjects: [{ id: 'proj_nebula', name: 'Nebula', environment: 'production' }],
    affectedServices: [{ id: 'svc_neb_ingest', name: 'ingest', runtime: 'Long-running' }],
    impact: 'Worker memory utilization reached 87%. Auto-scaler provisioned +2 instances to maintain safe ingestion buffer.',
    relatedAlertIds: ['alt_02'],
    relatedDeploymentId: 'dep_b72c4d3',
    diagnosticLinks: [
      { label: 'View Ingest Metrics', href: '/projects/proj_nebula/services/svc_neb_ingest/metrics' },
      { label: 'View Ingest Logs', href: '/projects/proj_nebula/services/svc_neb_ingest/logs' },
    ],
    timeline: [
      { time: '14:16 UTC', label: 'Memory Threshold Exceeded', detail: 'Allocated memory crossed 85% safety boundary' },
      { time: '14:18 UTC', label: 'Auto-scaled', detail: 'kr0n provisioned 2 additional worker instances' },
      { time: '14:26 UTC', label: 'Stabilized', detail: 'Memory stabilized at 72% across 4 instances' },
    ],
  },
];

export const INITIAL_BILLING = {
  plan: {
    id: 'scale',
    name: 'Scale Tier',
    price: 120,
    cycle: 'Monthly',
    period: 'Oct 1, 2026 – Oct 31, 2026',
    renewalDate: 'November 1, 2026',
    entitlements: [
      { resource: 'vCPU Compute', included: '50 vCPU-hours', used: '18.4 CPU-hours', status: 'within-limit' },
      { resource: 'Memory', included: '100 GB-hours', used: '42 GB-hours', status: 'within-limit' },
      { resource: 'Persistent Volumes', included: '1 TB Storage', used: '180 GB', status: 'within-limit' },
      { resource: 'Network Egress', included: '10 TB / mo', used: '1.2 TB', status: 'within-limit' },
      { resource: 'Build Pipeline', included: '2,000 build min', used: '842 min', status: 'within-limit' },
      { resource: 'Edge Locations', included: 'Global Anycast (34 PoPs)', used: 'Active', status: 'included' },
    ],
  },
  costBreakdown: [
    { item: 'Base Platform Subscription (Scale Tier)', amount: 120.00, desc: 'Includes all core clusters, edge routing & 24/7 observability' },
    { item: 'Metered Compute (18.4 CPU-hours @ $2.00/unit)', amount: 36.80, desc: 'Distributed across 4 active projects' },
    { item: 'Memory Consumption (42 GB-hours @ $0.50/unit)', amount: 21.00, desc: 'Dynamic microservice and worker allocation' },
    { item: 'Persistent Storage (180 GB @ $0.10/GB)', amount: 18.00, desc: '3 attached volumes' },
    { item: 'Network Egress (1.2 TB @ $20.00/TB)', amount: 24.00, desc: 'Global edge Anycast egress' },
    { item: 'Build Synthesis (842 min @ $0.02/min)', amount: 16.84, desc: 'AST container synthesis' },
  ],
  invoices: [
    { id: 'INV-2026-10-PREVIEW', date: 'Current Cycle (Oct 2026)', amount: 236.64, status: 'estimated', period: 'Oct 1 - Oct 31' },
    { id: 'INV-2026-09', date: 'Sep 30, 2026', amount: 218.40, status: 'paid', period: 'Sep 1 - Sep 30', pdfName: 'kr0n-invoice-2026-09.pdf' },
    { id: 'INV-2026-08', date: 'Aug 31, 2026', amount: 194.50, status: 'paid', period: 'Aug 1 - Aug 31', pdfName: 'kr0n-invoice-2026-08.pdf' },
    { id: 'INV-2026-07', date: 'Jul 31, 2026', amount: 182.00, status: 'paid', period: 'Jul 1 - Jul 31', pdfName: 'kr0n-invoice-2026-07.pdf' },
  ],
};

export const INITIAL_SETTINGS = {
  profile: {
    fullName: 'Gurmehar Singh',
    email: 'gurmehar@kr0n.dev',
    role: 'Admin / Engineer',
    timezone: 'UTC +05:30 (Asia/Kolkata)',
    avatarInitials: 'GS',
  },
  organization: {
    id: 'org_kr0n_labs',
    name: 'kr0n-labs',
    slug: 'kr0n-labs',
    plan: 'Scale Tier',
    created: 'August 2025',
    seatCount: '4 of 10 seats used',
  },
  members: [
    { id: 'mem_1', name: 'Gurmehar Singh', email: 'gurmehar@kr0n.dev', role: 'Owner', status: 'Active', addedAt: 'Aug 2025' },
    { id: 'mem_2', name: 'Alex Chen', email: 'alex.chen@kr0n.dev', role: 'Developer', status: 'Active', addedAt: 'Sep 2025' },
    { id: 'mem_3', name: 'Sarah Miller', email: 'sarah.m@kr0n.dev', role: 'Developer', status: 'Active', addedAt: 'Oct 2025' },
    { id: 'mem_4', name: 'Jordan Lee', email: 'jordan.lee@kr0n.dev', role: 'Viewer', status: 'Active', addedAt: 'Oct 2026' },
  ],
  github: {
    connected: true,
    account: 'kr0n-org',
    reposCount: 14,
    installationId: 'gh_app_849204',
    lastSync: '10m ago',
  },
  sessions: [
    { id: 'sess_1', device: 'Chrome on macOS (Current)', ip: '192.168.1.104', location: 'Bengaluru, IN', activeNow: true },
    { id: 'sess_2', device: 'kr0n CLI (Darwin arm64)', ip: '10.0.4.21', location: 'CLI Token Handshake', activeNow: false, lastActive: '2h ago' },
  ],
  apiTokens: [
    { id: 'tok_1', name: 'kron-cli-macbook', prefix: 'kr0n_sec_cli_••••••••', createdAt: '2026-09-01', lastUsed: '2h ago', scope: 'full-access' },
    { id: 'tok_2', name: 'github-actions-ci', prefix: 'kr0n_sec_ci_••••••••', createdAt: '2026-09-15', lastUsed: '14m ago', scope: 'deploy-only' },
  ],
  auditLog: [
    { id: 'aud_1', actor: 'gurmehar@kr0n.dev', action: 'DEPLOY_RELEASE', resource: 'svc_api (v1.8.4)', time: '14m ago', ip: '192.168.1.104' },
    { id: 'aud_2', actor: 'alex.chen@kr0n.dev', action: 'ENV_VAR_UPDATE', resource: 'DATABASE_URL (masked)', time: '1h ago', ip: '10.24.1.8' },
    { id: 'aud_3', actor: 'system-reconciler', action: 'HEALTH_CHECK_AUTO_SCALE', resource: 'svc_neb_ingest (+2 instances)', time: '42m ago', ip: 'internal' },
    { id: 'aud_4', actor: 'sarah.m@kr0n.dev', action: 'CUSTOM_DOMAIN_ATTACH', resource: 'api.coffee-orvea.com', time: '1d ago', ip: '10.24.1.15' },
    { id: 'aud_5', actor: 'gurmehar@kr0n.dev', action: 'VOLUME_ATTACH', resource: 'vol_orvea_data -> /mnt/data', time: '2d ago', ip: '192.168.1.104' },
  ],
};

// ─── STATE MANAGEMENT ──────────────────────────────────────────────

let globalState = null;
const listeners = new Set();

function loadInitialState() {
  if (typeof window === 'undefined') {
    return {
      projects: INITIAL_PROJECTS,
      deployments: INITIAL_DEPLOYMENTS,
      alerts: INITIAL_ALERTS,
      incidents: INITIAL_INCIDENTS,
      billing: INITIAL_BILLING,
      settings: INITIAL_SETTINGS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projects && parsed.deployments) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[kr0n] Failed to load localStorage state; falling back to memory fixtures', err);
  }

  return {
    projects: INITIAL_PROJECTS,
    deployments: INITIAL_DEPLOYMENTS,
    alerts: INITIAL_ALERTS,
    incidents: INITIAL_INCIDENTS,
    billing: INITIAL_BILLING,
    settings: INITIAL_SETTINGS,
  };
}

function getState() {
  if (!globalState) {
    globalState = loadInitialState();
  }
  return globalState;
}

function setState(updater) {
  const current = getState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  globalState = next;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[kr0n] Could not write to localStorage', e);
    }
  }

  listeners.forEach((l) => l(globalState));
}

export function resetDemoState() {
  const fresh = {
    projects: INITIAL_PROJECTS,
    deployments: INITIAL_DEPLOYMENTS,
    alerts: INITIAL_ALERTS,
    incidents: INITIAL_INCIDENTS,
    billing: INITIAL_BILLING,
    settings: INITIAL_SETTINGS,
  };
  setState(fresh);
}

// ─── REACT HOOK ────────────────────────────────────────────────────

export function useKr0nStore() {
  const [state, setLocalState] = useState(getState);

  useEffect(() => {
    const handleUpdate = (next) => setLocalState(next);
    listeners.add(handleUpdate);
    return () => listeners.delete(handleUpdate);
  }, []);

  // ── Project & Service Actions ──

  const addProject = useCallback((projectData) => {
    setState((prev) => {
      const newProj = {
        id: projectData.id || `proj_${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`,
        name: projectData.name,
        description: projectData.description || 'Application workspace',
        environment: projectData.environment || 'production',
        environments: [projectData.environment || 'production'],
        status: 'healthy',
        services: projectData.services || [],
        currentDeployment: {
          id: `dep_${Date.now().toString(36)}`,
          version: 'v1.0.0',
          commit: Math.random().toString(16).substring(2, 9),
          status: 'active',
          timestamp: 'Just now',
          branch: 'main',
        },
        url: `${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.kr0n.dev`,
        resources: { cpu: 15, memory: '1.0 GB' },
        deploymentCount: 1,
        updatedAt: 'Just now',
      };
      return { ...prev, projects: [newProj, ...prev.projects] };
    });
  }, []);

  const addService = useCallback((projectId, serviceData) => {
    const serviceId = serviceData.id || `svc_${serviceData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newService = {
      id: serviceId,
      name: serviceData.name,
      type: serviceData.type || 'web',
      runtime: serviceData.runtime || 'Long-running',
      runtimeLabel: serviceData.runtimeLabel || 'KR0N V8 Edge Worker',
      repository: serviceData.repository || 'github.com/kr0n-org/template-app',
      branch: serviceData.branch || 'main',
      rootDir: serviceData.rootDir || '/',
      autoDeploy: serviceData.autoDeploy ?? true,
      buildCommand: serviceData.buildCommand || 'npm run build',
      startCommand: serviceData.startCommand || 'npm run start',
      port: serviceData.port ? Number(serviceData.port) : 8080,
      url: `${serviceData.name.toLowerCase()}.${projectId.replace('proj_', '')}.kr0n.dev`,
      customDomains: [],
      resources: { cpu: '0.25 vCPU', memory: '1.0 GB', instances: 2, maxInstances: 4, minInstances: 1 },
      healthCheck: { path: '/health', port: serviceData.port ? Number(serviceData.port) : 8080, timeout: 5, interval: 10, threshold: 3, status: 'healthy', passingPercent: '100%' },
      volumes: serviceData.volume ? [serviceData.volume] : [],
      envVars: serviceData.envVars || [{ key: 'NODE_ENV', value: 'production', isSecret: false }],
    };

    const initialDep = {
      id: `dep_${Date.now().toString(36)}`,
      version: 'v1.0.0',
      commit: 'init10a',
      commitMsg: `Initial deployment of ${serviceData.name}`,
      author: 'gurmehar',
      branch: serviceData.branch || 'main',
      trigger: 'add service wizard',
      status: 'active',
      duration: '45s',
      timestamp: 'Just now',
      exactTime: new Date().toISOString(),
      artifactDigest: 'sha256:e1a90b82f0c13d4e5a6b7c8d9e0f',
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '1s', detail: 'Accepted' },
        { stage: 'Building', status: 'completed', duration: '28s', detail: 'Compiled' },
        { stage: 'Built', status: 'completed', duration: '2s', detail: 'Synthesized' },
        { stage: 'Security Checks', status: 'completed', duration: '8s', detail: 'Passed' },
        { stage: 'Planning', status: 'completed', duration: '1s', detail: 'Target ready' },
        { stage: 'Deploying', status: 'completed', duration: '3s', detail: 'Ramped' },
        { stage: 'Health Checking', status: 'completed', duration: '2s', detail: 'HTTP 200' },
        { stage: 'Ready', status: 'completed', duration: 'ongoing', detail: 'Serving' },
      ],
      security: {
        sbom: { packageCount: 28, ecosystem: 'npm', licenseCompliant: true, status: 'passed' },
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 1, scannedAt: 'Just now', status: 'passed' },
        provenance: { slsaLevel: 'Level 3', builder: 'kr0n-worker-us-east-1', verified: true, status: 'passed' },
        signature: { signedBy: 'gurmehar@kr0n.dev', keyless: true, status: 'passed' },
        admission: { policy: 'kr0n-strict-edge-v2', sandbox: 'gVisor runtime sandbox active', nonRoot: true, status: 'passed' },
      },
      logs: [
        '[00:00:01] → BUILD_INIT: worker assigned',
        '[00:00:08] → GIT_CLONE: source checked out',
        '[00:00:22] → RUN: build completed successfully',
        '[00:00:34] → SCAN: SBOM & Vulnerability checks passed',
        '[00:00:45] → ACTIVE: Service live on edge network',
      ],
    };

    setState((prev) => {
      const updatedProjects = prev.projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            services: [...p.services, newService],
            updatedAt: 'Just now',
          };
        }
        return p;
      });

      const updatedDeployments = {
        ...prev.deployments,
        [serviceId]: [initialDep],
      };

      return { ...prev, projects: updatedProjects, deployments: updatedDeployments };
    });

    return serviceId;
  }, []);

  const createEnvironment = useCallback((projectId, envName) => {
    setState((prev) => {
      return {
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id === projectId) {
            const currentEnvs = p.environments || ['production', 'staging'];
            if (!currentEnvs.includes(envName.toLowerCase())) {
              return { ...p, environments: [...currentEnvs, envName.toLowerCase()] };
            }
          }
          return p;
        }),
      };
    });
  }, []);

  const updateServiceSettings = useCallback((projectId, serviceId, updates) => {
    setState((prev) => {
      return {
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              services: p.services.map((s) => (s.id === serviceId ? { ...s, ...updates } : s)),
            };
          }
          return p;
        }),
      };
    });
  }, []);

  const deleteService = useCallback((projectId, serviceId) => {
    setState((prev) => {
      return {
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              services: p.services.filter((s) => s.id !== serviceId),
            };
          }
          return p;
        }),
      };
    });
  }, []);

  const updateProject = useCallback((projectId, updates) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteProject = useCallback((projectId) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
    }));
  }, []);

  // ── Deployment Actions ──

  const triggerDeploy = useCallback((serviceId, commitMessage = 'Manual release trigger') => {
    const depId = `dep_${Math.random().toString(16).substring(2, 9)}`;
    const newVersion = `v1.8.${Math.floor(Math.random() * 80 + 5)}`;
    const newDep = {
      id: depId,
      version: newVersion,
      commit: Math.random().toString(16).substring(2, 9),
      commitMsg: commitMessage,
      author: 'gurmehar',
      branch: 'main',
      trigger: 'manual release',
      status: 'active',
      duration: '1m 24s',
      timestamp: 'Just now',
      exactTime: new Date().toISOString(),
      artifactDigest: `sha256:${Math.random().toString(16).substring(2, 18)}...`,
      lifecycle: [
        { stage: 'Queued', status: 'completed', duration: '1s', detail: 'Accepted' },
        { stage: 'Building', status: 'completed', duration: '44s', detail: 'Compiled via kr0n BuildKit' },
        { stage: 'Built', status: 'completed', duration: '3s', detail: 'Synthesized' },
        { stage: 'Security Checks', status: 'completed', duration: '12s', detail: '0 CVEs · SLSA Level 3' },
        { stage: 'Planning', status: 'completed', duration: '2s', detail: '3 instances targeted' },
        { stage: 'Deploying', status: 'completed', duration: '8s', detail: 'Traffic shifted' },
        { stage: 'Health Checking', status: 'completed', duration: '6s', detail: '3/3 probes 200 OK' },
        { stage: 'Ready', status: 'completed', duration: '2s', detail: 'Mesh connected' },
        { stage: 'Active', status: 'completed', duration: 'ongoing', detail: 'Active' },
      ],
      security: {
        sbom: { packageCount: 42, ecosystem: 'npm', licenseCompliant: true, status: 'passed' },
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 2, scannedAt: 'Just now', status: 'passed' },
        provenance: { slsaLevel: 'Level 3', builder: 'kr0n-worker-us-east-1', verified: true, status: 'passed' },
        signature: { signedBy: 'gurmehar@kr0n.dev (Sigstore OIDC)', keyless: true, status: 'passed' },
        admission: { policy: 'kr0n-strict-edge-v2', sandbox: 'gVisor runtime sandbox active', nonRoot: true, status: 'passed' },
      },
      logs: [
        `[00:00:01] → BUILD_INIT: worker assigned for ${newVersion}`,
        '[00:00:15] → RUN: compilation complete (38s)',
        '[00:00:30] → SEC: vulnerability & signature validation passed',
        '[00:00:45] → ACTIVE: 100% traffic shifted to new release',
      ],
    };

    setState((prev) => {
      const currentList = prev.deployments[serviceId] || [];
      const updatedList = [
        newDep,
        ...currentList.map((d) => (d.status === 'active' ? { ...d, status: 'ready' } : d)),
      ];
      return {
        ...prev,
        deployments: { ...prev.deployments, [serviceId]: updatedList },
      };
    });

    return depId;
  }, []);

  const triggerRollback = useCallback((serviceId, targetDepId) => {
    setState((prev) => {
      const list = prev.deployments[serviceId] || [];
      const target = list.find((d) => d.id === targetDepId);
      if (!target) return prev;

      const rollbackDep = {
        ...target,
        id: `dep_rb_${Date.now().toString(36)}`,
        trigger: `rollback to ${target.version}`,
        status: 'active',
        timestamp: 'Just now',
        exactTime: new Date().toISOString(),
      };

      const updated = [
        rollbackDep,
        ...list.map((d) => (d.status === 'active' ? { ...d, status: 'ready' } : d)),
      ];

      return {
        ...prev,
        deployments: { ...prev.deployments, [serviceId]: updated },
      };
    });
  }, []);

  // ── Alert & Incident Actions ──

  const acknowledgeAlert = useCallback((alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a)),
    }));
  }, []);

  const resolveAlert = useCallback((alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a)),
    }));
  }, []);

  const updateIncidentStatus = useCallback((incidentId, newStatus) => {
    setState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((inc) => {
        if (inc.id === incidentId) {
          const nowStr = new Date().toTimeString().split(' ')[0].substring(0, 5) + ' UTC';
          const newEntry = { time: nowStr, label: `Status changed to ${newStatus}`, detail: `Updated by on-call engineer` };
          return {
            ...inc,
            status: newStatus,
            timeline: [...inc.timeline, newEntry],
          };
        }
        return inc;
      }),
    }));
  }, []);

  // ── Settings & Membership Actions ──

  const inviteMember = useCallback((email, role) => {
    setState((prev) => {
      const newMember = {
        id: `mem_${Date.now().toString(36)}`,
        name: email.split('@')[0],
        email,
        role: role || 'Developer',
        status: 'Active',
        addedAt: 'Just now',
      };
      return {
        ...prev,
        settings: {
          ...prev.settings,
          members: [...prev.settings.members, newMember],
        },
      };
    });
  }, []);

  const changeMemberRole = useCallback((memberId, newRole) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        members: prev.settings.members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      },
    }));
  }, []);

  const removeMember = useCallback((memberId) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        members: prev.settings.members.filter((m) => m.id !== memberId),
      },
    }));
  }, []);

  const createApiToken = useCallback((tokenName) => {
    const rawFakeToken = `kr0n_sec_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const prefix = `kr0n_sec_••••••••${rawFakeToken.slice(-4)}`;
    const newToken = {
      id: `tok_${Date.now().toString(36)}`,
      name: tokenName,
      prefix,
      createdAt: 'Just now',
      lastUsed: 'Never',
      scope: 'full-access',
    };

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        apiTokens: [newToken, ...prev.settings.apiTokens],
      },
    }));

    return rawFakeToken;
  }, []);

  const revokeApiToken = useCallback((tokenId) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        apiTokens: prev.settings.apiTokens.filter((t) => t.id !== tokenId),
      },
    }));
  }, []);

  const revokeSession = useCallback((sessionId) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        sessions: prev.settings.sessions.filter((s) => s.id !== sessionId),
      },
    }));
  }, []);

  return {
    projects: state.projects,
    deployments: state.deployments,
    alerts: state.alerts,
    incidents: state.incidents,
    billing: state.billing,
    settings: state.settings,
    addProject,
    addService,
    createEnvironment,
    updateServiceSettings,
    deleteService,
    updateProject,
    deleteProject,
    triggerDeploy,
    triggerRollback,
    acknowledgeAlert,
    resolveAlert,
    updateIncidentStatus,
    inviteMember,
    changeMemberRole,
    removeMember,
    createApiToken,
    revokeApiToken,
    revokeSession,
    resetDemoState,
  };
}
