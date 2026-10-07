'use client';

/**
 * KR0N Observability — Structured Mock Data
 *
 * Demo data for Logs, Metrics, Usage, Capacity, and Status pages.
 * Replace with real API calls when backend integration is ready.
 */

// ─── SERVICE CONTEXT ───────────────────────────────────────────────
export const MOCK_SERVICE = {
  projectId: 'proj_orvea_prod',
  projectName: 'Orvea',
  serviceId: 'svc_api',
  serviceName: 'API',
  environment: 'Production',
  url: 'api.orvea.app',
  currentDeployment: {
    id: 'dep_a83f2c1',
    version: 'v1.8.4',
    commit: 'a83f2c1',
    branch: 'main',
    status: 'live',
    timestamp: '2026-10-07T14:28:00Z',
    relativeTime: '14m ago',
    author: 'alex.chen',
  },
  instances: [
    { id: 'inst_01', name: 'inst-us-east-1a', region: 'us-east-1', status: 'healthy' },
    { id: 'inst_02', name: 'inst-us-east-1b', region: 'us-east-1', status: 'healthy' },
    { id: 'inst_03', name: 'inst-eu-west-1a', region: 'eu-west-1', status: 'healthy' },
  ],
};

// ─── LOGS ──────────────────────────────────────────────────────────
export const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

export const LOG_LEVEL_CONFIG = {
  INFO:  { color: 'text-emerald-400', bg: 'bg-emerald-400/8' },
  WARN:  { color: 'text-amber-400',   bg: 'bg-amber-400/8' },
  ERROR: { color: 'text-red-400',     bg: 'bg-red-400/8' },
  DEBUG: { color: 'text-blue-400',    bg: 'bg-blue-400/8' },
};

export const MOCK_DEPLOYMENTS = [
  { id: 'dep_a83f2c1', version: 'v1.8.4', commit: 'a83f2c1', time: '14m ago', status: 'live' },
  { id: 'dep_b94e21a', version: 'v1.8.3', commit: 'b94e21a', time: '2h ago',  status: 'live' },
  { id: 'dep_48c10fa', version: 'v1.8.2', commit: '48c10fa', time: '1d ago',  status: 'live' },
];

const LOG_MESSAGES = [
  { level: 'INFO',  method: 'GET',  path: '/api/v1/products',        status: 200, latency: 4.2 },
  { level: 'INFO',  method: 'POST', path: '/api/v1/checkout',        status: 201, latency: 18.4 },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/cart',            status: 200, latency: 6.8 },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/auth/session',    status: 200, latency: 2.1 },
  { level: 'DEBUG', method: null,   path: null, status: null, latency: null, msg: 'Connection pool warm: 12 connections ready' },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/inventory',       status: 200, latency: 8.3 },
  { level: 'WARN',  method: null,   path: null, status: null, latency: null, msg: 'Elevated response latency on /api/v1/search — p99: 142ms' },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/health',          status: 200, latency: 1.4 },
  { level: 'INFO',  method: 'POST', path: '/api/v1/orders',          status: 201, latency: 24.1 },
  { level: 'INFO',  method: null,   path: null, status: null, latency: null, msg: 'Health check passed — all probes responding' },
  { level: 'ERROR', method: 'POST', path: '/api/v1/payments/webhook', status: 500, latency: 340.2, msg: 'Stripe webhook signature validation failed' },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/products/featured', status: 200, latency: 12.6 },
  { level: 'INFO',  method: 'PUT',  path: '/api/v1/cart/items',      status: 200, latency: 9.1 },
  { level: 'DEBUG', method: null,   path: null, status: null, latency: null, msg: 'Cache invalidation completed for key: products:featured' },
  { level: 'INFO',  method: 'GET',  path: '/api/v1/recommendations', status: 200, latency: 34.8 },
];

export function generateInitialLogs(count = 30) {
  const logs = [];
  const baseTime = new Date();
  baseTime.setMinutes(baseTime.getMinutes() - count);

  for (let i = 0; i < count; i++) {
    const template = LOG_MESSAGES[i % LOG_MESSAGES.length];
    const time = new Date(baseTime.getTime() + i * 2200);
    const timeStr = time.toTimeString().split(' ')[0] + '.' + String(time.getMilliseconds()).padStart(3, '0');

    let message;
    if (template.method) {
      message = `${template.method} ${template.path} ${template.status} ${template.latency}ms`;
    } else {
      message = template.msg;
    }

    logs.push({
      id: `log_${i}_${Date.now()}`,
      time: timeStr,
      level: template.level,
      message,
      method: template.method,
      path: template.path,
      status: template.status,
      latency: template.latency,
      deployment: 'v1.8.4',
      instance: MOCK_SERVICE.instances[i % 3].name,
    });
  }
  return logs;
}

