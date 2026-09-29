"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Zap,
  Cpu,
  Terminal,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Globe,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { DOCS_SECTIONS, DOCS_VERSION, DOCS_PROTOCOL } from "@/lib/docs-data";

export default function DocsLandingPage() {
  const [searchFilter, setSearchFilter] = useState("");

  const filteredCards = DOCS_SECTIONS.filter((sec) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.shortDesc.toLowerCase().includes(q) ||
      sec.badge.toLowerCase().includes(q) ||
      sec.subsections.some((s) => s.title.toLowerCase().includes(q))
    );
  });

  return (
    <main className="relative flex-1 bg-[#090a0c] text-white overflow-hidden pb-24">
      {/* BACKGROUND TECHNICAL GRID */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-white/[0.04] to-transparent blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* EYEBROW */}
          <div className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-white/70">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span>DOCUMENTATION // {DOCS_PROTOCOL}</span>
            <span className="text-white/20">|</span>
            <span className="text-white/40">v{DOCS_VERSION}</span>
          </div>

          {/* HEADLINE */}
          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-[1.08] text-white">
            Precision Infrastructure <br />
            <span className="text-white/60">& Runtime Architecture</span>
          </h1>

          {/* DESCRIPTION */}
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Technical guides, compiler specifications, and CLI workflows for the kr0n
            zero-configuration edge deployment platform.
          </p>

          {/* QUICK SEARCH BAR */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative group">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter documentation areas or search keywords..."
                className="w-full bg-[#0d0e11] border border-white/15 hover:border-white/30 focus:border-white pl-11 pr-24 py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 font-mono outline-none transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/40">
                  FILTER
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR FEATURED CARDS GRID */}
      <section className="relative px-6 sm:px-12 max-w-7xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-white" />
            <h2 className="text-xs sm:text-sm font-mono uppercase tracking-widest text-white/70">
              CORE DOCUMENTATION MODULES
            </h2>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            SHOWING {filteredCards.length} OF {DOCS_SECTIONS.length}
          </span>
        </div>

        {/* 4 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCards.map((sec, index) => {
            const isQuick = sec.id === "quick-start";
            const isAi = sec.id === "ai";
            const isCli = sec.id === "cli";
            const isTemplates = sec.id === "templates";

            return (
              <Link
                key={sec.id}
                href={sec.slug}
                className="group relative border border-white/10 bg-[#0d0f12] p-8 sm:p-10 transition-all duration-300 hover:border-white/30 hover:bg-[#111317] flex flex-col justify-between overflow-hidden">
                {/* CORNER GEOMETRY ACCENT */}
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-6 h-6 bg-white/5 group-hover:bg-white/15 transition-colors origin-top-right rotate-45 transform" />
                </div>

                {/* CARD HEADER */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      {/* ICON WITH SUBTLE EMBEDDED IDENTITY */}
                      <div className="w-10 h-10 border border-white/15 bg-white/5 flex items-center justify-center text-white group-hover:border-white/40 group-hover:bg-white/10 transition-all">
                        {isQuick && <Zap size={18} className="text-white" />}
                        {isAi && <Cpu size={18} className="text-white" />}
                        {isCli && <Terminal size={18} className="text-white" />}
                        {isTemplates && <Layers size={18} className="text-white" />}
                      </div>

                      <span className="border border-white/10 px-2 py-0.5 text-[9px] font-mono text-white/50 tracking-wider">
                        MOD_0{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-widest text-white/30">
                        {sec.latency}
                      </span>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {/* EYEBROW & TITLE */}
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                    {sec.eyebrow}
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-3 group-hover:text-white transition-colors">
                    {sec.title}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans mb-6">
                    {sec.shortDesc}
                  </p>
                </div>

                {/* CARD FOOTER WITH SUBSECTIONS PREVIEW */}
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {sec.subsections.slice(0, 3).map((sub) => (
                      <span
                        key={sub.id}
                        className="border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] font-mono text-white/50">
                        {sub.title.replace(/^\d+\.\s*/, "")}
                      </span>
                    ))}
                    {sec.subsections.length > 3 && (
                      <span className="text-[10px] font-mono text-white/30 pt-0.5">
                        +{sec.subsections.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/60 group-hover:text-white shrink-0 group-hover:translate-x-1 transition-all">
                    <span>EXPLORE SPEC</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PLATFORM ARCHITECTURE MATRIX */}
      <section className="relative px-6 sm:px-12 max-w-7xl mx-auto pt-24">
        <div className="border border-white/10 bg-[#0c0d10] p-8 sm:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-2">
                Unified Edge Runtime Specifications
              </h2>
            </div>
            <p className="text-xs font-mono text-white/50 max-w-md">
              Zero cold-start guarantees, immutable artifacts, and end-to-end telemetry
              orchestrated across 300+ edge access points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Globe size={16} />
                <h4 className="text-sm font-bold uppercase tracking-wider">Edge Mesh</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Global Anycast routing dispatches traffic to the geographically nearest compute cluster with under 15ms TTFB.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Cpu size={16} />
                <h4 className="text-sm font-bold uppercase tracking-wider">AST Pruning</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Compiler decomposes modules into optimal WebAssembly and edge execution chunks, removing dead code paths.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Shield size={16} />
                <h4 className="text-sm font-bold uppercase tracking-wider">Secret Vault</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                AES-256 encrypted environment variables injected dynamically into runtime memory without persistence on disk.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Activity size={16} />
                <h4 className="text-sm font-bold uppercase tracking-wider">Build Stream V1</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Real-time WebSocket streaming of build execution, dependency resolution, and edge propagation logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK COMMAND TERMINAL STRIP */}
      <section className="relative px-6 sm:px-12 max-w-7xl mx-auto pt-16">
        <div className="border border-white/10 bg-black/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Terminal size={16} className="text-white/60 shrink-0" />
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase text-white/40 tracking-wider">
                QUICK CLI LAUNCH
              </div>
              <div className="text-white font-bold tracking-tight">
                $ kron import --local &amp;&amp; kron deploy --prod
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/docs/cli"
              className="text-white/60 hover:text-white underline underline-offset-4 tracking-wider uppercase text-[11px]">
              View All CLI Flags →
            </Link>
            <Link
              href="/docs/quick-start"
              className="bg-white text-black font-bold px-4 py-2 uppercase tracking-wider text-[11px] clipped-button hover:bg-zinc-200 transition">
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
