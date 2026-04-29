"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Folder,
  Rocket,
  FileText,
  BarChart3,
  Key,
  Settings,
  Circle,
  HelpCircle,
} from "lucide-react";

export default function Sidebar() {
  const path = usePathname();

  const nav = [
    { name: "Projects", href: "/dashboard/projects", icon: Folder },
    { name: "Deployments", href: "/dashboard/deployments", icon: Rocket },
    { name: "Logs", href: "/dashboard/logs", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  const config = [
    { name: "Env Variables", href: "/environment", icon: Key },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const insights = [
    { name: "Usage", href: "/usage", icon: Circle },
    { name: "Support", href: "/support", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0b0b0b] flex flex-col justify-between">
      <div className="p-6">
        {/* USER */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 border border-white/20 bg-white/5" />
          <div>
            <div className="text-sm font-bold">arpittripathi</div>
            <div className="text-[10px] text-white/40 uppercase">Hobby</div>
          </div>
        </div>

        {/* PLATFORM */}
        <div className="text-[10px] text-white/20 uppercase mb-2 tracking-widest">
          Platform
        </div>

        <nav className="space-y-1 text-sm mb-6">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                    path === item.href
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white"
                  }`}>
                  <Icon size={16} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* CONFIGURE */}
        <div className="text-[10px] text-white/20 uppercase mb-2 tracking-widest">
          Configure
        </div>

        <nav className="space-y-1 text-sm mb-6">
          {config.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                    path === item.href
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white"
                  }`}>
                  <Icon size={16} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* INSIGHTS */}
        <div className="text-[10px] text-white/20 uppercase mb-2 tracking-widest">
          Insights
        </div>

        <nav className="space-y-1 text-sm">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                    path === item.href
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white"
                  }`}>
                  <Icon size={16} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-white/10">
        <div className="text-xl font-bold">KRON</div>
        <div className="text-[10px] text-white/40 mt-1">v 2.4.0 - STABLE</div>
      </div>
    </aside>
  );
}
