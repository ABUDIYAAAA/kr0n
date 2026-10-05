"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true">
      <path d="M21.35 11.1h-9.17v2.96h5.27c-.23 1.21-.92 2.24-1.95 2.93v2.44h3.15c1.84-1.7 2.9-4.2 2.9-7.22 0-.38-.04-.75-.1-1.11z" />
      <path d="M12.18 21c2.62 0 4.82-.87 6.43-2.36l-3.15-2.44c-.87.58-1.98.93-3.28.93-2.52 0-4.66-1.7-5.42-3.99H3.5v2.52C5.12 18.82 8.38 21 12.18 21z" />
      <path d="M6.76 13.14c-.2-.58-.31-1.2-.31-1.84s.11-1.26.31-1.84V6.94H3.5A9.974 9.974 0 002.18 11.3c0 1.61.39 3.14 1.32 4.36l3.26-2.52z" />
      <path d="M12.18 5.71c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.99 2.8 14.79 2 12.18 2 8.38 2 5.12 4.18 3.5 7.36l3.26 2.52c.76-2.29 2.9-3.99 5.42-3.99z" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/");
  };

  const handleOAuth = async (provider) => {
    setSocialLoading(provider);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/callback");
  };

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-[#242930] bg-[#0D1014] p-6 sm:p-8">
        {/* Header */}
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

        {/* Error Notice */}
        {error && (
          <div className="border border-[#ef4444]/40 bg-[#ef4444]/10 p-2.5 text-xs font-mono text-[#ef4444] mb-4">
            {error}
          </div>
        )}

        {/* Social Buttons with clipped-btn */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!socialLoading || isLoading}
            className="clipped-btn w-full border border-[#242930] bg-[#111419] hover:bg-[#15191E] hover:border-[#363D47] text-white py-2.5 px-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <GoogleIcon className="w-4 h-4" />
            <span>
              {socialLoading === "google"
                ? "Connecting..."
                : "Continue with Google"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={!!socialLoading || isLoading}
            className="clipped-btn w-full border border-[#242930] bg-[#111419] hover:bg-[#15191E] hover:border-[#363D47] text-white py-2.5 px-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <GithubIcon className="w-4 h-4" />
            <span>
              {socialLoading === "github"
                ? "Connecting..."
                : "Continue with GitHub"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#242930]" />
          </div>
          <span className="relative bg-[#0D1014] px-2 text-[10px] font-mono text-[#858C95] uppercase">
            or
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-[#C4C8CE] mb-1">
              Name
            </label>
            <input
              type="text"
              required
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
                placeholder="••••••••"
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

          {/* Primary Action with clipped-btn */}
          <button
            type="submit"
            disabled={isLoading || !!socialLoading}
            className="clipped-btn w-full bg-white hover:bg-neutral-200 text-black py-2.5 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50 mt-2">
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer Link */}
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
