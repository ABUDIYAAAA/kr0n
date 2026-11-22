"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import {
  completeOAuthCallback,
  consumeOAuthRedirect,
  getMe,
} from "@/lib/auth";
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
      const errParam = searchParams.get("error");
      const errDesc = searchParams.get("error_description");
      if (errParam) {
        if (active) {
          setError(errDesc || `Authentication failed: ${errParam}`);
        }
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const providerParam = searchParams.get("provider");

      if (code) {
        if (active) {
          setStatus("Exchanging code with KR0N control plane...");
        }

        try {
          const { user, redirect } = await completeOAuthCallback(
            providerParam,
            code,
            state
          );
          if (user) {
            syncAuthUser(user);
          }

          if (active) {
            setIsSuccess(true);
            setStatus("Authentication confirmed. Directing to workspace...");
            setTimeout(() => router.replace(redirect), 500);
          }
          return;
        } catch (err) {
          if (active) {
            setError(err.message || "Failed to exchange OAuth authorization code.");
          }
          return;
        }
      }

      const existingUser = await getMe();
      if (!active) return;

      if (existingUser) {
        syncAuthUser(existingUser);
        router.replace(consumeOAuthRedirect("/dashboard"));
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
