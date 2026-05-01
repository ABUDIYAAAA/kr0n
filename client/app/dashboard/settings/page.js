"use client";

import { useState } from "react";
import Sidebar from "../sidebar/page";
import { ChevronDown, MoreVertical, Copy } from "lucide-react";

export default function SettingsPage() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [project, setProject] = useState("sast-assignments-eoe7");
  const [toggle, setToggle] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText("prj_k7n9x2v5m8l1q");
  };

  return (
    <div className="flex bg-[#0d0e0f] text-white min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* HEADER */}
        <header className="fixed top-0 left-[240px] right-0 z-40 flex justify-between items-center px-8 h-16 bg-black/50 backdrop-blur-xl border-b border-white/10">
          {/* LEFT */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:bg-white/5">
              <span className="text-xs uppercase">{project}</span>
              <ChevronDown size={14} />
            </button>

            {openDropdown && (
              <div className="absolute mt-2 w-44 bg-[#111] border border-white/10">
                {["sast-assignments-eoe7", "watch-wise", "core-engine"].map(
                  (p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setProject(p);
                        setOpenDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                      {p}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* TITLE */}
          <h1 className="text-xs font-bold uppercase tracking-wider">
            Project Settings
          </h1>

          {/* RIGHT */}
          <MoreVertical className="text-white/70" size={18} />
        </header>

        {/* MAIN */}
        <main className="pt-28 pb-24 max-w-[1200px] mx-auto px-8 space-y-8">
          {/* PROJECT NAME */}
          <section className="border border-white/10 bg-white/5 p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-2">Project Name</h2>
              <p className="text-white/40 text-sm">
                Update your project's display name across dashboard.
              </p>
            </div>

            <div>
              <label className="text-xs uppercase text-white/40">
                Project Identifier
              </label>

              <div className="flex mt-2">
                <span className="px-3 py-2 bg-white/5 border border-r-0 border-white/10 text-white/40 text-sm">
                  engine.io/
                </span>

                <input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <div className="clip-wrapper bg-white/60 p-[1px] inline-flex">
                <button className="clip-inner bg-white text-black px-6 py-2 font-bold">
                  Save
                </button>
              </div>
            </div>
          </section>

          {/* PROJECT ID */}
          <section className="border border-white/10 bg-white/5 p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-2">Project ID</h2>
              <p className="text-white/40 text-sm">
                Unique identifier for API usage.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/40 p-4 border border-white/10">
              <code className="flex-1 text-sm tracking-widest">
                prj_k7n9x2v5m8l1q
              </code>

              <button onClick={copyId}>
                <Copy size={16} />
              </button>
            </div>
          </section>

          {/* DATA PREF */}
          <section className="border border-white/10 bg-white/5 p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-2">Data Preferences</h2>
              <p className="text-white/40 text-sm">
                Control how project data is used.
              </p>
            </div>

            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4">
              <span>Improve models with this project's data</span>

              <button
                onClick={() => setToggle(!toggle)}
                className={`w-12 h-6 flex items-center px-1 ${
                  toggle ? "bg-white" : "bg-white/20"
                }`}>
                <div
                  className={`w-4 h-4 ${
                    toggle ? "bg-black ml-auto" : "bg-white"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* TRANSFER */}
          <section className="border border-white/10 bg-white/5 p-8 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold mb-2">Transfer</h2>
              <p className="text-white/40 text-sm">
                Move this project to another workspace.
              </p>
            </div>

            <div className="clip-wrapper bg-white/30 p-[1px] inline-flex">
              <button className="clip-inner bg-transparent px-6 py-2 font-bold">
                Transfer Project
              </button>
            </div>
          </section>

          {/* DELETE */}
          <section className="border border-red-500/30 bg-red-500/5">
            <div className="p-8 space-y-6">
              <h2 className="text-red-400 font-bold text-lg">Delete Project</h2>

              <p className="text-red-200/60 text-sm">
                Permanently remove this project and all data.
              </p>

              <div className="flex items-center gap-6 p-4 border border-red-400/20 bg-black/20">
                <div className="flex-1">
                  <div className="text-xs text-red-400/60">PROJECT NAME</div>
                  <div className="font-bold">{project}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-red-400/60">LAST UPDATED</div>
                  <div className="text-sm text-white/70">2 days ago</div>
                </div>

                <div className="px-3 py-1 border border-red-400 text-red-400 text-xs font-bold uppercase">
                  Deployment Failed
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border-t border-red-400/20 p-4 flex justify-end">
              <div className="clip-wrapper bg-red-400/80 p-[1px] inline-flex">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="clip-inner bg-red-400 text-black px-8 py-3 font-bold">
                  Delete Project
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[520px] border border-white/10 bg-[#0d0e0f] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-red-400">Confirm Delete</h2>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white/50 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-sm text-white/60">
              This will permanently delete the project and all its data. This
              action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <div className="clip-wrapper bg-white/20 p-[1px] inline-flex">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="clip-inner bg-transparent px-6 py-2 text-sm font-bold">
                  Cancel
                </button>
              </div>

              <div className="clip-wrapper bg-red-400/80 p-[1px] inline-flex">
                <button className="clip-inner bg-red-400 text-black px-6 py-2 text-sm font-bold">
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
