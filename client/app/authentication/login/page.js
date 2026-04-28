"use client";

export default function Login() {
  return (
    <div className="bg-[#121414] text-[#e3e2e2] min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-[420px] space-y-8">
          {/* HEADER */}
          <div className="text-center space-y-2">
            <h1 className="text-[48px] font-extrabold tracking-tight uppercase text-white">
              KRON
            </h1>
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
              Authenticate to deploy
            </p>
          </div>

          {/* CARD */}
          <div className="border border-white/20 bg-[#0a0a0a] p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* SOCIAL BUTTONS */}
            <div className="space-y-3">
              {/* GOOGLE */}
              <button className="w-full flex items-center justify-center gap-3 py-3 border border-white/20 hover:bg-white hover:text-black transition-none active:translate-x-[1px] active:translate-y-[1px]">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-5 h-5"
                />

                <span className="text-[12px] font-semibold uppercase tracking-widest">
                  Continue with Google
                </span>
              </button>

              {/* GITHUB */}
              <button className="w-full flex items-center justify-center gap-3 py-3 border border-white/20">
                <img
                  src="https://www.svgrepo.com/show/512317/github-142.svg"
                  className="w-5 h-5 invert"
                />

                <span className="text-[12px] font-semibold uppercase tracking-widest">
                  Continue with GitHub
                </span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-white/10"></div>
              <span className="text-[10px] text-zinc-500 uppercase">OR</span>
              <div className="h-[1px] flex-grow bg-white/10"></div>
            </div>

            {/* FORM */}
            <form className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@kron.systems"
                  className="w-full bg-[#111111] border border-white/20 px-4 py-3 text-white outline-none focus:border-white placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase text-zinc-500">
                    Password
                  </label>
                  <a className="text-[9px] uppercase text-zinc-500 hover:text-white">
                    Forgot?
                  </a>
                </div>

                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-white/20 px-4 py-3 text-white outline-none focus:border-white placeholder:text-zinc-700"
                />
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="w-full bg-white text-black py-4 text-[14px] font-black uppercase tracking-[0.2em] clipped-btn active:translate-x-[1px] active:translate-y-[1px]">
                LOGIN
              </button>
            </form>

            {/* FOOTER LINK */}
            <div className="text-center pt-4">
              <p className="text-[12px] text-zinc-500">
                Don't have an account?{" "}
                <a className="text-white font-bold hover:underline">Sign up</a>
              </p>
            </div>
          </div>

          {/* SECURITY */}
        
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/10 bg-black">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <span className="text-white font-bold text-[12px]">KRON</span>
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
            © 2024 KRON SYSTEMS INC.
          </span>
        </div>

        <div className="flex gap-8">
          <a className="text-[10px] text-zinc-600 hover:text-white uppercase">
            Privacy
          </a>
          <a className="text-[10px] text-zinc-600 hover:text-white uppercase">
            Terms
          </a>
          <a className="text-[10px] text-zinc-600 hover:text-white uppercase">
            Security
          </a>
          <a className="text-[10px] text-zinc-600 hover:text-white uppercase">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
