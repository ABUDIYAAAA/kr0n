"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Check,
  Clock,
  ExternalLink,
  Info,
  Maximize2,
  MoreHorizontal,
  PanelRight,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProjectGlyph from "@/components/ProjectGlyph";
import UsageNavSidebar from "@/components/usage/UsageNavSidebar";
import UsageRing from "@/components/usage/UsageRing";
import { DEMO_PROJECT_SLUGS } from "@/lib/demo-data";

const TIME_PRESETS = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "Billing cycle",
];

const OVERVIEW_ROWS = [
  {
    name: "Fast Data Transfer",
    used: "21.17 kB",
    cap: "100 GB",
    pct: 0.00002 * 100,
  },
  {
    name: "Fast Origin Transfer",
    used: "0 B",
    cap: "100 GB",
    pct: 0,
  },
  {
    name: "Edge Requests",
    used: "10",
    cap: "1,000,000",
    pct: (10 / 1_000_000) * 100,
  },
  {
    name: "Edge Request CPU Duration",
    used: "0s",
    cap: "1h",
    pct: 0,
  },
  {
    name: "Microfrontends Routing",
    used: "0",
    cap: "50,000",
    pct: 0,
  },
];

/** Mock daily totals for stacked transfer chart (incoming vs outgoing, kB). */
const TRANSFER_DAILY = [
  { in: 2.1, out: 0.4 },
  { in: 1.2, out: 0.9 },
  { in: 0.8, out: 1.4 },
  { in: 3.2, out: 0.2 },
  { in: 1.5, out: 2.1 },
  { in: 2.8, out: 0.6 },
  { in: 0.9, out: 1.1 },
  { in: 2.4, out: 1.8 },
];

const EDGE_REQUEST_BARS = [0, 0, 1, 0, 2, 0, 1, 0];

const X_LABELS = [
  "Apr 5",
  "Apr 9",
  "Apr 13",
  "Apr 17",
  "Apr 21",
  "Apr 25",
  "Apr 29",
  "May 3",
];

