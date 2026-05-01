"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Sidebar from "../../sidebar/page";
import { useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

function AnalyticsDashboard() {
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("project");

  const projects = ["watch-wise", "sast-assignments", "core-engine"];

  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState("24H");

  const availableProjects = useMemo(() => {
    if (selectedParam && !projects.includes(selectedParam)) {
      return [selectedParam, ...projects];
    }

    return projects;
  }, [projects, selectedParam]);

  useEffect(() => {
    if (selectedParam) {
      setSelected(selectedParam);
    }
  }, [selectedParam]);

  const dataMap = {
    "24H": [380, 320, 340, 200, 280, 100, 150, 50, 120, 40, 80],
    "7D": [300, 280, 260, 240, 200, 180, 160, 140, 120, 100, 80],
    "30D": [400, 350, 300, 250, 200, 150, 100, 80, 60, 40, 20],
  };

  const points = dataMap[range].map((y, i) => `${i * 100},${y}`).join(" ");

  return (
    <div className="flex min-h-screen bg-[#0d0e0f] text-white">
      <Sidebar />

      <div className="flex flex-col flex-1">
        {/* NAVBAR */}
        <nav className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 h-16 flex items-center justify-between">
          {/* LEFT */}
          <div className="relative flex items-center gap-2 font-mono text-xs uppercase">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2">
              {selected || "All Projects"}
              <ChevronDown size={14} />
            </button>

            {selected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                }}
                className="text-white/40 hover:text-white">
                <X size={14} />
              </button>
            )}

            {open && (
              <div className="absolute top-full mt-2 bg-[#111] border border-white/10 w-44 z-50">
                {availableProjects.map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setSelected(p);
                      setOpen(false);
                    }}
                    className="px-3 py-2 hover:bg-white/10 cursor-pointer">
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CENTER */}
          <div className="text-xs font-mono uppercase tracking-widest border-b border-white pb-1">
            ANALYTICS
          </div>

          {/* RIGHT */}
          <div className="text-white/40">•••</div>
        </nav>

        {/* CONTENT */}
        <main className="max-w-[1440px] mx-auto w-full pt-24 px-8 pb-20">
          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold">{selected || "All Projects"}</h1>
            <p className="text-white/40 text-xs uppercase tracking-widest">
              Analytics Overview
            </p>
          </div>

          {/* METRICS (UPDATED TO CLIPPED) */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Visitors",
                value: "12.4K",
                change: "+4.2%",
                color: "text-emerald-500",
              },
              {
                label: "Page Views",
                value: "48.1K",
                change: "+6.1%",
                color: "text-emerald-500",
              },
              {
                label: "Bounce Rate",
                value: "32%",
                change: "-2.1%",
                color: "text-red-500",
              },
              {
                label: "Avg Session",
                value: "2m 14s",
                change: "+8%",
                color: "text-emerald-500",
              },
            ].map((m) => (
              <div key={m.label} className="relative">
                {/* OUTER BORDER (CLIPPED) */}
                <div className="clipped bg-white p-[1px]">
                  {/* INNER CARD */}
                  <div className="clipped bg-black p-6 hover:bg-black/80 transition">
                    <p className="text-[10px] text-white/50 uppercase mb-4">
                      {m.label}
                    </p>

                    <div className="flex gap-3 items-baseline">
                      <span className="text-2xl font-bold text-white">
                        {m.value}
                      </span>
                      <span className={`text-xs ${m.color}`}>{m.change}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* GRAPH */}
          <div className="border border-white/10 bg-white/5 p-8">
            <div className="flex justify-between mb-6">
              <h3 className="text-xs uppercase font-mono">Traffic Overview</h3>

              <div className="flex border border-white/10">
                {["24H", "7D", "30D"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-4 py-1.5 text-xs font-mono ${
                      range === r
                        ? "bg-white text-black"
                        : "text-white/40 hover:text-white border-l border-white/10"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] border-l border-b border-white/10 relative">
              <svg viewBox="0 0 1000 400" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  points={points}
                />
              </svg>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
