"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, CornerDownLeft, FileText } from "lucide-react";
import { SEARCH_INDEX } from "@/lib/docs-data";

export default function DocsSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = query.trim()
    ? SEARCH_INDEX.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : SEARCH_INDEX.slice(0, 6);

  const handleSelect = (slug) => {
    onClose();
    router.push(slug);
  };

  const handleKeyNavigation = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].slug);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl border border-white/20 bg-[#0b0c0e] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}>
        {/* INPUT CONTAINER */}
        <div className="flex items-center px-5 border-b border-white/10 bg-white/[0.02]">
          <Search size={18} className="text-white/40 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyNavigation}
            placeholder="Search documentation, API protocols, CLI commands..."
            className="w-full h-14 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none font-mono"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-white/40 hover:text-white p-1 text-xs">
              <X size={16} />
            </button>
          ) : (
            <span className="hidden sm:inline-block border border-white/20 px-2 py-0.5 text-[10px] font-mono text-white/40">
              ESC
            </span>
          )}
        </div>

        {/* RESULTS CONTAINER */}
        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => handleSelect(item.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-3.5 flex items-start justify-between gap-4 transition-colors ${
                      isSelected
                        ? "bg-white/10 border-l-2 border-white"
                        : "hover:bg-white/[0.04] border-l-2 border-transparent"
                    }`}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/70">
                          {item.section}
                        </span>
                        <span className="text-sm font-bold text-white tracking-tight truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {item.snippet}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pt-1 text-white/40">
                      {isSelected && (
                        <CornerDownLeft size={13} className="text-white" />
                      )}
                      <ArrowRight size={14} className={isSelected ? "text-white" : "text-white/20"} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-500 font-mono text-xs">
              <FileText size={24} className="mx-auto mb-3 text-zinc-600" />
              <p>No matching documentation entries found for &quot;{query}&quot;</p>
              <p className="text-zinc-600 text-[11px] mt-1">
                Try searching for &quot;quick start&quot;, &quot;ast&quot;, &quot;cli&quot;, or &quot;templates&quot;
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span className="text-white/30">PROTOCOL // SEARCH_V1</span>
        </div>
      </div>
    </div>
  );
}
