"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { confirmPasswordReset } from "@/lib/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(token, newPassword);
      setSuccess("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error("[kr0n-reset] Error:", err);
      setError(err.message || "Failed to reset password. Token may be invalid or expired.");
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
          Set New Password
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
            Reset Token
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from reset email"
            disabled={isLoading}
            className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
            className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            disabled={isLoading}
            className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !token || !newPassword}
          className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50 mt-2">
          {isLoading ? "Updating..." : "Update Password"}
        </button>

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs font-mono text-[#858C95] hover:text-white">
            Return to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-8 text-center">
            <Loader2 size={24} className="animate-spin text-white mx-auto mb-3" />
            <p className="text-xs font-mono text-[#858C95]">Loading reset form...</p>
          </div>
        }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
