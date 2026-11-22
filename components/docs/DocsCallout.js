'use client';

import { Info, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';

export default function DocsCallout({
  type = 'info',
  title = null,
  children,
}) {
  const configs = {
    info: {
      border: 'border-kr0n-line',
      bg: 'bg-kr0n-surface',
      accent: 'text-kr0n-text',
      icon: Info,
      label: 'Note',
    },
    spec: {
      border: 'border-kr0n-line-strong',
      bg: 'bg-kr0n-surface',
      accent: 'text-kr0n-text',
      icon: ShieldCheck,
      label: 'Specification',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/[0.05]',
      accent: 'text-amber-300',
      icon: AlertTriangle,
      label: 'Note',
    },
    terminal: {
      border: 'border-kr0n-line',
      bg: 'bg-kr0n-black',
      accent: 'text-kr0n-text',
      icon: Terminal,
      label: 'Output',
    },
  };

  const conf = configs[type] || configs.info;
  const Icon = conf.icon;

  return (
    <div
      className={`my-6 rounded-xl border ${conf.border} ${conf.bg} p-5 text-sm leading-relaxed`}
    >
      <div className={`flex items-center gap-2 mb-2 text-xs font-semibold ${conf.accent}`}>
        <Icon size={14} />
        <span>{title || conf.label}</span>
      </div>
      <div className='text-kr0n-text-secondary text-sm space-y-2'>
        {children}
      </div>
    </div>
  );
}
