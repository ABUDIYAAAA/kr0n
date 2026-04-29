"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../sidebar/page";
import {
  Search,
  ChevronDown,
  Check,
  X,
  BarChart3,
  Terminal,
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();

  const projects = [
    "watch-wise",
    "sast-assignments-mdoe",
    "sast-assignments-eoe7",
    "sast-assignments-r6ui",
    "sast-assignments",
    "sast-assignment-arpit",
  ];

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // null = All Projects
  const [openDropdown, setOpenDropdown] = useState(false);

  // 🔍 Search filter
  const filteredProjects = projects.filter((p) =>
    p.toLowerCase().includes(search.trim().toLowerCase()),
  );

  // 🎯 Selection filter (for display)
  const visibleProjects = selected
    ? filteredProjects.filter((p) => p === selected)
    : filteredProjects;

  return (
    <div className="flex min-h-screen bg-[#0d0e0f] text-[#e3e2e2]">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex flex-col flex-1">
        {/* TOP NAV */}
        <header className="flex justify-between items-center px-8 h-16 border-b border-white/10">
          {/* 🔽 ALL PROJECTS DROPDOWN */}
          <div className="relative flex items-center gap-2 text-xs font-mono uppercase">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-2">
              {selected || "All Projects"}
              <ChevronDown size={14} />
            </button>

            {/* ❌ CLEAR BUTTON */}
            {selected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                }}
                className="text-white/40 hover:text-white transition">
                <X size={14} />
              </button>
            )}

            {/* DROPDOWN */}
            {openDropdown && (
              <div className="absolute top-full mt-2 bg-[#111] border border-white/10 text-xs z-50 w-52">
                {projects.map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setSelected(p);
                      setOpenDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-white/10 cursor-pointer">
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CENTER TITLE */}
          <div className="text-xs font-mono uppercase tracking-widest border-b border-white pb-1">
            Analytics
          </div>

          {/* RIGHT MENU */}
          <div className="text-white/40">•••</div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-[480px] flex flex-col items-center">
            {/* ICON */}
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center mb-8 bg-white/5">
              <BarChart3 size={28} className="text-white/80" />
            </div>

            {/* TITLE */}
            <div className="text-center mb-10">
              <h1 className="text-xl font-semibold uppercase">
                Continue to Analytics
              </h1>
              <p className="text-white/40 text-sm">
                Choose a project to continue
              </p>
            </div>

            {/* BOX */}
            <div className="w-full border border-white/10 bg-white/5 p-1">
              {/* SEARCH */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find Project..."
                    className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-xs font-mono focus:outline-none focus:border-white/40 placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* LIST */}
              <div className="max-h-[320px] overflow-hidden">
                {visibleProjects.length === 0 && (
                  <div className="text-center py-6 text-white/40 text-xs">
                    No projects found
                  </div>
                )}

                {visibleProjects.map((project) => (
                  <button
                    key={project}
                    onClick={() => {
                      setSelected(project);
                      router.push(
                        `/dashboard/analytics/projectanalysis?project=${encodeURIComponent(project)}`,
                      );
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-left ${
                      selected === project
                        ? "bg-white/10 border-l-4 border-white text-white"
                        : "hover:bg-white/5 border-l-4 border-transparent text-white/60 hover:text-white"
                    }`}>
                    <div className="w-8 h-8 border border-white/10 flex items-center justify-center">
                      <Terminal size={14} className="text-white/60" />
                    </div>

                    <span className="text-xs font-mono uppercase tracking-wider">
                      {project}
                    </span>

                    {selected === project && (
                      <Check size={14} className="ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              {/* FOOTER BUTTON */}
              <div className="p-6 border-t border-white/10 text-center">
               
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
