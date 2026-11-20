"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { verifyEmail, resendVerification } from "@/lib/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendOpen, setResendOpen] = useState(false);

  const handleVerify = useCallback(async (tokenToUse) => {
    const t = tokenToUse || token;
    if (!t) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await verifyEmail(t);
      setSuccess("Your email address has been verified successfully! You can now sign in.");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      console.error("[kr0n-verify] Error:", err);
      setError(err.message || "Failed to verify email. Token may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (tokenParam) {
      const timer = setTimeout(() => {
        handleVerify(tokenParam);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tokenParam, handleVerify]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await resendVerification(email);
      setSuccess("A fresh verification email has been dispatched. Please check your inbox.");
      setResendOpen(false);
    } catch (err) {
      console.error("[kr0n-verify] Resend error:", err);
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-xl font-bold tracking-wider text-white inline-block">
          KR0N
        </Link>
        <h1 className="text-xs font-mono text-[#858C95] mt-1">
          Verify Email Address
        </h1>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 p-2.5 text-xs font-mono text-red-400 mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {success && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs font-mono text-emerald-400 mb-4 flex items-start gap-2">
          <CheckCircle size={15} className="shrink-0 mt-0.5 text-emerald-400" />
          <span className="leading-tight">{success}</span>
        </div>
      )}

      {!resendOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Verification Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from verification email"
              disabled={isLoading}
              className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50">
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#858C95]">
            <button
              type="button"
              onClick={() => {
                setResendOpen(true);
                setError("");
                setSuccess("");
              }}
              className="hover:text-white transition-colors">
              Resend verification
            </button>
            <Link href="/login" className="text-white hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Account Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={isLoading}
              className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50">
            {isLoading ? "Sending..." : "Send Verification Token"}
          </button>

          <button
            type="button"
            onClick={() => {
              setResendOpen(false);
              setError("");
              setSuccess("");
            }}
            className="clipped-btn w-full border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors">
            Back to Token Verification
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-8 text-center">
            <Loader2 size={24} className="animate-spin text-white mx-auto mb-3" />
            <p className="text-xs font-mono text-[#858C95]">Loading verification...</p>
          </div>
        }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
