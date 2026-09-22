"use client";

import Link from "next/link";

export default function Signup() {
  return (
    <div className="bg-[#0d0e0f] text-[#e3e2e2] min-h-screen flex flex-col relative overflow-hidden">
      {/* 🔥 PROPER DOTTED GRID (FIXED) */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="font-mono text-2xl font-black tracking-tight text-white">
          KRON
        </div>

        <div>
          <Link
            href="/authentication/login"
            className="text-white text-xs uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white hover:text-black">
            LOGIN
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-grow flex items-center justify-center p-8 mt-16">
        <div className="w-full max-w-[420px] space-y-10">
          {/* HEADER TEXT */}
          <div className="text-center space-y-2">
            <h1 className="font-mono text-4xl font-black text-white">KRON</h1>
            <p className="text-zinc-500 uppercase tracking-widest text-[11px]">
              Authenticate to deploy
            </p>
          </div>

          {/* CARD */}
          <div className="border border-white/20 bg-black/90 p-8 space-y-6">
            {/* SOCIAL */}
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 border border-white/20 py-3 hover:bg-white hover:text-black">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-5 h-5"
                />
                <span className="uppercase tracking-wider text-[12px] font-semibold">
                  Continue with Google
                </span>
              </button>

              <button className="group w-full flex items-center justify-center gap-3 border border-white/20 py-3 hover:bg-white hover:text-black transition-none">
                <img
                  src="https://www.svgrepo.com/show/512317/github-142.svg"
                  className="w-5 h-5 invert group-hover:invert-0 transition-none"
                />

                <span className="uppercase tracking-wider text-[12px] font-semibold">
                  Continue with GitHub
                </span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-4">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="text-[10px] text-zinc-600 uppercase">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* FORM */}
            <form className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-white outline-none focus:border-white"
                />
              </div>

              {/* BUTTON */}
              <button className="w-full bg-white text-black py-4 uppercase tracking-widest font-bold clipped-btn hover:bg-zinc-200">
                SIGN UP
              </button>
            </form>

            {/* FOOTER */}
            <div className="text-center pt-2">
              <p className="text-zinc-500 text-xs">
                Already have an account?{" "}
                <Link
                  href="/authentication/login"
                  className="text-white hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-10 px-8 border-t border-white/10 bg-black flex justify-between text-xs text-zinc-500">
        <span>© 2024 KRON SYSTEMS</span>
        <div className="flex gap-6">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Security</span>
        </div>
      </footer>
    </div>
  );
}
