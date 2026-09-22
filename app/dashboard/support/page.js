"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DEMO_SUPPORT_PROJECTS } from "@/lib/demo-data";
import {
  ChevronDown,
  MoreVertical,
  Search,
  Filter,
  MessageCircle,
} from "lucide-react";

export default function SupportPage() {
  const [project, setProject] = useState("sast-assignments-eoe7");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [showNewCase, setShowNewCase] = useState(false);

  const [cases, setCases] = useState([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const createCase = () => {
    if (!subject.trim() || !description.trim()) return;

    const newCase = {
      id: Date.now(),
      subject,
      description,
      status: "open",
    };

    setCases([newCase, ...cases]);
    setSubject("");
    setDescription("");
    setShowNewCase(false);
  };

  const markSolved = (id) => {
    setCases(
      cases.map((c) => (c.id === id ? { ...c, status: "resolved" } : c)),
    );
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter === "All") return true;
    return c.status === statusFilter.toLowerCase();
  });

  return (
    <DashboardShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d0e0f] text-white">
        <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/50 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:bg-white/5">
                <span className="text-xs">{project}</span>
                <ChevronDown size={14} />
              </button>

              {openDropdown && (
                <div className="absolute mt-2 w-44 bg-[#111] border border-white/10">
                  {DEMO_SUPPORT_PROJECTS.map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setProject(p);
                        setOpenDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-white/10"></div>

            <div className="text-xs font-mono">
              <span className="text-white/40">Support</span>
              <span className="mx-2 text-white/20">/</span>
              <span className="font-bold">Cases</span>
            </div>
          </div>

          <MoreVertical size={18} className="text-white/60" />
        </header>

        {/* MAIN */}
        <main className="mx-auto min-h-0 max-w-[1400px] flex-1 overflow-y-auto overscroll-y-contain px-8 pb-16 pt-8">
          {/* SEARCH */}
          <div className="flex justify-between gap-4 mb-8">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                size={16}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full bg-white/5 border border-white/10 px-12 py-3 text-sm outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button className="h-11 w-11 border border-white/10 bg-white/5 flex items-center justify-center">
                <Filter size={16} />
              </button>

              <div className="clip-wrapper bg-white/60 p-[1px] inline-flex">
                <button
                  onClick={() => setShowNewCase(true)}
                  className="clip-inner bg-white text-black px-6 h-11 font-bold text-xs uppercase">
                  + New Case
                </button>
              </div>
            </div>
          </div>

          {/* FILTER */}
          <div className="flex gap-6 mb-6 text-xs uppercase text-white/40">
            {["All", "Open", "Resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`hover:text-white ${
                  statusFilter === s ? "text-white" : ""
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          {filteredCases.length === 0 ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
              <MessageCircle size={36} className="text-white/40 mb-4" />
              <h2 className="font-bold">No Cases</h2>
              <p className="text-white/40 mb-6">Create a new case</p>

              <div className="clip-wrapper bg-white/30 p-[1px] inline-flex">
                <button
                  onClick={() => setShowNewCase(true)}
                  className="clip-inner px-6 py-2 font-bold">
                  Create New Case
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="border border-white/10 bg-white/5 p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{c.subject}</div>
                    <div className="text-white/40 text-sm">{c.description}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* STATUS */}
                    <span
                      className={`text-xs px-2 py-1 border ${
                        c.status === "open"
                          ? "border-yellow-400 text-yellow-400"
                          : "border-green-400 text-green-400"
                      }`}>
                      {c.status}
                    </span>

                    {/* ACTION */}
                    {c.status === "open" && (
                      <div className="clip-wrapper bg-white/30 p-[1px] inline-flex">
                        <button
                          onClick={() => markSolved(c.id)}
                          className="clip-inner px-4 py-2 text-xs font-bold">
                          Mark Solved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

      {/* MODAL */}
      {showNewCase && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0d0e0f] border border-white/10 p-6 w-[500px] space-y-4">
            <h2 className="font-bold">New Case</h2>

            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-3 py-2"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-28 bg-white/5 border border-white/10 px-3 py-2"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewCase(false)}>Cancel</button>

              <div className="clip-wrapper bg-white/60 p-[1px] inline-flex">
                <button
                  onClick={createCase}
                  className="clip-inner bg-white text-black px-6 py-2 font-bold">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
