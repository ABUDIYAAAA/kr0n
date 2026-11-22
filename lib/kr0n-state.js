'use client';

/**
 * Legacy KR0N client-side mock store (retired — all mock fixtures removed).
 *
 * All live data now flows from `kr0n-backend` via:
 * - `lib/auth.js` (Auth, Sessions, Orgs, Roles, Members, Invites, Tokens, Audit)
 * - `lib/projects-api.js` (ServiceManager Presets, Projects, Build Settings)
 * - `lib/workspace-context.js` (Shared reactive Workspace store)
 */

export const INITIAL_PROJECTS = [];
export const INITIAL_DEPLOYMENTS = {};
export const INITIAL_ALERTS = [];
export const INITIAL_INCIDENTS = [];
export const INITIAL_BILLING = {
  plan: null,
  costBreakdown: [],
  invoices: [],
};
export const INITIAL_SETTINGS = {
  profile: null,
  organization: null,
  members: [],
  github: { connected: false },
  sessions: [],
  apiTokens: [],
  auditLog: [],
};