export function generateStreamLog() {
  const template = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  const jitteredLatency = template.latency ? +(template.latency * (0.7 + Math.random() * 0.6)).toFixed(1) : null;

  let message;
  if (template.method) {
    message = `${template.method} ${template.path} ${template.status} ${jitteredLatency}ms`;
  } else {
    message = template.msg;
  }

  return {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    time: timeStr,
    level: template.level,
    message,
    method: template.method,
    path: template.path,
    status: template.status,
    latency: jitteredLatency,
    deployment: 'v1.8.4',
    instance: MOCK_SERVICE.instances[Math.floor(Math.random() * 3)].name,
  };
}


// ─── METRICS ───────────────────────────────────────────────────────
function generateTimeSeries(points, baseValue, variance, trend = 0) {
  const data = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points; // 24h spread

  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * interval;
    const noise = (Math.random() - 0.5) * variance;
    const trendValue = trend * (i / points);
    data.push({
      time: t,
      value: Math.max(0, baseValue + noise + trendValue),
    });
  }
  return data;
}

export const MOCK_METRICS = {
  requests: {
    label: 'Requests',
    unit: 'req/min',
    total: '24.8k',
    change: '+12%',
    changeDirection: 'up',
    data: generateTimeSeries(96, 260, 80, 20),
  },
  latency: {
    label: 'Latency',
    unit: 'ms',
    total: '18ms',
    sublabel: 'p50',
    p99: '142ms',
    change: '+3ms',
    changeDirection: 'up',
    data: generateTimeSeries(96, 18, 8, 2),
  },
  errors: {
    label: 'Errors',
    unit: 'errors/hr',
    total: '0.4%',
    change: '-0.1%',
    changeDirection: 'down',
    data: generateTimeSeries(96, 4, 6, -1),
  },
  cpu: {
    label: 'CPU',
    unit: '%',
    total: '34%',
    change: '-2%',
    changeDirection: 'down',
    data: generateTimeSeries(96, 34, 12, -2),
  },
  memory: {
    label: 'Memory',
    unit: 'GB',
    total: '1.8 GB',
    change: '+0.2 GB',
    changeDirection: 'up',
    data: generateTimeSeries(96, 1.8, 0.4, 0.2),
  },
  network: {
    label: 'Network I/O',
    unit: 'MB/s',
    total: '48 MB/s',
    change: '+8%',
    changeDirection: 'up',
    data: generateTimeSeries(96, 48, 15, 4),
  },
};

export const DEPLOYMENT_MARKERS = [
  { time: Date.now() - 14 * 60 * 1000, version: 'v1.8.4', commit: 'a83f2c1', status: 'live', author: 'alex.chen' },
  { time: Date.now() - 2 * 60 * 60 * 1000, version: 'v1.8.3', commit: 'b94e21a', status: 'live', author: 'sarah.m' },
  { time: Date.now() - 18 * 60 * 60 * 1000, version: 'v1.8.2', commit: '48c10fa', status: 'live', author: 'gurmehar' },
];

export const MOCK_TRACES = [
  {
    id: 'trace_01',
    name: 'POST /api/v1/checkout',
    duration: '184ms',
    status: 'ok',
    spans: 8,
    timestamp: '14:38:02',
    services: ['api', 'payments', 'inventory'],
  },
  {
    id: 'trace_02',
    name: 'GET /api/v1/products',
    duration: '12ms',
    status: 'ok',
    spans: 3,
    timestamp: '14:37:58',
    services: ['api', 'cache'],
  },
  {
    id: 'trace_03',
    name: 'POST /api/v1/payments/webhook',
    duration: '340ms',
    status: 'error',
    spans: 5,
    timestamp: '14:36:41',
    services: ['api', 'payments'],
  },
  {
    id: 'trace_04',
    name: 'GET /api/v1/recommendations',
    duration: '89ms',
    status: 'ok',
    spans: 6,
    timestamp: '14:35:12',
    services: ['api', 'ml-engine', 'cache'],
  },
  {
    id: 'trace_05',
    name: 'PUT /api/v1/cart/items',
    duration: '24ms',
    status: 'ok',
    spans: 4,
    timestamp: '14:34:50',
    services: ['api', 'cart'],
  },
];


