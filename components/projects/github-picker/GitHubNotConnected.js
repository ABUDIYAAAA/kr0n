'use client';

import { Loader2, AlertCircle } from 'lucide-react';

export default function GitHubNotConnected({
  accountEmail,
  connectError,
  connecting,
  connectGitHubApp,
  manualInstallId,
  setManualInstallId,
  linkExistingInstallation,
}) {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Import Git Repository</h1>

      <div className="border border-[#222222] bg-[#0c0c0c] rounded-xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
        {/* GitHub Octocat Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white mx-auto flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Connect your GitHub account
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {accountEmail ? (
              <>
                You are signed in with <span className="text-white font-medium">{accountEmail}</span>.
                To view and import your repositories, connect your GitHub account.
              </>
            ) : (
              'Connect your GitHub account or organization to import repositories and trigger deployments.'
            )}
          </p>
        </div>

        {connectError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center justify-center gap-2 max-w-md mx-auto">
            <AlertCircle size={14} className="shrink-0" />
            <span>{connectError}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={connecting}
            onClick={connectGitHubApp}
            className="bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-md hover:bg-neutral-200 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting to GitHub…</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Connect GitHub</span>
              </>
            )}
          </button>
        </div>

        {/* Manual Completion Box */}
        <div className="pt-4 border-t border-[#1c1c1c] max-w-md mx-auto space-y-2 text-left">
          <span className="block text-xs text-neutral-400 font-medium">
            Already installed the app on GitHub? Complete setup below:
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Installation ID or URL (e.g. 184229460)"
              value={manualInstallId}
              onChange={(e) => setManualInstallId(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#222222] focus:border-[#444444] rounded px-3 py-2 text-xs text-white outline-none font-mono"
            />
            <button
              type="button"
              disabled={connecting || !manualInstallId.trim()}
              onClick={() => linkExistingInstallation(manualInstallId)}
              className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              {connecting ? 'Linking…' : 'Link App'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 font-mono">
          Only repositories you grant access to will be synchronized.
        </p>
      </div>
    </div>
  );
}
