"use client";

export default function EmailVerifiedPage() {
  return (
    <div className="bg-[#0d0e0f] min-h-screen flex flex-col text-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 flex justify-center py-8">
        <div className="text-2xl font-black tracking-[0.2em] text-white uppercase">
          KRON
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-grow flex items-center justify-center px-8 relative overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />

        {/* CARD */}
        <div className="relative w-full max-w-[420px] z-10">
          <div className="clipped-card bg-[#f1f1f1] p-12 border border-white/10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* ICON */}
              <div className="w-16 h-16 bg-black flex items-center justify-center clipped-button">
                <span className="text-white text-3xl">✓</span>
              </div>

              {/* TEXT */}
              <div className="space-y-2">
                <h1 className="text-[24px] font-bold text-black uppercase tracking-tight">
                  Email Verified
                </h1>

                <p className="text-[14px] text-zinc-600 max-w-[280px] mx-auto">
                  Your email has been successfully verified
                </p>
              </div>

              {/* DIVIDER */}
              <div className="w-full h-[1px] bg-black/5 my-4" />

              {/* BUTTON */}
              <button className="clipped-button w-full bg-black text-white py-4 px-8 text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors active:scale-[0.98] duration-75">
                You can close this page
              </button>
            </div>
          </div>

          {/* SUPPORT TEXT */}
          
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            © 2024 KRON SYSTEMS. ALL RIGHTS RESERVED.
          </div>

          <div className="flex gap-8 mt-4 md:mt-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white cursor-pointer">
              DOCS
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white cursor-pointer">
              STATUS
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white cursor-pointer">
              PRIVACY
            </span>
          </div>
        </div>
      </footer>

     
    </div>
  );
}
