/**
 * KR0N Control-Plane HTTP Client Module
 *
 * Deep module placed at the `/api/v1` HTTP seam.
 * All authentication tokens (`access_token`, `refresh_token`) and OAuth PKCE verifiers
 * are managed by the backend gateway via HttpOnly cookies (`credentials: 'include'`).
 */

export function parseApiError(status, data, fallbackMessage) {
  const message =
    data?.message ||
    data?.error ||
    data?.details?.[0]?.message ||
    fallbackMessage ||
    `Request failed with status ${status}`;

  const error = new Error(message);
  error.status = status;
  error.code = data?.code;
  error.details = data?.details;
  if (status === 429) {
    error.rateLimited = true;
  }
  return error;
}

export function validatePasswordPolicy(password) {
  if (typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password must be at least 8 characters.',
    };
  }
  const codePointLength = [...password].length;
  const byteLength = new TextEncoder().encode(password).length;
  if (codePointLength < 8 || byteLength < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters.',
    };
  }
  if (byteLength > 72) {
    return {
      valid: false,
      error: 'Password cannot exceed 72 UTF-8 bytes.',
    };
  }
  return { valid: true, error: null };
}

export function validateDisplayNamePolicy(displayName) {
  if (typeof displayName !== 'string') {
    return { valid: false, error: 'Display name is required.' };
  }
  const trimmed = displayName.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Display name is required.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Display name cannot exceed 100 characters.' };
  }
  return { valid: true, error: null };
}

export function getSafeRedirect(raw, fallback = '/dashboard') {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  // Reject control characters or embedded protocol schemes after leading slash
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

const NO_REFRESH_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/resend-verification',
  '/api/v1/auth/password-reset/request',
  '/api/v1/auth/password-reset/confirm',
]);

export function createApiClient({
  fetchImpl = (...args) => globalThis.fetch(...args),
  onUnauthorized = () => {},
} = {}) {
  let refreshInFlight = null;

  async function refreshSession() {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      const res = await fetchImpl('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onUnauthorized();
        throw parseApiError(res.status, data, 'Session expired. Please sign in again.');
      }
      return data;
    })().finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  }

  async function apiRequest(path, options = {}) {
    const {
      skipRefresh = false,
      rawResponse = false,
      headers: customHeaders = {},
      body,
      ...restOptions
    } = options;

    const cleanPath = path.split('?')[0];
    const shouldAttemptRefresh = !skipRefresh && !NO_REFRESH_PATHS.has(cleanPath);

    const headers = {
      Accept: 'application/json',
      ...customHeaders,
    };

    let serializedBody = body;
    if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      serializedBody = JSON.stringify(body);
    } else if (typeof body === 'string' && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const requestInit = {
      ...restOptions,
      credentials: 'include',
      headers,
      ...(serializedBody !== undefined ? { body: serializedBody } : {}),
    };

    let res = await fetchImpl(path, requestInit);

    if (res.status === 401 && shouldAttemptRefresh) {
      try {
        await refreshSession();
        res = await fetchImpl(path, requestInit);
      } catch {
        // Refresh failed; fall through to return/throw the 401 response below
      }
    }

    if (rawResponse) {
      return res;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && shouldAttemptRefresh) {
        onUnauthorized();
      }
      throw parseApiError(res.status, data);
    }

    return data;
  }

  return {
    apiRequest,
    refreshSession,
  };
}
