"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import {
  register,
  login,
  loginWithOAuth,
  resolveAuthRedirect,
  validateDisplayNamePolicy,
  validatePasswordPolicy,
  getMe,
} from "@/lib/auth";
import { useKr0nStore } from "@/lib/kr0n-state";
import OAuthButtons from "@/components/auth/OAuthButtons";

export default function SignupPage() {
  const router = useRouter();
  const { syncAuthUser } = useKr0nStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
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

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    const nameCheck = validateDisplayNamePolicy(name);
    if (!nameCheck.valid) {
      setError(nameCheck.error);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.valid) {
      setError(passCheck.error);
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);

      try {
        const authData = await login(email, password);
        if (authData?.user) {
          syncAuthUser(authData.user);
        }
        setSuccessMsg("Account created and signed in! Redirecting...");
        router.push(resolveAuthRedirect());
      } catch (loginErr) {
        if (
          loginErr.message &&
          loginErr.message.toLowerCase().includes("verif")
        ) {
          setSuccessMsg(
            "Account created! Please verify your email before signing in."
          );
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setSuccessMsg(
            "Account registered! Please sign in with your credentials."
          );
          setTimeout(() => router.push("/login"), 1500);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
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
            Create your account
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Name
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
              className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm text-white px-3 py-2 outline-none transition-colors placeholder:text-[#4E5560]"
            />
          </div>

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
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8–72 characters"
                disabled={isLoading}
                className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 pr-9 outline-none transition-colors placeholder:text-[#4E5560]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858C95] hover:text-white p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-[#090B0E] border border-[#242930] hover:border-[#363D47] focus:border-white text-sm font-mono text-white px-3 py-2 pr-9 outline-none transition-colors placeholder:text-[#4E5560]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858C95] hover:text-white p-0.5"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }>
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!socialLoading}
            className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50 mt-2">
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-xs font-mono text-[#858C95] mt-6 pt-4 border-t border-[#1A1E24]">
          <span>Already have an account? </span>
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
