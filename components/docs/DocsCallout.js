"use client";

import { Info, AlertTriangle, ShieldCheck, Terminal } from "lucide-react";

export default function DocsCallout({
  type = "info",
  title = null,
  children,
}) {
  const configs = {
    info: {
      border: "border-white/15",
      bg: "bg-white/[0.02]",
      badge: "border-white/20 text-white",
      icon: Info,
      label: "NOTE",
    },
    spec: {
      border: "border-white/20",
      bg: "bg-white/[0.03]",
      badge: "border-white/30 text-white font-mono",
      icon: ShieldCheck,
      label: "SYSTEM SPEC",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/[0.03]",
      badge: "border-amber-500/40 text-amber-300",
      icon: AlertTriangle,
      label: "ATTENTION",
    },
    terminal: {
      border: "border-white/15",
      bg: "bg-black/40",
      badge: "border-white/20 text-white font-mono",
      icon: Terminal,
      label: "RUNTIME_OUTPUT",
    },
  };

  const conf = configs[type] || configs.info;
  const Icon = conf.icon;

  return (
    <div
      className={`my-6 border ${conf.border} ${conf.bg} p-5 text-sm leading-relaxed backdrop-blur-sm relative overflow-hidden`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={14} className="text-white/70" />
        <span
          className={`border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${conf.badge}`}>
          {title || conf.label}
        </span>
      </div>
      <div className="text-zinc-300 text-xs md:text-sm pl-0.5 space-y-2">
        {children}
      </div>
    </div>
  );
}
