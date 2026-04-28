import Image from "next/image";

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
            <button className="text-xs font-bold uppercase text-white/50 hover:text-white px-4 py-2">
              LOGIN
            </button>

            <button className="bg-white text-black text-xs font-bold px-6 py-2 clipped-btn-reverse hover:bg-zinc-200">
              SIGN UP
            </button>
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

              <button className="bg-white text-black font-black px-10 py-5 uppercase tracking-widest text-sm clipped-btn hover:bg-zinc-200 active:translate-y-1">
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
              "Connect Repository",
              "Build & Install",
              "Deploy to Edge",
              "Live URL Ready",
            ].map((title, i) => (
              <div
                key={i}
                className="h-64 p-6 border border-white/10 bg-white/5 flex flex-col justify-between relative overflow-hidden">
                <div className="text-xs text-white/20 font-mono">
                  SLOT_0{i + 1}
                </div>
                <div className="text-xl font-bold">{title}</div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
              </div>
            ))}
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

            <button className="bg-white text-black font-black px-16 py-8 text-xl uppercase clipped-btn hover:bg-zinc-200">
              ESTABLISH CONNECTION
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-12 py-16 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <span className="text-xl font-black text-white">KRON</span>
            <p className="text-xs text-zinc-600 mt-4 font-mono uppercase">
              © 2024 KRON SYSTEMS
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs uppercase text-zinc-600">
            <a className="hover:text-white">STATUS</a>
            <a className="hover:text-white">PRIVACY</a>
            <a className="hover:text-white">TERMS</a>
            <a className="hover:text-white">SECURITY</a>
            <a className="hover:text-white">GITHUB</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
