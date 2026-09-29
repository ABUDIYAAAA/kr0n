"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Terminal, ArrowUpRight, Menu, X, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import DocsSearchModal from "@/components/docs/DocsSearchModal";

export default function DocsHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const links = [
    { name: "Quick Start", href: "/docs/quick-start" },
    { name: "AI", href: "/docs/ai" },
    { name: "CLI", href: "/docs/cli" },
    { name: "Templates", href: "/docs/templates" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          {/* LEFT: BRAND & BREADCRUMB */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-xl font-black tracking-widest text-white hover:text-neutral-300 transition-colors">
              <span>kr0n</span>
              <span className="hidden sm:inline-block border border-white/20 px-2 py-0.5 text-[9px] font-mono font-normal uppercase tracking-widest text-white/50">
                DOCS // v1.0.4
              </span>
            </Link>

            <span className="hidden md:inline-block text-white/20">/</span>

            <nav className="hidden md:flex items-center gap-5 text-xs font-mono uppercase tracking-wider">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors py-1 ${
                      isActive
                        ? "text-white font-bold border-b border-white"
                        : "text-white/50 hover:text-white"
                    }`}>
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT: SEARCH TRIGGER & DASHBOARD */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* SEARCH BUTTON */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/50 hover:border-white/30 hover:bg-white/[0.06] hover:text-white transition-all">
              <Search size={14} className="text-white/60" />
              <span className="hidden sm:inline text-[11px] font-mono">
                Search docs...
              </span>
              <kbd className="hidden sm:inline-block border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white/40">
                ⌘K
              </kbd>
            </button>

            {/* SYSTEM STATUS */}
            <div className="hidden lg:flex items-center gap-2 border border-white/10 px-2.5 py-1 bg-black/40 text-[10px] font-mono text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>EDGE_NET: 100%</span>
            </div>

            {/* DASHBOARD LINK */}
            <Link
              href="/dashboard/projects"
              className="bg-white text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider clipped-button hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5">
              <span>Console</span>
              <ArrowUpRight size={13} />
            </Link>

            {/* MOBILE MENU TOGGLE */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-white/60 hover:text-white border border-white/10">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0b0c0d] p-4 space-y-2 font-mono text-xs uppercase">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block p-2.5 ${
                  pathname === link.href
                    ? "bg-white/10 text-white font-bold"
                    : "text-white/60 hover:text-white"
                }`}>
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <DocsSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
