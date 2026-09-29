import Link from "next/link";
import DocsSidebar from "@/components/docs/DocsSidebar";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsCallout from "@/components/docs/DocsCallout";
import DocsPagination from "@/components/docs/DocsPagination";
import { DOCS_SECTIONS } from "@/lib/docs-data";
import { Cpu, Zap, Activity, ShieldAlert, GitCommit, Network } from "lucide-react";

export const metadata = {
  title: "AI & Engine Intelligence — kr0n Documentation",
  description: "Documentation for kr0n's automated AST dependency analysis, predictive cold-start caching, and edge routing heuristics.",
};

export default function AiDocsPage() {
  const currentSection = DOCS_SECTIONS.find((s) => s.id === "ai");

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
      {/* SIDEBAR */}
      <DocsSidebar
        activeSectionId="ai"
        currentSubsections={currentSection.subsections}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 px-6 sm:px-12 py-10 lg:py-14 bg-[#090a0c]">
        {/* HEADER */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">
            <span>DOCS</span>
            <span>/</span>
            <span className="text-white">ENGINE_INTELLIGENCE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            AI &amp; Engine Intelligence
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-2xl leading-relaxed">
            How kr0n utilizes automated syntax tree analysis, predictive cold-start caching,
            and edge routing heuristics to accelerate application execution without manual tuning.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 text-[10px] font-mono text-white/50">
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              ANALYZER: AST_V1
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              PRE-WARM: HEURISTIC
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              LATENCY OPTIMIZATION: &lt; 2.4s BUILD
            </span>
          </div>
        </div>

        {/* SECTION: ENGINE OVERVIEW */}
        <section id="overview" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Engine Intelligence
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Rather than relying on unspecialized cloud virtual machines, kr0n operates an integrated
            refraction engine that inspects source files at the compiler level. By understanding
            dependencies, call graphs, and dynamic imports before deployment, the engine autonomously
            optimizes distribution across the edge mesh.
          </p>

          <DocsCallout type="spec" title="AUTOMATED BUILD HEURISTICS">
            Engine intelligence operates transparently during the build cycle. Developers do not need to configure
            external AI keys or third-party plugins—the compiler applies syntax tree analysis and route
            prediction directly on every <code className="text-white font-mono text-xs">git push</code>.
          </DocsCallout>
        </section>

        {/* SECTION: AST ANALYSIS */}
        <section id="ast-analysis" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            AST Dependency Analysis
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            During Step 3 of the build pipeline (<code className="font-mono text-white text-xs">→ ANALYZING AST</code>),
            the kr0n compiler walks your project&apos;s Abstract Syntax Tree to identify:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 font-mono text-xs">
            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="text-white font-bold uppercase">1. Dead Code Pruning</div>
              <p className="text-zinc-400 font-sans text-xs">
                Detects uncalled functions and unused export branches, discarding heavy sub-dependencies before edge packaging.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="text-white font-bold uppercase">2. Edge Compatibility</div>
              <p className="text-zinc-400 font-sans text-xs">
                Flags Node.js native bindings (e.g. <code className="text-white">fs</code>, <code className="text-white">net</code>) and automatically redirects them to edge-compatible WebAssembly shims.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="text-white font-bold uppercase">3. Route Chunking</div>
              <p className="text-zinc-400 font-sans text-xs">
                Partitions application entry points into granular edge workers so users only download the exact code required for each route.
              </p>
            </div>
          </div>

          <CodeBlock
            language="bash"
            filename="build_log_stream.log"
            code={`[08:45:15] → ANALYZING AST
[08:45:16]   ├── 1,420 modules inspected
[08:45:17]   ├── 312 unused symbols pruned (reduced bundle by 44%)
[08:45:17]   └── 4 edge routes emitted with WASM shims
[08:45:18] ✓ BUILD SUCCESSFUL (2.4s)`}
          />
        </section>

        {/* SECTION: PREDICTIVE COLD-START CACHING */}
        <section id="predictive-caching" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Predictive Cold-Start Caching
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Traditional serverless architectures suffer from unpredictable cold-start spikes. kr0n incorporates
            traffic velocity algorithms (<code className="font-mono text-white text-xs">COLD START CACHING...</code>)
            that analyze regional traffic patterns over 24-hour and 7-day intervals.
          </p>

          <p className="text-sm text-zinc-300 leading-relaxed">
            When request momentum surges in a specific geographic cluster (e.g. Frankfurt, Tokyo, or San Francisco),
            the engine pre-warms edge worker instances before requests arrive, maintaining sub-15ms execution latency.
          </p>

          <div className="border border-white/10 bg-[#0d0e11] p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-white/40 uppercase">CACHE_STATUS</span>
              <span className="text-emerald-400 font-bold">PRE-WARMED (100% HIT RATE)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-[10px] text-white/40">COLD START</div>
                <div className="text-base font-bold text-white mt-1">&lt; 5ms</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">WARM EXECUTION</div>
                <div className="text-base font-bold text-white mt-1">&lt; 1.2ms</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">ORIGIN TRANSFER</div>
                <div className="text-base font-bold text-white mt-1">FAST_ORIGIN</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">EDGE ACCESS POPS</div>
                <div className="text-base font-bold text-white mt-1">320+ NODES</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ADAPTIVE EDGE ROUTING */}
        <section id="microfrontend-routing" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Adaptive Edge Routing &amp; Microfrontends
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            As documented in the <Link href="/usage" className="text-white underline underline-offset-4">Usage Analytics</Link> panel,
            kr0n monitors four core network streams:
          </p>

          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="border border-white/10 bg-white/[0.02] p-3.5">
              <strong className="text-white uppercase font-mono text-xs block mb-1">Fast Data Transfer</strong>
              Cached content served straight from edge PoP memory without touching backend compute.
            </li>
            <li className="border border-white/10 bg-white/[0.02] p-3.5">
              <strong className="text-white uppercase font-mono text-xs block mb-1">Fast Origin Transfer</strong>
              Direct high-bandwidth fiber interconnects between your database region and the edge dispatch layer.
            </li>
            <li className="border border-white/10 bg-white/[0.02] p-3.5">
              <strong className="text-white uppercase font-mono text-xs block mb-1">Microfrontends Routing</strong>
              Dynamic request path decomposition that stitches multiple deployed services (<code className="text-white font-mono text-xs">quantum-web</code> + <code className="text-white font-mono text-xs">auth-service</code>)
              into a unified public domain.
            </li>
          </ul>
        </section>

        {/* SECTION: LOG HEURISTICS */}
        <section id="log-heuristics" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Log Anomaly Detection &amp; Telemetry
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The platform&apos;s real-time telemetry engine monitors build and execution streams for anomalies.
            When an error occurs—such as a hydration mismatch on SSR or an uncaught exception—the engine categorizes
            the issue and updates the project state accordingly:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 font-mono text-xs">
            <div className="border border-emerald-500/30 bg-emerald-500/[0.04] p-4 space-y-1">
              <div className="text-emerald-400 font-bold uppercase">Ready</div>
              <div className="text-zinc-400 font-sans text-xs">Build passed AST verification; live on edge.</div>
            </div>
            <div className="border border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-1">
              <div className="text-amber-300 font-bold uppercase">Building</div>
              <div className="text-zinc-400 font-sans text-xs">Synthesizing bundles and warming edge cache.</div>
            </div>
            <div className="border border-red-500/30 bg-red-500/[0.04] p-4 space-y-1">
              <div className="text-red-400 font-bold uppercase">Error</div>
              <div className="text-zinc-400 font-sans text-xs">Compilation or runtime exception detected.</div>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            View active logs and filter by severity level (<code className="text-white font-mono text-xs">ALL</code>, <code className="text-white font-mono text-xs">STDOUT</code>, <code className="text-white font-mono text-xs">STDERR</code>)
            on the <Link href="/dashboard/logs" className="text-white underline underline-offset-4">/dashboard/logs</Link> screen.
          </p>
        </section>

        {/* BOTTOM PAGINATION */}
        <DocsPagination
          prev={{
            slug: "/docs/quick-start",
            title: "← Quick Start",
          }}
          next={{
            slug: "/docs/cli",
            title: "CLI Tooling →",
          }}
        />
      </main>
    </div>
  );
}
