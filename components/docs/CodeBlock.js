"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export default function CodeBlock({
  code = "",
  language = "bash",
  filename = null,
  showLineNumbers = true,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div className="group relative my-6 overflow-hidden border border-white/10 bg-[#08090a] font-mono text-xs">
      {/* HEADER */}
      <div className="flex h-9 items-center justify-between border-b border-white/10 bg-white/[0.02] px-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
          {filename ? (
            <span className="text-[11px] text-white/60 tracking-wider">
              {filename}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <Terminal size={11} className="text-white/40" />
              {language}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/50 transition hover:bg-white/5 hover:text-white">
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* CODE BODY */}
      <div className="overflow-x-auto p-4 no-scrollbar">
        <pre className="flex leading-6 text-zinc-300">
          {showLineNumbers && (
            <div
              aria-hidden="true"
              className="select-none pr-4 text-right text-white/20 flex flex-col font-mono text-xs">
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
          )}
          <code className="flex-1 font-mono">{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