function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex border border-white/12 bg-black/40 p-0.5">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition ${
            active === t
              ? "bg-white/10 text-white"
              : "text-white/45 hover:text-white/75"
          }`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function StackedBars({ data }) {
  const max = Math.max(0.001, ...data.map((d) => d.in + d.out));

  return (
    <div className="flex h-44 justify-between gap-0.5 border border-white/10 bg-black/30 px-2 pb-6 pt-2">
      {data.map((d, i) => {
        const hIn = (d.in / max) * 100;
        const hOut = (d.out / max) * 100;
        return (
          <div
            key={i}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-px"
            title={`${d.in} / ${d.out} kB`}>
            <div
              className="w-full min-h-[2px] bg-sky-500/90"
              style={{ height: `${hIn}%` }}
            />
            <div
              className="w-full min-h-[2px] bg-orange-500/90"
              style={{ height: `${hOut}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SimpleBlueBars({ values }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-40 justify-between gap-1 border border-white/10 bg-black/30 px-2 pb-8 pt-2">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex h-full min-w-0 flex-1 flex-col justify-end">
          <div
            className="mx-auto w-[70%] min-w-[3px] bg-sky-500"
            style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

export default function UsagePage() {
  const [project, setProject] = useState("joke-generator");
  const [menuOpen, setMenuOpen] = useState(false);
  const [preset, setPreset] = useState("Last 30 days");
  const [presetOpen, setPresetOpen] = useState(false);
  const menuRef = useRef(null);
  const [transferTab, setTransferTab] = useState("Direction");
  const [edgeTab, setEdgeTab] = useState("Count");
  const [overviewMore, setOverviewMore] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const visibleOverview = overviewMore ? OVERVIEW_ROWS : OVERVIEW_ROWS.slice(0, 3);

  return (
    <DashboardShell>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <UsageNavSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0d0e0f]">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
            <div ref={menuRef} className="relative min-w-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex max-w-[220px] items-center gap-2 truncate text-left md:max-w-[320px]">
                <ProjectGlyph />
                <span className="truncate text-sm font-bold uppercase tracking-tight text-white">
                  {project}
                </span>
                <ChevronDown size={14} className="shrink-0 text-white/45" />
              </button>
              {menuOpen ? (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 border border-white/12 bg-[#0a0a0a] py-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.85)]">
                  {DEMO_PROJECT_SLUGS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setProject(p);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-mono uppercase hover:bg-white/10 ${
                        p === project ? "text-white" : "text-white/55"
                      }`}>
                      {p === project ? (
                        <Check size={12} className="shrink-0" />
                      ) : (
                        <span className="w-3 shrink-0" />
                      )}
                      {p}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <span className="text-xs font-mono uppercase tracking-[0.2em] text-white">
              Usage
            </span>

            <button
              type="button"
              className="text-white/35 hover:text-white/65"
              aria-label="More">
              <MoreHorizontal size={18} />
            </button>
          </header>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 px-6 py-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPresetOpen((o) => !o)}
                className="flex items-center gap-2 border border-white/12 bg-black/50 px-3 py-2 text-[11px] font-mono uppercase tracking-wide text-white/80 hover:border-white/25">
                <Clock size={14} className="text-white/40" />
                {preset}
                <ChevronDown size={12} className="text-white/40" />
              </button>
              {presetOpen ? (
                <div className="absolute left-0 top-full z-40 mt-1 w-48 border border-white/12 bg-[#0a0a0a] py-1">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPreset(p);
                        setPresetOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-[11px] font-mono uppercase text-white/70 hover:bg-white/10 hover:text-white">
                      {p}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-white/45">
              <Calendar size={14} className="text-white/35" />
              Apr 3, 14:00 — May 3
            </div>

            <div className="ml-auto">
              <Link
                href="/dashboard/settings"
                className="inline-block bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black clipped-btn hover:bg-zinc-200">
                Upgrade to Pro
              </Link>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-8">
            <section className="mb-12">
              <h2 className="mb-4 text-lg font-bold uppercase tracking-tight text-white">
                Overview
              </h2>
              <div className="border border-white/10 bg-black/30">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white/40">
                  <span>Product</span>
                  <span className="text-right">Usage</span>
                </div>
                {visibleOverview.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/10 px-4 py-4 last:border-b-0">
                    <UsageRing pct={row.pct} size={40} stroke={2.5} />
                    <span className="text-sm font-medium text-white/90">
                      {row.name}
                    </span>
                    <span className="text-right text-xs font-mono text-white/55">
                      {row.used}{" "}
                      <span className="text-white/30">/</span> {row.cap}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOverviewMore((m) => !m)}
                  className="flex w-full items-center justify-center gap-1 border-t border-white/10 py-3 text-[10px] font-mono uppercase tracking-widest text-white/45 hover:bg-white/[0.04] hover:text-white/70">
                  {overviewMore ? "Show less" : "Show more"}
                  <ChevronDown
                    size={12}
                    className={overviewMore ? "rotate-180" : ""}
                  />
                </button>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold uppercase tracking-tight text-white">
                Networking
              </h2>

              <div className="mb-8 flex gap-3 border border-white/12 bg-white/[0.03] px-4 py-3">
                <Info size={16} className="mt-0.5 shrink-0 text-white/50" />
                <p className="text-sm text-white/55 leading-relaxed">
                  Top paths now live under{" "}
                  <span className="text-white/80">Observability</span> inside
                  each project. Open a project → Analytics to inspect routes and
                  latency.
                </p>
              </div>

              {/* Fast Data Transfer */}
              <article className="mb-10 border border-white/10 bg-black/35">
                <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white">
                      Fast Data Transfer
                    </h3>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/45">
                      Bytes served from the edge cache and origin.{" "}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white">
                        Learn more
                        <ExternalLink size={10} />
                      </button>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/analytics?project=${encodeURIComponent(project)}`}
                      className="flex items-center gap-2 border border-white/20 bg-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:border-white/40 hover:bg-white/[0.05]">
                      <PanelRight size={12} />
                      Open in Observability
                    </Link>
                    <button
                      type="button"
                      className="border border-white/15 p-2 text-white/45 hover:border-white/30 hover:text-white/75"
                      aria-label="Expand">
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 border-b border-white/10 px-6 py-5">
                  <UsageRing pct={0.00002 * 100} size={48} stroke={3} />
                  <div>
                    <div className="text-sm font-mono text-white/80">
                      21.17 kB{" "}
                      <span className="text-white/35">/</span> 100 GB
                    </div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">
                      Billing period
                    </div>
                  </div>
                </div>

                <div className="border-b border-white/10 px-6 py-4">
                  <SegmentedTabs
                    tabs={["Direction", "Projects", "Regions"]}
                    active={transferTab}
                    onChange={setTransferTab}
                  />
                </div>

                <div className="relative px-4 pb-4 pt-2">
                  <div className="absolute right-6 top-4 text-[10px] font-mono text-white/35">
                    Updated just now
                  </div>
                  <StackedBars data={TRANSFER_DAILY} />
                  <div className="mt-2 flex justify-between text-[10px] font-mono text-white/30">
                    {X_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-6 border-t border-white/10 pt-4 text-[11px] font-mono">
                    <span className="flex items-center gap-2 text-white/60">
                      <span className="h-2 w-2 bg-sky-500" />
                      Incoming{" "}
                      <span className="text-white/35">18.29 kB · 86.4%</span>
                    </span>
                    <span className="flex items-center gap-2 text-white/60">
                      <span className="h-2 w-2 bg-orange-500" />
                      Outgoing{" "}
                      <span className="text-white/35">2.88 kB · 13.6%</span>
                    </span>
                  </div>
                </div>
              </article>

              {/* Edge Requests */}
              <article className="mb-10 border border-white/10 bg-black/35">
                <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Edge Requests
                    </h3>
                    <p className="mt-2 max-w-xl text-xs text-white/45">
                      Function and static invocations at the edge.{" "}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white">
                        Learn more
                        <ExternalLink size={10} />
                      </button>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/analytics?project=${encodeURIComponent(project)}`}
                      className="flex items-center gap-2 border border-white/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:bg-white/[0.06]">
                      <PanelRight size={12} />
                      Open in Observability
                    </Link>
                    <button
                      type="button"
                      className="border border-white/15 p-2 text-white/45 hover:text-white/75"
                      aria-label="Expand">
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 border-b border-white/10 px-6 py-5">
                  <UsageRing pct={(10 / 1_000_000) * 100} size={48} stroke={3} />
                  <div className="text-sm font-mono text-white/80">
                    10 <span className="text-white/35">/</span> 1,000,000
                  </div>
                </div>

                <div className="border-b border-white/10 px-6 py-4">
                  <SegmentedTabs
                    tabs={["Count", "Projects", "Regions", "Blob Stores"]}
                    active={edgeTab}
                    onChange={setEdgeTab}
                  />
                </div>

                <div className="relative px-4 pb-4 pt-2">
                  <div className="absolute right-6 top-4 text-[10px] font-mono text-white/35">
                    Updated just now
                  </div>
                  <SimpleBlueBars values={EDGE_REQUEST_BARS} />
                  <div className="mt-2 flex justify-between text-[10px] font-mono text-white/30">
                    {X_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 text-[11px] font-mono text-white/55">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 bg-sky-500" />
                      Total — 10 requests
                    </span>
                  </div>
                </div>
              </article>

              {/* Edge Request CPU */}
              <article className="border border-white/10 bg-black/35">
                <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Edge Request CPU Duration
                    </h3>
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/45">
                      CPU time accrued in 10ms increments while handling edge
                      requests. Idle time between invocations is not billed.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start border border-white/15 p-2 text-white/45 hover:text-white/75"
                    aria-label="Expand">
                    <Maximize2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-6 px-6 py-6">
                  <UsageRing pct={0} size={48} stroke={3} />
                  <div className="text-sm font-mono text-white/80">
                    0s <span className="text-white/35">/</span> 1h
                  </div>
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
