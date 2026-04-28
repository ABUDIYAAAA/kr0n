"use client";

import Sidebar from "../sidebar/page";
import {
  Search,
  Terminal,
  Settings,
  CheckCircle,
  AlertCircle,
  Hourglass,
  TrendingUp,
} from "lucide-react";

export default function DeploymentsPage() {
  return (
    <div className="flex min-h-screen bg-[#121414] text-[#e3e2e2] font-sans">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex flex-col flex-1">
        {/* TOP NAV */}
       

        {/* CONTENT */}
        <main className="p-8 max-w-[1440px] mx-auto w-full space-y-8 pb-20">
          {/* HEADER */}
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase flex items-center gap-4">
                PROJECT_ALPHA
                <span className="text-[12px] font-mono text-white/50 border border-white/10 px-2 py-0.5">
                  v2.4.0-STABLE
                </span>
              </h1>

              
            </div>

            <button className="bg-white text-black px-6 py-3 font-bold text-sm clipped-corner active:scale-[0.98]">
              NEW_DEPLOY
            </button>
          </header>

          {/* FILTERS */}
          <section className="flex justify-between border-y border-white/10 py-4">
            <div className="flex gap-2 text-[10px] font-mono uppercase">
              {[
                "LAST_24_HOURS",
                "AUTHORS: ALL",
                "ENVIRONMENTS: PROD",
                "REPOSITORIES",
                "BRANCHES: MAIN",
              ].map((f) => (
                <div
                  key={f}
                  className="bg-white/5 border border-white/20 px-3 py-1.5 clipped-corner-small hover:bg-white/10 cursor-pointer">
                  {f}
                </div>
              ))}
            </div>

            {/* STATUS */}
            <div className="flex gap-6 text-[10px] font-mono uppercase">
              <div className="flex items-center gap-2 text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500" /> SUCCESS
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <span className="w-1.5 h-1.5 bg-amber-400" /> BUILDING
              </div>
              <div className="flex items-center gap-2 text-rose-500">
                <span className="w-1.5 h-1.5 bg-rose-500" /> FAILED
              </div>
            </div>
          </section>

          {/* LIST */}
          <section className="space-y-px">
            {/* HEADER ROW */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] text-white/40 uppercase">
              <div>ID</div>
              <div>ENV</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">BUILD_TIME</div>
              <div className="col-span-3">RELEASE_COMMIT</div>
              <div className="col-span-2">AUTHOR</div>
              <div className="text-right">AGE</div>
            </div>

            {/* ROW */}
            {[
              {
                id: "#8291",
                env: "PROD",
                status: "SUCCESS",
                icon: CheckCircle,
                color: "text-emerald-500",
                build: "1M 14S",
                title: "feat: enhance refraction engine",
                hash: "72a1bc8f",
                user: "sys_admin",
                time: "2M AGO",
              },
            ].map((d, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-4 py-4 bg-white/5 hover:bg-white/[0.07] border border-transparent hover:border-white/20 items-center">
                <div className="font-mono text-xs">{d.id}</div>

                <div>
                  <span className="bg-neutral-800 text-[9px] px-1.5 py-0.5 border border-white/10">
                    {d.env}
                  </span>
                </div>

                <div
                  className={`col-span-2 flex items-center gap-2 ${d.color}`}>
                  <d.icon size={14} />
                  {d.status}
                </div>

                <div className="col-span-2 font-mono text-xs">{d.build}</div>

                <div className="col-span-3">
                  <div className="text-xs font-bold">{d.title}</div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {d.hash}
                  </div>
                </div>

                <div className="col-span-2 flex gap-2 items-center">
                  <div className="w-5 h-5 bg-neutral-700" />
                  <span className="text-xs uppercase">{d.user}</span>
                </div>

                <div className="text-right text-xs text-white/40">{d.time}</div>
              </div>
            ))}
          </section>

          {/* ANALYTICS */}
          <section className="grid grid-cols-3 gap-6">
            <div className="border border-white/10 p-6 space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                DEPLOYMENT_VELOCITY
              </h3>
              <div className="flex gap-1 h-24">
                {[40, 60, 30, 80, 50, 90].map((h, i) => (
                  <div
                    key={i}
                    className="bg-white/10 w-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-2xl font-black">142</span>
                <span className="text-[10px] text-white/40">
                  TOTAL_THIS_WEEK
                </span>
              </div>
            </div>

            <div className="border border-white/10 p-6 text-center space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                SUCCESS_RATE
              </h3>
              <div className="text-2xl font-black">98.4%</div>
              <div className="text-emerald-500 text-[10px] flex justify-center gap-1">
                <TrendingUp size={12} /> +0.4%
              </div>
            </div>

            <div className="border border-white/10 p-6 text-center space-y-6">
              <h3 className="text-[10px] text-white/40 uppercase">
                AVERAGE_BUILD_TIME
              </h3>
              <div className="text-3xl font-black">1M 14S</div>
              <div className="text-emerald-500 text-[10px] border border-emerald-500/20 px-3 py-1 inline-block">
                STABLE
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
