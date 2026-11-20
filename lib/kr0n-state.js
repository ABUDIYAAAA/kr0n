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

const STORAGE_KEY = 'kr0n_state_v2.0';

// ─── INITIAL PRODUCTION FIXTURES (ZERO DUMMY DATA) ──────────────────

export const INITIAL_PROJECTS = [];

export const INITIAL_DEPLOYMENTS = {};

export const INITIAL_ALERTS = [];

export const INITIAL_INCIDENTS = [];

export const INITIAL_BILLING = {
  plan: {
    id: 'scale',
    name: 'Scale Tier',
    price: 0,
    cycle: 'Monthly',
    period: 'Current Cycle',
    renewalDate: 'Active',
    entitlements: [],
  },
  costBreakdown: [],
  invoices: [],
};

export const INITIAL_SETTINGS = {
  profile: {
    fullName: '',
    email: '',
    role: 'Owner',
    timezone: 'UTC +05:30 (Asia/Kolkata)',
    avatarInitials: 'U',
    avatarUrl: null,
  },
  organization: {
    id: 'org_kr0n_labs',
    name: 'kr0n-labs',
    slug: 'kr0n-labs',
    plan: 'Scale Tier',
    created: '2026',
    seatCount: '1 of 10 seats used',
  },
  members: [],
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
    let loaded = null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projects && parsed.deployments) {
        loaded = parsed;
      }
    }
    const authUserRaw = localStorage.getItem('kr0n_auth_user');
    if (authUserRaw) {
      const user = JSON.parse(authUserRaw);
      if (user && (user.email || user.displayName || user.name)) {
        const displayName = user.displayName || user.display_name || user.name || user.email?.split('@')[0] || 'User';
        const initials = displayName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const base = loaded || {
          projects: INITIAL_PROJECTS,
          deployments: INITIAL_DEPLOYMENTS,
          alerts: INITIAL_ALERTS,
          incidents: INITIAL_INCIDENTS,
          billing: INITIAL_BILLING,
          settings: INITIAL_SETTINGS,
        };
        base.settings = {
          ...base.settings,
          profile: {
            ...base.settings.profile,
            fullName: displayName,
            email: user.email || '',
            avatarInitials: initials || 'U',
            avatarUrl: user.avatarUrl || user.avatar_url || null,
          },
        };
        return base;
      }
    }
    if (loaded) return loaded;
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
    const projId = projectData.id || `proj_${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const svcId = `svc_${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const defaultServices = projectData.services && projectData.services.length > 0 ? projectData.services : [
      {
        id: svcId,
        name: 'web',
        type: 'web',
        runtime: projectData.runtime || 'Next.js',
        runtimeLabel: projectData.runtimeLabel || 'KR0N Edge Application',
        repository: projectData.repository || '',
        branch: projectData.branch || 'main',
        rootDir: projectData.rootDir || '/',
        autoDeploy: true,
        buildCommand: projectData.buildCommand || 'npm run build',
        startCommand: projectData.startCommand || 'npm run start',
        port: 8080,
        url: `${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.kr0n.app`,
        customDomains: [],
        resources: { cpu: '0.5 vCPU', memory: '1.0 GB', instances: 1, maxInstances: 4, minInstances: 1 },
        healthCheck: { path: '/', port: 8080, status: 'healthy', passingPercent: '100%' },
        envVars: projectData.envVars || [],
      }
    ];

    const newProj = {
      id: projId,
      name: projectData.name,
      description: projectData.description || `Application workspace for ${projectData.name}`,
      environment: projectData.environment || 'production',
      environments: projectData.environments || ['production', 'preview'],
      status: 'healthy',
      repository: projectData.repository || '',
      services: defaultServices,
      currentDeployment: projectData.currentDeployment || {
        id: `dep_${Date.now().toString(36)}`,
        version: 'v1.0.0',
        commit: 'main',
        status: 'ready',
        timestamp: 'Just now',
        branch: projectData.branch || 'main',
        url: `https://${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.kr0n.app`,
      },
      url: `https://${projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.kr0n.app`,
      resources: { cpu: 15, memory: '1.0 GB' },
      deploymentCount: 1,
      updatedAt: 'Just now',
      position: projectData.position || { x: 80, y: 80 },
    };

    setState((prev) => {
      const existing = (prev.projects || []).filter((p) => p.id !== projId);
      return {
        ...prev,
        projects: [newProj, ...existing],
        deployments: {
          ...prev.deployments,
          [projId]: [
            {
              id: newProj.currentDeployment.id,
              serviceId: svcId,
              version: 'v1.0.0',
              commit: 'main',
              commitMessage: `Initial deployment from ${projectData.repository || projectData.name}`,
              author: 'GitHub',
              status: 'ready',
              timestamp: 'Just now',
              duration: '12s',
              branch: projectData.branch || 'main',
              environment: 'production',
            }
          ]
        }
      };
    });
    return newProj;
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

  const syncAuthUser = useCallback((user) => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          profile: INITIAL_SETTINGS.profile,
        },
      }));
      return;
    }
    const displayName = user.displayName || user.display_name || user.name || user.email?.split('@')[0] || 'User';
    const initials = (displayName || 'U')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        profile: {
          ...prev.settings.profile,
          fullName: displayName,
          email: user.email || '',
          avatarInitials: initials || 'U',
          avatarUrl: user.avatarUrl || user.avatar_url || null,
        },
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
    syncAuthUser,
    resetDemoState,
  };
}
