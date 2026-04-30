"use client";

import { Suspense, useEffect, useState } from "react";
import Sidebar from "@/app/dashboard/sidebar/page";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

function DeploymentDetails() {
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("project");
  const [logQuery, setLogQuery] = useState("");
  const authorParam = searchParams.get("author");
  const envParam = searchParams.get("env");
  const statusParam = searchParams.get("status");
  const buildParam = searchParams.get("build");
  const branchParam = searchParams.get("branch");
  const titleParam = searchParams.get("title");
  const hashParam = searchParams.get("hash");
  const timeParam = searchParams.get("time");
  const [activeTab, setActiveTab] = useState("deployment");
  const [openDropdown, setOpenDropdown] = useState(false);

  const [openSections, setOpenSections] = useState({
    settings: false,
    logs: false,
    summary: false,
    checks: false,
    domains: true,
  });

  const toggle = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const projects = ["watch-wise", "sast-assignments", "core-engine"];
  const [selectedProject, setSelectedProject] = useState("watch-wise");

  const details = {
    repo: selectedParam || "watch-wise",
    author: authorParam || "arpit",
    env: envParam || "Production",
    status: statusParam || "Ready",
    build: buildParam || "5s",
    branch: branchParam || "main",
    title: titleParam || "feat: optimize loading",
    hash: hashParam || "f2a991b",
    time: timeParam || "2h ago",
  };

  useEffect(() => {
    if (selectedParam) {
      setSelectedProject(selectedParam);
    }
  }, [selectedParam]);

  return (
    <div className="flex bg-[#0d0e0f] text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 relative">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10">
          <div className="px-8 py-4 space-y-4 relative">
            {/* TOP ROW */}
            <div className="flex justify-between items-center">
              {/* PROJECT DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center gap-2 text-sm uppercase font-bold">
                  {selectedProject}
                  <ChevronDown size={14} />
                </button>

                {openDropdown && (
                  <div className="absolute mt-2 w-40 bg-[#111] border border-white/10 z-50">
                    {projects.map((p) => (
                      <div
                        key={p}
                        onClick={() => {
                          setSelectedProject(p);
                          setOpenDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BREADCRUMB */}
              <div className="text-xs text-white/40 uppercase">
                Deployments / <span className="text-white">{details.hash}</span>
              </div>

              <MoreHorizontal className="text-white/40" size={18} />
            </div>

            {/* TABS */}
            <div className="flex gap-6 text-xs uppercase">
              {["Deployment"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 ${
                      activeTab === tab
                        ? "border-b border-white text-white"
                        : "text-white/40 hover:text-white"
                    }`}>
                    {tab}
                  </button>
                ),
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="max-w-[1400px] mx-auto p-8 space-y-10">
          {/* MAIN CARD */}
          <div className="border border-white/10 bg-white/5 p-8">
            <div className="flex justify-between mb-8">
              <div>
                <h1 className="text-xl font-bold">Deployment Details</h1>
                <p className="text-white/40 text-xs">Ref {details.hash}</p>
              </div>

              <div className="flex gap-3">
                <button className="border border-white/20 px-4 py-1 text-xs">
                  Share
                </button>
                <button className="border border-white/20 px-4 py-1 text-xs">
                  Logs
                </button>
                <button className="bg-white text-black px-4 py-1 text-xs clipped-btn">
                  Visit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div className="aspect-video border border-white/10 bg-black/40" />

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-6">
                  <Info
                    label="Created"
                    value={`${details.author} • ${details.time}`}
                  />
                  <Info label="Status" value={details.status} green />
                  <Info label="Duration" value={details.build} />
                  <Info label="Environment" value={details.env} badge="Current" />
                </div>

                <div>
                  <Label>Domains</Label>
                  <div className="space-y-2">
                    <RowLink text={`${details.repo}.kron.app`} />
                    <RowLink text={`${details.hash}-${details.repo}.kron.app`} />
                  </div>
                </div>

                <div>
                  <Label>Source</Label>
                  <div className="text-white/80">
                    {details.branch} • {details.title}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACCORDIONS WITH SPACING */}
          <div className="space-y-4">
            {[
              { key: "settings", label: "Deployment Settings" },
              { key: "logs", label: "Build Logs" },
              { key: "summary", label: "Deployment Summary" },
              { key: "checks", label: "Deployment Checks" },
              { key: "domains", label: "Assigning Custom Domains" },
            ].map((item) => (
              <div key={item.key} className="border border-white/10">
                <div
                  onClick={() => toggle(item.key)}
                  className="flex justify-between p-4 cursor-pointer hover:bg-white/5">
                  <span className="text-sm uppercase">{item.label}</span>
                  {openSections[item.key] ? <ChevronUp /> : <ChevronDown />}
                </div>

                {openSections[item.key] && (
                  <div className="border-t border-white/10">
                    {item.key === "logs" ? (
                      <div className="bg-black/70">
                        {(() => {
                          const lines = [
                            "18:49:40.611  Running build in Washington, D.C., USA (East) - iad1",
                            "18:49:40.612  Build machine configuration: 2 cores, 8 GB",
                            "18:49:40.901  Cloning github.com/arpittripathi755/WatchWise (Branch: main, Commit: af90866)",
                            "18:49:40.903  Previous build caches not available.",
                            "18:49:43.087  Running \"vercel build\"",
                            "18:49:44.097  Vercel CLI 5.1.6",
                            "18:49:44.320  Build Completed in /vercel/output [26ms]",
                            "18:49:44.458  Deploying outputs...",
                            "18:49:45.877  Deployment completed",
                            "18:49:46.010  Creating build cache...",
                            "18:49:46.028  Skipping cache upload because no files were prepared",
                          ];
                          const filteredLines = lines.filter((line) =>
                            line.toLowerCase().includes(logQuery.trim().toLowerCase()),
                          );

                          return (
                            <>
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <div className="text-[10px] text-white/40 uppercase">
                                  {filteredLines.length} lines
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-white/40 border border-white/10 px-2 py-1">
                                  <input
                                    value={logQuery}
                                    onChange={(event) => setLogQuery(event.target.value)}
                                    placeholder="Find in logs"
                                    className="bg-transparent outline-none placeholder:text-white/30"
                                  />
                                  <span className="text-white/30 border border-white/10 px-1">
                                    CMD + F
                                  </span>
                                </div>
                              </div>

                              <div className="px-4 py-3 text-[11px] font-mono text-white/70 space-y-2">
                                {filteredLines.length === 0 && (
                                  <div className="text-white/40">No matches</div>
                                )}
                                {filteredLines.map((line) => (
                                  <div key={line} className="border-b border-white/5 pb-2">
                                    {line}
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="p-6 text-white/60 text-sm">
                        Sample expanded content
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* BOTTOM CARDS */}
          <div className="grid grid-cols-4 gap-6">
            <SmallCard title="Runtime Logs" desc="View runtime logs" />
            <SmallCard title="Observability" desc="Monitor performance" />
            <SmallCard title="Speed Insights" desc="Not Enabled" disabled />
            <SmallCard title="Web Analytics" desc="Not Enabled" disabled />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeploymentDetails />
    </Suspense>
  );
}

/* COMPONENTS */

function Info({ label, value, green, badge }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {green && <span className="w-2 h-2 bg-green-500 rounded-full" />}
        <span>{value}</span>
        {badge && <span className="text-xs bg-white/10 px-1">{badge}</span>}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs text-white/40 uppercase mb-1">{children}</div>;
}

function RowLink({ text }) {
  return (
    <div className="border border-white/10 px-3 py-2 hover:bg-white/5 cursor-pointer">
      {text}
    </div>
  );
}

function SmallCard({ title, desc, disabled }) {
  return (
    <div
      className={`border border-white/10 p-4 ${
        disabled ? "opacity-50" : "hover:border-white/30"
      }`}>
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs text-white/40">{desc}</div>
    </div>
  );
}
