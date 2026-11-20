"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { getBackendUrl, setStoredAuth, isAuthenticated } from "@/lib/auth";
import { useKr0nStore } from "@/lib/kr0n-state";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncAuthUser } = useKr0nStore();

  const [status, setStatus] = useState("Verifying authorization handshake...");
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function processCallback() {
      // 1. Check for error parameters from OAuth provider
      const errParam = searchParams.get("error");
      const errDesc = searchParams.get("error_description");
      if (errParam) {
        if (active) {
          setError(errDesc || `Authentication failed: ${errParam}`);
        }
        return;
      }

      // 2. Check if tokens were passed directly (e.g. from a custom proxy)
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      if (accessToken) {
        if (active) {
          setStoredAuth({
            accessToken,
            refreshToken,
            expiresIn: 900,
          });
          setIsSuccess(true);
          setStatus("Authentication verified! Launching console...");
          setTimeout(() => router.replace("/projects"), 800);
        }
        return;
      }

      // 3. Check for OAuth authorization code and state
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (code) {
        if (active) {
          setStatus("Exchanging code with KR0N control plane...");
        }

        try {
          const isBrowser = typeof window !== 'undefined';
          const backendUrl = isBrowser ? '' : getBackendUrl().replace(/\/+$/, '');

          const isGoogle =
            (isBrowser && (sessionStorage.getItem('kr0n_google_oauth_state') === state || localStorage.getItem('kr0n_google_oauth_state') === state)) ||
            searchParams.get('provider') === 'google';

          const verifier = isBrowser
            ? (isGoogle
                ? (sessionStorage.getItem('kr0n_google_oauth_code_verifier') || localStorage.getItem('kr0n_google_oauth_code_verifier') || '')
                : (sessionStorage.getItem('kr0n_oauth_code_verifier') || localStorage.getItem('kr0n_oauth_code_verifier') || ''))
            : '';

          const endpoint = isGoogle ? '/api/v1/auth/google/callback' : '/api/v1/auth/github/callback';
          let callbackUrl = `${backendUrl}${endpoint}?code=${encodeURIComponent(code)}`;
          if (verifier) {
            callbackUrl += `&code_verifier=${encodeURIComponent(verifier)}`;
          }
          if (state) {
            callbackUrl += `&state=${encodeURIComponent(state)}`;
          }

          const res = await fetch(callbackUrl, {
            method: "GET",
            credentials: "include",
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.error || `OAuth completion failed with HTTP ${res.status}`);
          }

          if (data.access_token || data.user) {
            // Clean up temporary OAuth secrets
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('kr0n_oauth_code_verifier');
              localStorage.removeItem('kr0n_oauth_code_verifier');
              sessionStorage.removeItem('kr0n_oauth_state');
              sessionStorage.removeItem('kr0n_google_oauth_code_verifier');
              localStorage.removeItem('kr0n_google_oauth_code_verifier');
              sessionStorage.removeItem('kr0n_google_oauth_state');
            }

            const authPayload = {
              accessToken: data.access_token || 'cookie-session',
              refreshToken: data.refresh_token || null,
              tokenType: data.token_type || "Bearer",
              expiresIn: data.expires_in || 900,
              user: data.user ? {
                id: data.user.id,
                email: data.user.email,
                displayName: data.user.display_name,
                status: data.user.status,
              } : null,
            };

            setStoredAuth(authPayload);
            if (authPayload.user) {
              syncAuthUser(authPayload.user);
            }

            if (active) {
              setIsSuccess(true);
              setStatus("Authentication confirmed. Directing to workspace...");
              setTimeout(() => router.replace("/projects"), 800);
            }
            return;
          } else {
            throw new Error("No access token or user profile received from authentication provider.");
          }
        } catch (err) {
          console.error("[kr0n-oauth] Code exchange error:", err);
          if (active) {
            setError(err.message || "Failed to exchange GitHub authorization code.");
          }
          return;
        }
      }

      // 4. Default fallback: if no OAuth params present
      if (isAuthenticated()) {
        router.replace("/projects");
      } else {
        router.replace("/login");
      }
    }

    processCallback();

    return () => {
      active = false;
    };
  }, [searchParams, router, syncAuthUser]);

  return (
    <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-6 sm:p-8 text-center">
      <Link
        href="/"
        className="text-xl font-bold tracking-wider text-white inline-block mb-6">
        KR0N
      </Link>

      {error ? (
        <div className="space-y-4">
          <div className="border border-red-500/40 bg-red-500/10 p-3 text-xs font-mono text-red-400 flex items-start gap-2 text-left">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span className="leading-tight">{error}</span>
          </div>
          <Link
            href="/login"
            className="clipped-btn block w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors">
            Return to Sign In
          </Link>
        </div>
      ) : isSuccess ? (
        <div className="space-y-4 py-2">
          <div className="flex justify-center text-emerald-400">
            <CheckCircle size={28} />
          </div>
          <p className="text-xs font-mono text-emerald-400 font-bold tracking-wide">
            {status}
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-3">
          <div className="flex justify-center text-white/60">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
          <p className="text-xs font-mono text-[#858C95]">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-8 text-center">
            <Loader2 size={24} className="animate-spin text-white mx-auto mb-3" />
            <p className="text-xs font-mono text-[#858C95]">Loading session...</p>
          </div>
        }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
