"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

const NETWORKING_LINKS = [
  "Fast Data Transfer",
  "Fast Origin Transfer",
  "Edge Requests",
  "Edge Request CPU Duration",
  "Microfrontends Routing",
];

export default function UsageNavSidebar() {
  const [netOpen, setNetOpen] = useState(true);
  const [isrOpen, setIsrOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);

  return (
    <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b]">
      <div className="shrink-0 border-b border-white/10 p-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            readOnly
            placeholder="Find…"
            className="w-full cursor-default border border-white/12 bg-black/50 py-2 pl-9 pr-10 text-[11px] font-mono uppercase tracking-wider text-white/50 outline-none"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 px-1.5 py-0.5 text-[9px] font-mono text-white/35">
            F
          </kbd>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain text-sm">
        <div className="border-b border-white/10 px-1 py-2">
          <div className="px-3 py-2 text-white bg-white/5 font-medium">Usage</div>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-white/45 transition hover:bg-white/[0.04] hover:text-white">
            Overview
          </button>

          <button
            type="button"
            onClick={() => setNetOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-white/80 hover:bg-white/[0.04]">
            Networking
            {netOpen ? (
              <ChevronDown size={14} className="text-white/40" />
            ) : (
              <ChevronRight size={14} className="text-white/40" />
            )}
          </button>
          {netOpen ? (
            <div className="pb-2 pl-2">
              {NETWORKING_LINKS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="w-full border-l-2 border-transparent py-1.5 pl-3 text-left text-[11px] font-mono uppercase tracking-wide text-white/45 hover:border-white/30 hover:text-white/85">
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsrOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-white/55 hover:bg-white/[0.04] hover:text-white">
            Incremental Static Regeneration
            {isrOpen ? (
              <ChevronDown size={14} className="text-white/40" />
            ) : (
              <ChevronRight size={14} className="text-white/40" />
            )}
          </button>
          {isrOpen ? (
            <div className="space-y-1 pb-2 pl-5">
              {["Reads", "Writes"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="block w-full py-1 text-left text-[11px] font-mono uppercase text-white/40 hover:text-white/70">
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setCacheOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-white/55 hover:bg-white/[0.04] hover:text-white">
            Data Cache
            {cacheOpen ? (
              <ChevronDown size={14} className="text-white/40" />
            ) : (
              <ChevronRight size={14} className="text-white/40" />
            )}
          </button>
          {cacheOpen ? (
            <div className="space-y-1 pb-2 pl-5">
              {["Reads", "Writes"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="block w-full py-1 text-left text-[11px] font-mono uppercase text-white/40 hover:text-white/70">
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
