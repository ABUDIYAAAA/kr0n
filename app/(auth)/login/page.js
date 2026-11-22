"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import {
  login,
  loginWithOAuth,
  requestPasswordReset,
  resolveAuthRedirect,
  getMe,
} from "@/lib/auth";
import { useKr0nStore } from "@/lib/kr0n-state";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const { syncAuthUser } = useKr0nStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const search =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const resetTokenParam = search?.get("token");
    if (resetTokenParam) {
      router.replace(`/reset-password?token=${encodeURIComponent(resetTokenParam)}`);
      return;
    }

    const destination = resolveAuthRedirect();

    getMe()
      .then((user) => {
        if (user) {
          router.replace(destination);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const authData = await login(email, password);
      if (authData?.user) {
        syncAuthUser(authData.user);
      }
      setSuccessMsg("Signed in successfully. Redirecting...");
      router.push(resolveAuthRedirect());
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!email) return;

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setForgotSent(true);
      setSuccessMsg(
        "Password reset instructions sent. Check your inbox for the reset link."
      );
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError("");
    setSuccessMsg("");
    setSocialLoading(provider);

    try {
      await loginWithOAuth(provider, { redirect: resolveAuthRedirect() });
    } catch (err) {
      setError(err.message || `Unable to authenticate with ${provider}.`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-wider text-white inline-block">
            KR0N
          </Link>
          <h1 className="text-xs font-mono text-[#858C95] mt-1">
            {showForgot ? "Reset your password" : "Sign in to your account"}
          </h1>
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/10 p-2.5 text-xs font-mono text-red-400 mb-4 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs font-mono text-emerald-400 mb-4 flex items-start gap-2">
            <CheckCircle size={15} className="shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {!showForgot ? (
          <>
            <OAuthButtons
              onSelectProvider={handleOAuth}
              socialLoading={socialLoading}
              disabled={isLoading}
            />

            <div className="relative flex items-center justify-center my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#242930]" />
              </div>
              <span className="relative bg-[#0D1014] px-2 text-[10px] font-mono text-[#858C95] uppercase">
                or
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
                  Email
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-[#C4C8CE]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotSent(false);
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-[11px] font-mono text-[#858C95] hover:text-white transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 pr-9 outline-none transition-colors placeholder:text-[#4E5560]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858C95] hover:text-white p-0.5"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!socialLoading}
                className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50 mt-2">
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="text-center text-xs font-mono text-[#858C95] mt-6 pt-4 border-t border-[#1A1E24]">
              <span>Don&apos;t have an account? </span>
              <Link href="/signup" className="text-white hover:underline">
                Sign up
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {!forgotSent ? (
              <form onSubmit={handleForgot} className="space-y-4">
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
                  disabled={isLoading}
                  className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50">
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-mono text-[#858C95] leading-relaxed">
                  Follow the link in your email, or enter your reset token directly on the password reset page.
                </p>
                <Link
                  href="/reset-password"
                  className="clipped-btn block w-full text-center bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors">
                  Enter Reset Token
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
                setError("");
                setSuccessMsg("");
              }}
              className="clipped-btn w-full border border-[#242930] hover:border-[#363D47] bg-[#111419] text-[#C4C8CE] hover:text-white py-2 text-xs font-mono uppercase tracking-wider transition-colors">
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
