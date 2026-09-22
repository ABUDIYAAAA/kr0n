"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RailUserFooter from "@/components/dashboard/RailUserFooter";
import ProjectGlyph from "@/components/ProjectGlyph";
import { DEMO_PROJECT_SLUGS } from "@/lib/demo-data";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  List,
  MoreHorizontal,
  Play,
  RefreshCw,
  Upload,
  Scan,
  User,
} from "lucide-react";

const TIMELINE_OPTIONS = [
  "Last 15 minutes",
  "Last hour",
  "Last 6 hours",
  "Last day",
];

const CONSOLE_LEVELS = [
  { id: "warning", label: "Warning", count: 0 },
  { id: "error", label: "Error", count: 0 },
  { id: "fatal", label: "Fatal", count: 0 },
];

const COLLAPSED_FILTERS = [
  "Resource",
  "Environment",
  "Route",
  "Request Path",
  "Status Code",
  "Request Type",
  "Host",
  "Request Method",
  "Cache",
];

function LogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project");

  const [pickerQuery, setPickerQuery] = useState("");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const [logSearch, setLogSearch] = useState("");
  const [timeline, setTimeline] = useState("Last hour");
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [levelsOpen, setLevelsOpen] = useState(true);
  const [levels, setLevels] = useState(() =>
    Object.fromEntries(CONSOLE_LEVELS.map((l) => [l.id, true])),
  );

  const filteredProjects = useMemo(
    () =>
      DEMO_PROJECT_SLUGS.filter((p) =>
        p.toLowerCase().includes(pickerQuery.trim().toLowerCase()),
      ),
    [pickerQuery],
  );

  const setProject = useCallback(
    (slug) => {
      const q = new URLSearchParams(searchParams.toString());
      if (slug) q.set("project", slug);
      else q.delete("project");
      router.replace(`/dashboard/logs${q.toString() ? `?${q}` : ""}`);
    },
    [router, searchParams],
  );

  const resetFilters = () => {
    setTimeline("Last hour");
    setLevels(
      Object.fromEntries(CONSOLE_LEVELS.map((l) => [l.id, true])),
    );
    setLogSearch("");
  };

  useEffect(() => {
    if (!projectMenuOpen) return;
    const close = (e) => {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(e.target)
      ) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [projectMenuOpen]);

  /* ---------- Project picker (no ?project) ---------- */
  if (!projectParam) {
    return (
      <DashboardShell>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-8">
            <div className="relative text-xs font-mono uppercase tracking-widest text-white/70">
              <span className="text-white/40">All Projects</span>
              <ChevronDown className="ml-1 inline size-3.5 align-middle text-white/40" />
            </div>

            <div className="text-xs font-mono uppercase tracking-[0.2em] text-white">
              Logs
            </div>

            <button
              type="button"
              className="text-white/35 hover:text-white/70"
              aria-label="More options">
              <MoreHorizontal size={18} />
            </button>
          </header>

          <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-y-contain px-6 py-16">
            <div className="w-full max-w-[480px]">
              <div className="mb-10 flex flex-col items-center text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center border border-white/12 bg-white/[0.04]">
                  <List size={22} className="text-white/75" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-bold uppercase tracking-tight text-white">
                  Continue to Logs
                </h1>
                <p className="mt-2 text-sm text-white/45">
                  Choose a project to stream and inspect runtime logs.
                </p>
              </div>

              <div className="border border-white/12 bg-black/40">
                <div className="border-b border-white/10 p-4">
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                    />
                    <input
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Find Project..."
                      className="w-full border border-white/12 bg-[#0a0a0a] py-3 pl-10 pr-4 text-xs font-mono outline-none placeholder:text-white/25 focus:border-white/35"
                    />
                  </div>
                </div>

                <div className="max-h-[min(52vh,360px)] overflow-y-auto">
                  {filteredProjects.length === 0 ? (
                    <div className="py-10 text-center text-xs text-white/40">
                      No projects match that search.
                    </div>
                  ) : (
                    filteredProjects.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setProject(name)}
                        className="group flex w-full items-center gap-4 border-l-2 border-transparent px-5 py-4 text-left text-white/55 transition-colors hover:border-white/40 hover:bg-white/[0.05] hover:text-white">
                        <ProjectGlyph />
                        <span className="text-xs font-mono uppercase tracking-wider">
                          {name}
                        </span>
                        <Check
                          size={14}
                          className="ml-auto shrink-0 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 p-4">
                  <Link
                    href="/dashboard/projects/importrepo"
                    className="flex items-center justify-center gap-2 border border-white/15 bg-white/[0.04] py-3 text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white">
                    <span className="text-base leading-none">+</span>
                    Create Project
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </DashboardShell>
    );
  }

  /* ---------- Logs workspace (?project=) ---------- */
  const hasRows = false;

  return (
    <DashboardShell>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 md:px-8">
          <div ref={projectMenuRef} className="relative min-w-0">
            <button
              type="button"
              onClick={() => setProjectMenuOpen((o) => !o)}
              className="flex max-w-[200px] items-center gap-2 truncate text-left text-sm font-bold uppercase tracking-tight text-white md:max-w-[280px]">
              <ProjectGlyph />
              <span className="truncate">{projectParam}</span>
              <ChevronDown size={14} className="shrink-0 text-white/50" />
            </button>
            {projectMenuOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-56 border border-white/12 bg-[#0a0a0a] py-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.85)]">
                {DEMO_PROJECT_SLUGS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setProject(p);
                      setProjectMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-mono uppercase hover:bg-white/10 ${
                      p === projectParam ? "text-white" : "text-white/60"
                    }`}>
                    {p === projectParam ? (
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

          <div className="text-xs font-mono uppercase tracking-[0.2em] text-white">
            Logs
          </div>

          <button
            type="button"
            className="text-white/35 hover:text-white/70"
            aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Filter rail */}
          <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b]">
            <div className="shrink-0 border-b border-white/10 p-4">
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  readOnly
                  placeholder="Filter…"
                  className="w-full cursor-default border border-white/12 bg-black/50 py-2 pl-9 pr-10 text-[11px] font-mono uppercase tracking-wider text-white/50 outline-none"
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 border border-white/15 px-1.5 py-0.5 text-[9px] font-mono text-white/35">
                  F
                </kbd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setProject(null)}
                  className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                  <ChevronLeft size={14} />
                  Logs
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                Filters
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-bold uppercase tracking-widest text-white/45 hover:text-white">
                Reset
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setTimelineOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white/80 hover:bg-white/[0.04]">
                  Timeline
                  {timelineOpen ? (
                    <ChevronDown size={14} className="text-white/40" />
                  ) : (
                    <ChevronRight size={14} className="text-white/40" />
                  )}
                </button>
                {timelineOpen ? (
                  <div className="space-y-1 border-t border-white/10 px-3 pb-3 pt-2">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTimeline(opt)}
                        className={`flex w-full items-center gap-2 border px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wide transition-colors ${
                          timeline === opt
                            ? "border-white/35 bg-white/[0.08] text-white"
                            : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"
                        }`}>
                        <span className="text-white/35">◇</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setLevelsOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white/80 hover:bg-white/[0.04]">
                  Contains Console Level
                  {levelsOpen ? (
                    <ChevronDown size={14} className="text-white/40" />
                  ) : (
                    <ChevronRight size={14} className="text-white/40" />
                  )}
                </button>
                {levelsOpen ? (
                  <div className="space-y-2 border-t border-white/10 px-4 py-3">
                    {CONSOLE_LEVELS.map(({ id, label, count }) => (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-wide text-white/65">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={levels[id]}
                            onChange={() =>
                              setLevels((prev) => ({
                                ...prev,
                                [id]: !prev[id],
                              }))
                            }
                            className="h-3.5 w-3.5 rounded-sm border border-white/25 bg-black accent-white"
                          />
                          {label}
                        </span>
                        <span className="text-white/35">{count}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              {COLLAPSED_FILTERS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center justify-between border-b border-white/10 px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wide text-white/45 hover:bg-white/[0.03] hover:text-white/70">
                  {label}
                  <ChevronRight size={14} className="text-white/30" />
                </button>
              ))}
            </div>

            <RailUserFooter />
          </aside>

          {/* Main log viewer */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0d0e0f]">
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
              <div className="flex shrink-0 items-center gap-1 text-white/35">
                <button
                  type="button"
                  className="rounded border border-transparent p-2 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/70"
                  aria-label="Actor filter">
                  <User size={16} />
                </button>
                <button
                  type="button"
                  className="rounded border border-transparent p-2 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/70"
                  aria-label="Focus selection">
                  <Scan size={16} />
                </button>
              </div>

              <div className="relative min-w-[200px] flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search logs…"
                  className="w-full border border-white/12 bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-xs font-mono outline-none placeholder:text-white/25 focus:border-white/35"
                />
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 border border-white/15 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/85 transition-colors hover:border-white/30 hover:bg-white/[0.1]">
                  <Play size={12} className="fill-white/80 text-white/80" />
                  Live
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-white/15 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/85 transition-colors hover:border-white/30 hover:bg-white/[0.1]">
                  <RefreshCw size={12} />
                  Refresh
                </button>
                <button
                  type="button"
                  className="clipped-corner-small flex items-center gap-2 border border-white/20 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-zinc-200">
                  <Upload size={12} />
                  Export
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 md:px-6">
              <div className="mb-2 flex justify-between border-b border-white/10 pb-2 text-[10px] font-mono tabular-nums text-white/30">
                {["12:48:00", "13:06:00", "13:23:30", "13:48:00"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>

              <div className="grid grid-cols-[minmax(5rem,8%)_minmax(4rem,7%)_minmax(6rem,12%)_minmax(8rem,22%)_1fr] gap-2 border-b border-white/10 px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-white/40">
                <span>Time</span>
                <span>Status</span>
                <span>Host</span>
                <span>Request</span>
                <span>Messages</span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
                {hasRows ? null : (
                  <>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center border border-white/12 bg-white/[0.03]">
                      <List size={20} className="text-white/35" />
                    </div>
                    <p className="mb-8 max-w-sm text-center text-sm text-white/45">
                      No logs found for the selected filters. Adjust the
                      timeline or console levels, or try again after new
                      traffic hits this deployment.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="clipped-btn bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-zinc-200">
                        Reset Filters
                      </button>
                      <button
                        type="button"
                        className="border border-white/20 bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/80 hover:border-white/40 hover:bg-white/[0.05] hover:text-white">
                        Refresh
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <div className="flex flex-1 items-center justify-center text-xs font-mono uppercase tracking-widest text-white/40">
            Loading…
          </div>
        </DashboardShell>
      }>
      <LogsContent />
    </Suspense>
  );
}
