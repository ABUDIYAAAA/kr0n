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
import RailUserFooter from "@/components/dashboard/RailUserFooter";

export default function DashboardSidebar() {
  const path = usePathname();

  const isActiveNav = (href) =>
    path === href || (href === "/usage" && path.startsWith("/usage"));

  const nav = [
    { name: "Projects", href: "/dashboard/projects", icon: Folder },
    { name: "Deployments", href: "/dashboard/deployments", icon: Rocket },
    { name: "Logs", href: "/dashboard/logs", icon: FileText },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  const config = [
    { name: "Env Variables", href: "/dashboard/evariables", icon: Key },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const insights = [
    { name: "Usage", href: "/usage", icon: Circle },
    { name: "Support", href: "/dashboard/support", icon: HelpCircle },
  ];

  return (
    <aside className="flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b]">
      <div className="shrink-0 border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/20 bg-white/5" />
          <div>
            <div className="text-sm font-bold">arpittripathi</div>
            <div className="text-[10px] text-white/40 uppercase">Hobby</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 pt-5">
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
                    isActiveNav(item.href)
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
                    isActiveNav(item.href)
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
                    isActiveNav(item.href)
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

      <RailUserFooter />
    </aside>
  );
}
