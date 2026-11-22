'use client';

import { apiRequest } from './auth.js';

export async function githubApi(path, options = {}) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const fullPath = cleanPath.startsWith('api/v1/')
    ? `/${cleanPath}`
    : `/api/v1/${cleanPath}`;
  return apiRequest(fullPath, options);
}
