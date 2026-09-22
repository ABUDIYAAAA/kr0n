"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { CheckCircle, TrendingUp } from "lucide-react";

export default function DeploymentsPage() {
  const router = useRouter();

  const today = new Date();
  const [openCal, setOpenCal] = useState(false);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(null);

  const [filters, setFilters] = useState({
    repo: "ALL",
    branch: "ALL",
    env: "ALL",
    author: "ALL",
    date: null,
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const deployments = [
    {
      id: "#8291",
      env: "PROD",
      status: "SUCCESS",
      repo: "core-engine",
      branch: "main",
      user: "arpit",
      timestamp: Date.now(),
      icon: CheckCircle,
      color: "text-emerald-500",
      build: "1M 14S",
      title: "feat: enhance refraction engine",
      hash: "72a1bc8f",
      time: "2M AGO",
    },
    {
      id: "#8290",
      env: "PREVIEW",
      status: "BUILDING",
      repo: "auth-service",
      branch: "dev",
      user: "dev",
      timestamp: Date.now(),
      icon: CheckCircle,
      color: "text-amber-400",
      build: "45S",
      title: "fix: token refresh logic",
      hash: "8ab12cd",
      time: "10M AGO",
    },
  ];

  const filtered = deployments.filter((d) => {
    if (filters.repo !== "ALL" && d.repo !== filters.repo) return false;
    if (filters.branch !== "ALL" && d.branch !== filters.branch) return false;
    if (filters.env !== "ALL" && d.env !== filters.env) return false;
    if (filters.author !== "ALL" && d.user !== filters.author) return false;

    if (filters.date) {
      const sel = new Date(filters.date).toDateString();
      const dep = new Date(d.timestamp).toDateString();
      if (sel !== dep) return false;
    }

    return true;
  });

  const btn =
    "relative bg-white/5 border border-white/20 px-3 py-1.5 clipped-corner-small hover:bg-white/10 cursor-pointer";

  const dropdown =
    "absolute mt-2 bg-[#111] border border-white/10 text-xs z-50";
  const successRate = 98.4;

  let color = "text-emerald-500";
  let border = "border-emerald-500";

  if (successRate < 90) {
    color = "text-yellow-400";
    border = "border-yellow-400";
  }
  if (successRate < 70) {
    color = "text-red-500";
    border = "border-red-500";
  }

  return (
    <DashboardShell>
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#121414] p-8 font-sans text-[#e3e2e2] pb-20 max-w-[1440px] mx-auto w-full space-y-8">
          {/* HEADER */}
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase flex items-center gap-4">
                <span className="text-[12px] font-mono text-white/50 border border-white/10 px-2 py-0.5">
                  v2.4.0-STABLE
                </span>
              </h1>
            </div>

            <button
              onClick={() => router.push("/dashboard/projects/importrepo")}
              className="bg-white text-black px-6 py-3 font-bold text-sm clipped-corner">
              NEW_DEPLOY
            </button>
          </header>

          {/* FILTERS */}
          <section className="flex justify-between border-y border-white/10 py-4">
            <div className="flex gap-2 text-[10px] font-mono uppercase">
              {/* DATE */}
              <div className="relative">
                <button onClick={() => setOpenCal(!openCal)} className={btn}>
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString()
                    : "SELECT_DATE"}
                  <span className="absolute top-0 right-0 w-2 h-2 bg-white" />
                </button>

                {openCal && (
                  <div className="absolute top-full mt-2 bg-[#111] border border-white/10 p-4 w-64 z-50">
                    <div className="flex justify-between mb-2">
                      <button onClick={() => setMonth(month - 1)}>
                        <ChevronLeft size={14} />
                      </button>

                      <span className="text-xs">
                        {new Date(year, month).toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <button onClick={() => setMonth(month + 1)}>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-[10px] text-white/40">
                      {"SMTWTFS".split("").map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-[10px]">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={i} />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(year, month, day).getTime();

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedDate(date);
                              setFilters((p) => ({ ...p, date }));
                              setOpenCal(false);
                            }}
                            className="text-center cursor-pointer hover:bg-white/10">
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DROPDOWNS */}
              {["author", "env", "repo", "branch"].map((key) => (
                <div key={key} className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === key ? null : key)
                    }
                    className={btn}>
                    {key.toUpperCase()}: {filters[key]}
                    <span className="absolute top-0 right-0 w-2 h-2 bg-white" />
                  </button>

                  {openDropdown === key && (
                    <div className={dropdown}>
                      {[
                        "ALL",
                        "core-engine",
                        "auth-service",
                        "main",
                        "dev",
                        "arpit",
                      ].map((val) => (
                        <div
                          key={val}
                          onClick={() => {
                            setFilters((p) => ({ ...p, [key]: val }));
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-2 hover:bg-white/10 cursor-pointer">
                          {val}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* STATUS */}
            <div className="flex gap-6 text-[10px] font-mono uppercase">
              <div className="flex items-center gap-2 text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500" /> SUCCESS
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <span className="w-1.5 h-1.5 bg-amber-400" /> BUILDING
              </div>
              <div className="flex items-center gap-2 text-rose-500">
                <span className="w-1.5 h-1.5 bg-rose-500" /> FAILED
              </div>
            </div>
          </section>

          {/* LIST */}
          <section className="space-y-px">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] text-white/40 uppercase">
              <div>ID</div>
              <div>ENV</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">BUILD_TIME</div>
              <div className="col-span-3">PROJECT</div>
              <div className="col-span-2">AUTHOR</div>
              <div className="text-right">AGE</div>
            </div>

            {filtered.map((d, i) => (
              <div
                key={i}
                onClick={() =>
                  router.push(
                    `/dashboard/deployments/deploymentdetails?project=${encodeURIComponent(d.repo)}&author=${encodeURIComponent(d.user)}&env=${encodeURIComponent(d.env)}&status=${encodeURIComponent(d.status)}&build=${encodeURIComponent(d.build)}&branch=${encodeURIComponent(d.branch)}&title=${encodeURIComponent(d.title)}&hash=${encodeURIComponent(d.hash)}&time=${encodeURIComponent(d.time)}`,
                  )
                }
                className="grid grid-cols-12 gap-4 px-4 py-4 bg-white/5 hover:bg-white/[0.07] border border-transparent hover:border-white/20 items-center cursor-pointer">
                <div className="font-mono text-xs">{d.id}</div>

                <div>
                  <span className="bg-neutral-800 text-[9px] px-1.5 py-0.5 border border-white/10">
                    {d.env}
                  </span>
                </div>

                <div
                  className={`col-span-2 flex items-center gap-2 ${d.color}`}>
                  <d.icon size={14} />
                  {d.status}
                </div>

                <div className="col-span-2 font-mono text-xs">{d.build}</div>

                {/* ✅ PROJECT / REPO COLUMN */}
                <div className="col-span-3">
                  <div className="text-xs font-bold">{d.repo}</div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {d.title} ({d.hash})
                  </div>
                </div>

                <div className="col-span-2 flex gap-2 items-center">
                  <div className="w-5 h-5 bg-neutral-700" />
                  <span className="text-xs uppercase">{d.user}</span>
                </div>

                <div className="text-right text-xs text-white/40">{d.time}</div>
              </div>
            ))}
          </section>

          {/* ANALYTICS */}
          <section className="grid grid-cols-3 gap-6">
            <div className="border border-white/10 p-6 space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                DEPLOYMENT_VELOCITY
              </h3>

              <div className="flex gap-1 h-24 items-end">
                {[40, 60, 30, 80, 50, 90].map((h, i) => (
                  <div
                    key={i}
                    className="bg-white/10 w-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex justify-between">
                <span className="text-2xl font-black">142</span>
                <span className="text-[10px] text-white/40">
                  TOTAL_THIS_WEEK
                </span>
              </div>
            </div>

            <div className="border border-white/10 p-6 text-center space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                SUCCESS_RATE
              </h3>

              <div className="flex justify-center">
                <div
                  className={`w-24 h-24 rounded-full border-2 ${border} flex items-center justify-center`}>
                  <span className={`text-xl font-black ${color}`}>
                    {successRate}%
                  </span>
                </div>
              </div>

              <div className="text-emerald-500 text-[10px] flex justify-center gap-1">
                <TrendingUp size={12} /> +0.4%
              </div>
            </div>

            <div className="border border-white/10 p-6 text-center space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                AVERAGE_BUILD_TIME
              </h3>

              <div className="text-3xl font-black">1M 14S</div>

              <div className="text-emerald-500 text-[10px] border border-emerald-500/20 px-3 py-1 inline-block">
                STABLE
              </div>
            </div>
          </section>
      </main>
    </DashboardShell>
  );
}