// ─── USAGE ─────────────────────────────────────────────────────────
export const MOCK_USAGE = {
  period: 'October 2026',
  resources: [
    {
      id: 'compute',
      label: 'Compute',
      used: 18.4,
      quota: 25,
      unit: 'CPU-hours',
      previousPeriod: 16.2,
      projects: [
        { name: 'Orvea', usage: 8.2 },
        { name: 'Atlas', usage: 4.1 },
        { name: 'Nebula', usage: 3.8 },
        { name: 'Herald', usage: 2.3 },
      ],
    },
    {
      id: 'memory',
      label: 'Memory',
      used: 42,
      quota: 80,
      unit: 'GB-hours',
      previousPeriod: 38,
      projects: [
        { name: 'Nebula', usage: 18.4 },
        { name: 'Orvea', usage: 12.8 },
        { name: 'Atlas', usage: 6.2 },
        { name: 'Herald', usage: 4.6 },
      ],
    },
    {
      id: 'storage',
      label: 'Persistent Storage',
      used: 180,
      quota: 500,
      unit: 'GB',
      previousPeriod: 162,
      projects: [
        { name: 'Orvea', usage: 82 },
        { name: 'Nebula', usage: 54 },
        { name: 'Atlas', usage: 28 },
        { name: 'Herald', usage: 16 },
      ],
    },
    {
      id: 'network',
      label: 'Network Egress',
      used: 1.2,
      quota: 5,
      unit: 'TB',
      previousPeriod: 0.9,
      projects: [
        { name: 'Orvea', usage: 0.52 },
        { name: 'Nebula', usage: 0.38 },
        { name: 'Atlas', usage: 0.18 },
        { name: 'Herald', usage: 0.12 },
      ],
    },
    {
      id: 'builds',
      label: 'Build Minutes',
      used: 842,
      quota: 2000,
      unit: 'minutes',
      previousPeriod: 680,
      projects: [
        { name: 'Orvea', usage: 340 },
        { name: 'Nebula', usage: 280 },
        { name: 'Atlas', usage: 142 },
        { name: 'Herald', usage: 80 },
      ],
    },
  ],
};

export const MOCK_QUOTA_WARNING = {
  active: false,
  type: 'memory',
  message: 'Project memory quota approaching limit.',
  current: '7.8 GB',
  limit: '8 GB',
  required: '+2 GB',
};


// ─── CAPACITY ──────────────────────────────────────────────────────
export const MOCK_CAPACITY = {
  resources: [
    { id: 'compute', label: 'Compute', available: 6.6, total: 25, unit: 'CPU-hours', pressure: 'normal' },
    { id: 'memory', label: 'Memory', available: 38, total: 80, unit: 'GB', pressure: 'normal' },
    { id: 'storage', label: 'Storage', available: 320, total: 500, unit: 'GB', pressure: 'normal' },
    { id: 'network', label: 'Network', available: 3.8, total: 5, unit: 'TB', pressure: 'normal' },
  ],
  consumers: [
    { name: 'Orvea', percentage: 32, services: 3 },
    { name: 'Nebula', percentage: 24, services: 4 },
    { name: 'Atlas', percentage: 21, services: 2 },
    { name: 'Herald', percentage: 12, services: 2 },
  ],
  warnings: [],
};


// ─── STATUS ────────────────────────────────────────────────────────
export const MOCK_STATUS = {
  overall: 'operational',
  systems: [
    { id: 'api', name: 'API Gateway', status: 'operational', uptime: '99.98%' },
    { id: 'deployments', name: 'Deployments', status: 'operational', uptime: '99.95%' },
    { id: 'builds', name: 'Build Pipeline', status: 'operational', uptime: '99.92%' },
    { id: 'logs', name: 'Log Ingestion', status: 'operational', uptime: '99.99%' },
    { id: 'metrics', name: 'Metrics Collection', status: 'operational', uptime: '99.97%' },
    { id: 'storage', name: 'Persistent Storage', status: 'operational', uptime: '99.99%' },
    { id: 'networking', name: 'Edge Network', status: 'operational', uptime: '99.99%' },
  ],
};

// Generate 90-day history for status timeline
export function generateStatusHistory(days = 90) {
  const history = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    // Most days operational, occasional incidents
    let status = 'operational';
    let incident = null;

    if (d === 12) {
      status = 'degraded';
      incident = {
        id: 'inc_01',
        title: 'Elevated API latency',
        description: 'API latency increased due to upstream database connection saturation.',
        system: 'API Gateway',
        startTime: '14:22',
        endTime: '14:33',
        duration: '11 minutes',
        severity: 'minor',
      };
    }
    if (d === 34) {
      status = 'degraded';
      incident = {
        id: 'inc_02',
        title: 'Build pipeline delays',
        description: 'Builds queuing longer than expected due to capacity constraints.',
        system: 'Build Pipeline',
        startTime: '09:15',
        endTime: '10:02',
        duration: '47 minutes',
        severity: 'minor',
      };
    }
    if (d === 58) {
      status = 'partial_outage';
      incident = {
        id: 'inc_03',
        title: 'Deployment service interruption',
        description: 'New deployments temporarily unavailable. Running services unaffected.',
        system: 'Deployments',
        startTime: '03:41',
        endTime: '04:18',
        duration: '37 minutes',
        severity: 'major',
      };
    }

    history.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status,
      incident,
    });
  }

  return history;
}

export const STATUS_STATE_CONFIG = {
  operational:    { label: 'Operational',     color: 'text-emerald-400', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
  degraded:       { label: 'Degraded',        color: 'text-amber-400',   dot: 'bg-amber-400',   bar: 'bg-amber-400' },
  partial_outage: { label: 'Partial Outage',  color: 'text-red-400',     dot: 'bg-red-400',     bar: 'bg-red-400' },
  major_outage:   { label: 'Major Outage',    color: 'text-red-500',     dot: 'bg-red-500',     bar: 'bg-red-500' },
};
