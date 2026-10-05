'use client';

/**
 * KR0N Projects — Structured Mock Data
 *
 * All values are demo/illustrative data.
 * The data model follows the KR0N product hierarchy:
 * Organization → Project → Environment → Service → Deployment
 *
 * Replace with real API calls when backend integration is ready.
 */

export const PROJECTS = [
  {
    id: 'proj_orvea_prod',
    index: '01',
    group: 'ORVEA',
    name: 'Orvea',
    description: 'Coffee commerce platform',
    environment: 'production',
    status: 'healthy',
    services: [
      { id: 'svc_api', name: 'api', type: 'web' },
      { id: 'svc_web', name: 'web', type: 'web' },
      { id: 'svc_worker', name: 'worker', type: 'worker' },
    ],
    currentDeployment: {
      version: 'v1.8.4',
      commit: 'a83f2c1',
      status: 'live',
      timestamp: '2m ago',
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
    status: 'healthy',
    services: [
      { id: 'svc_api_s', name: 'api', type: 'web' },
      { id: 'svc_web_s', name: 'web', type: 'web' },
      { id: 'svc_worker_s', name: 'worker', type: 'worker' },
    ],
    currentDeployment: {
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
    status: 'healthy',
    services: [
      { id: 'svc_atlas_web', name: 'dashboard', type: 'web' },
      { id: 'svc_atlas_api', name: 'gateway', type: 'web' },
    ],
    currentDeployment: {
      version: 'v3.2.1',
      commit: '9d4e1f0',
      status: 'live',
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
    status: 'warning',
    services: [
      { id: 'svc_neb_ingest', name: 'ingest', type: 'worker' },
      { id: 'svc_neb_query', name: 'query', type: 'web' },
      { id: 'svc_neb_stream', name: 'stream', type: 'worker' },
      { id: 'svc_neb_web', name: 'dashboard', type: 'web' },
    ],
    currentDeployment: {
      version: 'v2.1.0',
      commit: 'b72c4d3',
      status: 'live',
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
    status: 'healthy',
    services: [
      { id: 'svc_herald_api', name: 'api', type: 'web' },
      { id: 'svc_herald_dispatch', name: 'dispatch', type: 'worker' },
    ],
    currentDeployment: {
      version: 'v1.0.3',
      commit: 'e5f6a2c',
      status: 'live',
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

/**
 * Status configuration — maps status IDs to display values
 */
export const STATUS_CONFIG = {
  healthy: { label: 'Healthy', color: 'emerald', dotClass: 'bg-emerald-400' },
  deploying: { label: 'Deploying', color: 'blue', dotClass: 'bg-blue-400' },
  warning: { label: 'Attention', color: 'amber', dotClass: 'bg-amber-400' },
  failed: { label: 'Failed', color: 'red', dotClass: 'bg-red-400' },
  stopped: { label: 'Stopped', color: 'gray', dotClass: 'bg-white/30' },
};

export const DEPLOYMENT_STATUS_CONFIG = {
  live: { label: 'Live', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
  deploying: { label: 'Deploying', dotClass: 'bg-blue-400', textClass: 'text-blue-400' },
  failed: { label: 'Failed', dotClass: 'bg-red-400', textClass: 'text-red-400' },
  rolled_back: { label: 'Rolled back', dotClass: 'bg-amber-400', textClass: 'text-amber-400' },
};

/**
 * Navigation items for the application shell sidebar
 */
export const APP_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', href: '/projects', icon: 'grid' },
  { id: 'alerts', label: 'Alerts', href: '/alerts', icon: 'bell', badge: 2 },
  { id: 'usage', label: 'Usage', href: '/usage', icon: 'activity' },
  { id: 'billing', label: 'Billing', href: '/billing', icon: 'credit-card' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
];
