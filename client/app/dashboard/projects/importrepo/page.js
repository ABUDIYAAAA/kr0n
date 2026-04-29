"use client";

import { useState } from "react";
import { Search, Settings, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../sidebar/page";

export default function NewProjectPage() {
  const router = useRouter();

  const [globalQuery, setGlobalQuery] = useState("");
  const [repoQuery, setRepoQuery] = useState("");

  const repos = [
    { name: "kron-engine-v3", updated: "2h ago", branch: "main" },
    { name: "obsidian-design-system", updated: "5h ago", branch: "production" },
    { name: "cli-tools-internal", updated: "yesterday", branch: "main" },
    { name: "core-database-wrapper", updated: "3d ago", branch: "dev" },
  ];

  const filteredRepos = repos.filter((repo) => {
    const q = (globalQuery + repoQuery).toLowerCase();
    return repo.name.toLowerCase().includes(q);
  });

  return (
    <div className="flex bg-[#0d0e0f] text-white min-h-screen font-sans">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* NAVBAR */}
        <nav className="flex justify-between items-center px-8 w-full h-16 sticky top-0 z-50 bg-neutral-950/50 backdrop-blur-[20px] border-b border-white/10">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium tracking-tight">
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-lg font-bold uppercase tracking-widest">
              New Project
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-neutral-400 hover:bg-white/5 hover:text-white active:bg-white/10 transition-all">
              <Settings size={18} />
            </button>

            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd_1edko2U7Cvejq65JXe_buYSJE-fSqzN1udINZrSMWUfIDOa63vGXJXPnNqodF8pIM8v9ZWY0i4egMTer0QxpEiADPvjz5N4PYLGyml0id7pV2sqmeXC9MduPCDcgVphRa9OOV-gi5qCg1jEGtMz68_Tm8ClyK3vmwzGege8Z15hKhfKGLn0KqzNDZ4AsVookgGMlXBK60pxzTowWRRat8RINBT7_E3o86GUQXt6a5DlqBumzXgmCL9idYzV7q7iK6v5i2r_Ggw"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </nav>

        <div className="max-w-[1440px] mx-auto px-8 pt-12 pb-24">
          {/* HEADER */}
          <header className="mb-12">
            <h1 className="text-[40px] font-bold mb-6">
              Let’s build something new
            </h1>

            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center text-neutral-500">
                <Search size={18} />
              </div>

              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Paste GitHub repository URL or search repositories..."
                className="w-full bg-neutral-900/50 border border-white/10 px-16 py-5 text-lg text-white focus:outline-none focus:border-white placeholder:text-neutral-600"
              />
            </div>
          </header>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* LEFT */}
            <section className="md:col-span-8 flex flex-col gap-6">
              <h2 className="text-2xl font-bold">Import Git Repository</h2>

              <div className="border border-white/10 flex">
                <div className="flex items-center px-4 py-2 border-r border-white/10">
                  <span className="text-neutral-400 text-sm mr-2">
                    account:
                  </span>
                  <span className="font-semibold">arpittripathi ▼</span>
                </div>

                <input
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-neutral-600"
                />
              </div>

              <div className="border border-white/10 divide-y divide-white/10">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-6 hover:bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-900 border border-white/10 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white/40" />
                        </div>

                        <div>
                          <div className="font-bold">{repo.name}</div>
                          <div className="text-xs text-neutral-500">
                            Updated {repo.updated} • {repo.branch}
                          </div>
                        </div>
                      </div>

                      <button className="clipped-button bg-white text-black px-6 py-2 font-bold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer">
                        Import
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-neutral-500 text-sm">
                    No repositories found
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT PANEL */}
            <aside className="md:col-span-4">
              <div className="border border-white/10 p-6 flex flex-col gap-6 h-full">
                <div>
                  <div className="text-xs text-neutral-500 uppercase mb-2">
                    Next Step
                  </div>
                  <div className="text-lg font-semibold">
                    Select a repository to deploy instantly
                  </div>
                </div>

                <p className="text-neutral-400 text-sm">
                  Or use the Kron CLI to import projects from your local
                  machine.
                </p>

                <div className="bg-black/40 border border-white/5 p-4 font-mono text-sm">
                  $ kron import --local
                </div>

                <div className="mt-auto border-t border-white/10 pt-4">
                  <div className="text-xs text-neutral-500 uppercase mb-2">
                    Support
                  </div>
                  <div className="flex justify-between items-center cursor-pointer hover:translate-x-1">
                    Read the documentation →
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
