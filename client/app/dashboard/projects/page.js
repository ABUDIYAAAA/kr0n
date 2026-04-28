"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "../page";

export default function ProjectsPage() {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const projects = [
    {
      name: "nucleus-engine",
      repo: "github.com/kron/nucleus",
      status: "Production",
      color: "bg-green-500",
    },
    {
      name: "quantum-web",
      repo: "github.com/kron/quantum",
      status: "Building",
      color: "bg-yellow-400",
    },
    {
      name: "auth-service",
      repo: "github.com/kron/auth",
      status: "Production",
      color: "bg-green-500",
    },
    {
      name: "legacy-dash",
      repo: "github.com/kron/legacy",
      status: "Inactive",
      color: "bg-black/30",
    },
  ];

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.repo.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex bg-[#0d0e0f] text-white min-h-screen">
      {/* ✅ SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1">
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur">
          <h1 className="text-xl font-bold uppercase">All Projects</h1>

          <button className="bg-white text-black px-6 py-2 text-xs font-bold clipped">
            Add New
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 grid grid-cols-12 gap-8">
          {/* PROJECTS */}
          <div className="col-span-12 lg:col-span-8">
            {/* SEARCH */}
            <div className="mb-8">
              <div className="relative group">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search projects by name or domain..."
                  className="w-full bg-[#0a0a0a] border border-white/12 px-6 py-5 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] tracking-widest text-white/80 border border-white/10 px-2 py-1">
                  CTRL + K
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
              </div>
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((p, i) => (
                <div
                  key={i}
                  className="
                    group
                    clipped
                    border border-white/10
                    bg-[#afaeae]
                    text-black
                    hover:bg-[#eaeaea]
                    transition-all
                  ">
                  <div className="p-6">
                    <div className="flex justify-between mb-6">
                      <div className="w-10 h-10 bg-black/10 border border-black/10 flex items-center justify-center">
                        <span className="text-xs text-black">□</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs uppercase text-black/70">
                        <div className={`w-2 h-2 ${p.color}`} />
                        {p.status}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                    <p className="text-sm text-black/50 font-mono">{p.repo}</p>

                    <div className="flex justify-between mt-6 pt-4 border-t border-black/10 text-xs text-black/40">
                      <span>Updated recently</span>
                      <span className="group-hover:text-black">→</span>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-white/30 text-sm">No projects found</div>
              )}
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="col-span-12 lg:col-span-4">
            <div className="p-6 border border-white/10 bg-black/40 rounded-md">
              <h2 className="text-xs uppercase text-white/40 mb-6">Usage</h2>

              <div className="space-y-6 text-xs">
                {[
                  { label: "Edge Requests", val: "482k / 1M", w: "48%" },
                  { label: "Data Transfer", val: "12GB / 50GB", w: "25%" },
                  { label: "CPU", val: "890m / 1500m", w: "60%" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span>{item.label}</span>
                      <span>{item.val}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white"
                        style={{ width: item.w }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
