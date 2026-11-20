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

export const PROJECTS = [];

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
  { id: 'capacity', label: 'Capacity', href: '/capacity', icon: 'gauge' },
  { id: 'status', label: 'Status', href: '/status', icon: 'heart-pulse' },
  { id: 'billing', label: 'Billing', href: '/billing', icon: 'credit-card' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'settings' },
];
