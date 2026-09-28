import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex flex-col justify-between p-8 font-sans selection:bg-white selection:text-black">
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto">
        <Link href="/" className="text-2xl font-black tracking-widest text-white">
          KRON
        </Link>
        <Link
          href="/dashboard/projects"
          className="text-xs font-mono uppercase text-white/60 hover:text-white border border-white/10 px-4 py-2 hover:bg-white/5 transition">
          Dashboard →
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center text-center my-auto py-16">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-white/40 mb-4 border border-white/10 px-3 py-1 bg-white/5">
          ERROR 404 — PAGE NOT FOUND
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-6">
          Lost in Edge
        </h1>
        <p className="text-sm md:text-base text-zinc-400 max-w-md mb-10 leading-relaxed">
          The requested route does not exist or has been relocated within the network.
        </p>

        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Link
            href="/dashboard/projects"
            className="bg-white text-black font-black px-8 py-3.5 text-xs uppercase tracking-widest clipped-btn hover:bg-zinc-200 transition">
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="border border-white/20 text-white font-bold px-8 py-3.5 text-xs uppercase tracking-widest hover:bg-white/5 transition">
            Home Overview
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto text-center font-mono text-[10px] uppercase tracking-widest text-white/30 border-t border-white/5 pt-6">
        © 2024 KRON SYSTEMS — ALL SYSTEMS OPERATIONAL
      </footer>
    </div>
  );
}
