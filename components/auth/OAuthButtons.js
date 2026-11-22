"use client";

export function GithubIcon({ className = "w-4 h-4" }) {
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

export function GoogleIcon({ className = "w-4 h-4" }) {
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

export default function OAuthButtons({ onSelectProvider, socialLoading, disabled }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelectProvider("google")}
        disabled={!!socialLoading || disabled}
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
        onClick={() => onSelectProvider("github")}
        disabled={!!socialLoading || disabled}
        className="clipped-btn w-full border border-[#242930] bg-[#111419] hover:bg-[#15191E] hover:border-[#363D47] text-white py-2.5 px-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
        <GithubIcon className="w-4 h-4" />
        <span>
          {socialLoading === "github"
            ? "Connecting..."
            : "Continue with GitHub"}
        </span>
      </button>
    </div>
  );
}
