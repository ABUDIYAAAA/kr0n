"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_SECTIONS, DOCS_VERSION } from "@/lib/docs-data";
import { ChevronRight, Terminal, BookOpen, Layers, Cpu, Zap } from "lucide-react";

export default function DocsSidebar({ activeSectionId = null, currentSubsections = [] }) {
  const pathname = usePathname();

  const getSectionIcon = (id) => {
    switch (id) {
      case "quick-start":
        return Zap;
      case "ai":
        return Cpu;
      case "cli":
        return Terminal;
      case "templates":
        return Layers;
      default:
        return BookOpen;
    }
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 border-r border-white/10 bg-[#090a0c] flex flex-col min-h-full">
      {/* SECTION HEADER */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            SPECIFICATION_INDEX
          </span>
          <span className="border border-white/15 px-1.5 py-0.5 text-[9px] font-mono text-white/50">
            v{DOCS_VERSION}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Architecture, compiler runtime, and developer tooling.
        </p>
      </div>

      {/* NAVIGATION TREE */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* OVERVIEW LINK */}
        <div>
          <Link
            href="/docs"
            className={`flex items-center justify-between px-3 py-2 text-xs font-mono uppercase tracking-wider transition ${
              pathname === "/docs"
                ? "bg-white/10 text-white font-bold border-l-2 border-white"
                : "text-white/50 hover:text-white hover:bg-white/[0.03]"
            }`}>
            <span>Documentation Hub</span>
            <ChevronRight size={13} className="text-white/40" />
          </Link>
        </div>

        {/* PRIMARY AREAS */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
            CORE PLATFORM DOMAINS
          </div>

          {DOCS_SECTIONS.map((sec) => {
            const Icon = getSectionIcon(sec.id);
            const isCurrent = pathname === sec.slug || activeSectionId === sec.id;

            return (
              <div key={sec.id} className="space-y-1">
                <Link
                  href={sec.slug}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs transition border-l-2 ${
                    isCurrent
                      ? "bg-white/10 text-white font-bold border-white"
                      : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"
                  }`}>
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={14} className={isCurrent ? "text-white" : "text-white/40"} />
                    <span className="truncate">{sec.title}</span>
                  </div>

                  <span className="text-[9px] font-mono text-white/30 shrink-0">
                    {sec.badge}
                  </span>
                </Link>

                {/* ACTIVE SUBSECTIONS */}
                {isCurrent && currentSubsections.length > 0 && (
                  <div className="ml-4 pl-3 border-l border-white/10 py-1 space-y-1 my-1">
                    {currentSubsections.map((sub) => (
                      <a
                        key={sub.id}
                        href={`#${sub.id}`}
                        className="block py-1 text-[11px] text-zinc-400 hover:text-white transition-colors truncate">
                        {sub.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ECOSYSTEM REFERENCE */}
        <div className="border-t border-white/10 pt-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
            INFRASTRUCTURE
          </div>

          <Link
            href="/dashboard/projects"
            className="flex items-center justify-between px-3 py-2 text-xs text-white/40 hover:text-white transition">
            <span>Spatial Workspace</span>
            <span className="text-[9px] font-mono text-white/20">CANVAS</span>
          </Link>
          <Link
            href="/dashboard/deployments"
            className="flex items-center justify-between px-3 py-2 text-xs text-white/40 hover:text-white transition">
            <span>Deployment Stream</span>
            <span className="text-[9px] font-mono text-white/20">LOGS_V1</span>
          </Link>
          <Link
            href="/usage"
            className="flex items-center justify-between px-3 py-2 text-xs text-white/40 hover:text-white transition">
            <span>Telemetry & Quotas</span>
            <span className="text-[9px] font-mono text-white/20">METRICS</span>
          </Link>
        </div>
      </nav>

      {/* FOOTER BADGE */}
      <div className="p-4 border-t border-white/10 bg-black/40 text-[10px] font-mono text-white/40 flex items-center justify-between shrink-0">
        <span>SECURITY: ENCRYPTED</span>
        <span>NODE: GLOBAL</span>
      </div>
    </aside>
  );
}
