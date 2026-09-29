import DocsHeader from "@/components/docs/DocsHeader";

export const metadata = {
  title: "Documentation — kr0n Edge Platform",
  description: "Official documentation, architecture specifications, CLI reference, and modular starters for the kr0n edge computing and deployment infrastructure.",
};

export default function DocsRootLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#090a0c] text-[#e3e2e2] flex flex-col antialiased selection:bg-white selection:text-black">
      {/* GLOBAL HEADER */}
      <DocsHeader />

      {/* CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>

      {/* MINIMAL TECH FOOTER */}
      <footer className="border-t border-white/10 bg-[#07080a] py-8 px-6 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-widest text-white/40">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white tracking-widest">kr0n</span>
            <span>SPEC_V1.0.4</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">EDGE RUNTIME ENGINE</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard/projects" className="hover:text-white transition">Dashboard</a>
            <a href="/usage" className="hover:text-white transition">Usage</a>
            <a href="/dashboard/support" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
