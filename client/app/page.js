import Image from "next/image";
import Link from "next/link";
import { Link2, Hammer, Rocket, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-[#0d0e0f] text-[#e3e2e2] overflow-x-hidden">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <nav className="flex justify-between items-center px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <span className="text-2xl font-black tracking-widest text-white">
              KRON
            </span>

            <div className="hidden md:flex gap-8">
              <a className="text-xs font-bold uppercase text-white border-b border-white pb-1">
                Solutions
              </a>
              <a className="text-xs font-bold uppercase text-white/50 hover:text-white">
                Infrastructure
              </a>
              <a className="text-xs font-bold uppercase text-white/50 hover:text-white">
                Edge
              </a>
              <a className="text-xs font-bold uppercase text-white/50 hover:text-white">
                Docs
              </a>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <Link
              href="/authentication/login"
              className="text-xs font-bold uppercase text-white/50 hover:text-white px-4 py-2">
              LOGIN
            </Link>

            <Link
              href="/authentication/signup"
              className="bg-white text-black text-xs font-bold px-6 py-2 clipped-btn-reverse hover:bg-zinc-200">
              SIGN UP
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative">
        {/* GRID LINES */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 w-[1px] h-full bg-white/5" />
          <div className="absolute left-2/4 w-[1px] h-full bg-white/5" />
          <div className="absolute left-3/4 w-[1px] h-full bg-white/5" />
        </div>

        {/* HERO */}
        <section className="relative pt-32 pb-24 px-12 max-w-7xl mx-auto border-x border-white/5">
          <div className="max-w-4xl">
            <h1 className="text-[72px] font-extrabold leading-[1] tracking-[-0.05em] uppercase mb-8">
              Deploy your projects <br />
              <span className="text-white">instantly</span>
            </h1>

            <div className="mt-12 flex flex-col md:flex-row max-w-2xl">
              <input
                className="flex-grow bg-white/5 border border-white/20 px-6 py-5 text-white font-mono outline-none focus:border-white"
                placeholder="https://github.com/kron/project-alpha"
              />

              <button className="bg-white text-black font-black px-10 py-5 uppercase tracking-widest text-sm clipped-btn-lg hover:bg-zinc-200 active:translate-y-1">
                DEPLOY NOW
              </button>
            </div>

            <p className="text-[11px] tracking-widest text-zinc-500 mt-6 uppercase font-mono">
              PROTOCOL VERSION 1.0.4 — STATUS: OPERATIONAL
            </p>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-32 border-t border-white/5 pt-16">
            {[
              { title: "Connect Repository", icon: Link2 },
              { title: "Build & Install", icon: Hammer },
              { title: "Deploy to Edge", icon: Rocket },
              { title: "Live URL Ready", icon: Globe },
            ].map((item, i) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="h-64 p-6 border border-white/10 bg-white/5 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-end">
                    <div className="w-10 h-10 bg-white text-black flex items-center justify-center clipped-btn-reverse">
                      <Icon size={18} className="text-black/80" />
                    </div>
                  </div>
                  <div className="text-xl font-bold">{item.title}</div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                </div>
              );
            })}
          </div>
        </section>

        {/* 🔥 TERMINAL SECTION (FIXED EXACT STYLE) */}
        <section className="bg-black/60 border-y border-white/10 py-32">
          <div className="max-w-7xl mx-auto px-12 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold uppercase mb-6">
                Built-in <br /> observability.
              </h2>
              <p className="text-zinc-400 max-w-md">
                Monitor logs, execution time, and deployments in real-time.
              </p>
            </div>

            <div className="relative border border-white/10 bg-[#0b0c0d] overflow-hidden">
              {/* HEADER */}
              <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/20"></div>
                  <div className="w-2 h-2 bg-white/20"></div>
                  <div className="w-2 h-2 bg-white/20"></div>
                </div>

                <span className="text-[10px] text-white/30 font-mono tracking-widest">
                  BUILD_LOG_STREAM_V1
                </span>
              </div>

              {/* LOGS */}
              <div className="p-6 font-mono text-xs space-y-2">
                <div className="text-white/40">
                  [08:45:12]{" "}
                  <span className="text-white">INITIALIZING ENGINE</span>
                </div>

                <div className="text-white/40">
                  [08:45:13]{" "}
                  <span className="text-white/60">→ FETCHING DEPENDENCIES</span>
                </div>

                <div className="text-white/40">
                  [08:45:15]{" "}
                  <span className="text-white/60">→ ANALYZING AST</span>
                </div>

                <div className="text-white/40">
                  [08:45:18]{" "}
                  <span className="text-white font-bold">
                    ✓ BUILD SUCCESSFUL (2.4s)
                  </span>
                </div>

                <div className="text-white/40">
                  [08:45:18]{" "}
                  <span className="text-white/60">
                    → DEPLOYING TO GLOBAL EDGE
                  </span>
                </div>

                <div className="text-white/40">
                  [08:45:19]{" "}
                  <span className="text-white">OPTIMIZING ASSETS...</span>
                </div>

                <div className="text-white/40">
                  [08:45:20]{" "}
                  <span className="text-white">COLD START CACHING...</span>
                </div>

                {/* PROGRESS */}
                <div className="mt-4">
                  <div className="w-full h-3 bg-white/10">
                    <div className="h-full w-[70%] bg-white/80"></div>
                  </div>
                </div>

                {/* CURSOR */}
                <div className="pt-4 border-t border-white/5 mt-4 flex gap-2 items-center">
                  <span className="text-white animate-pulse">_</span>
                  <span className="text-white/20">
                    waiting for incoming requests...
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* CTA + BLUR */}
        <section className="relative py-56 px-12 text-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[28vw] font-black text-white opacity-[0.07] blur-[2px] select-none">
              KRON
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0f] via-transparent to-[#0d0e0f]" />

          <div className="relative z-10">
            <h2 className="text-[72px] font-extrabold uppercase mb-12">
              System ready <br /> for input.
            </h2>

            <button className="bg-white text-black font-black px-16 py-8 text-xl uppercase clipped-btn-lg hover:bg-zinc-200">
              ESTABLISH CONNECTION
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      {/* FOOTER */}
      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0d0e0f]">
        <div className="max-w-7xl mx-auto px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-12 text-[11px] font-mono uppercase tracking-widest">
          {/* PRODUCT */}
          <div className="space-y-4">
            <div className="text-white/80 text-xs">Product</div>
            <div className="flex flex-col gap-3 text-white/40">
              <Link href="/dashboard/projects" className="hover:text-white">
                Projects
              </Link>
              <Link href="/dashboard/deployments" className="hover:text-white">
                Deployments
              </Link>
              <Link href="/dashboard/logs" className="hover:text-white">
                Logs
              </Link>
              <Link href="/dashboard/analytics" className="hover:text-white">
                Analytics
              </Link>
            </div>
          </div>

          {/* PLATFORM */}
          <div className="space-y-4">
            <div className="text-white/80 text-xs">Platform</div>
            <div className="flex flex-col gap-3 text-white/40">
              <a className="hover:text-white">Edge Network</a>
              <a className="hover:text-white">Build System</a>
              <a className="hover:text-white">Observability</a>
              <a className="hover:text-white">Environment</a>
            </div>
          </div>

          {/* RESOURCES */}
          <div className="space-y-4">
            <div className="text-white/80 text-xs">Resources</div>
            <div className="flex flex-col gap-3 text-white/40">
              <a className="hover:text-white">Docs</a>
              <a className="hover:text-white">API Reference</a>
              <a className="hover:text-white">Guides</a>
              <a className="hover:text-white">Support</a>
            </div>
          </div>

          {/* COMPANY */}
          <div className="space-y-4">
            <div className="text-white/80 text-xs">System</div>
            <div className="flex flex-col gap-3 text-white/40">
              <a className="hover:text-white">Status</a>
              <a className="hover:text-white">Security</a>
              <a className="hover:text-white">Privacy</a>
              <a className="hover:text-white">GitHub</a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 px-12 py-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-widest text-white/30">
          {/* LEFT */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span
              className="text-white
        [-webkit-text-stroke:0.5px_rgba(255,255,255,0.2)]
        [text-shadow:0_0_2px_rgba(255,255,255,0.1)]">
              KRON
            </span>

            <span>v2.4.0 — stable</span>
          </div>

          {/* RIGHT */}
          <div className="flex gap-6 mt-3 md:mt-0">
            <span>© 2024 KRON SYSTEMS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
