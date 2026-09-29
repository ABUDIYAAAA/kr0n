import Link from "next/link";
import DocsSidebar from "@/components/docs/DocsSidebar";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsCallout from "@/components/docs/DocsCallout";
import DocsPagination from "@/components/docs/DocsPagination";
import { DOCS_SECTIONS } from "@/lib/docs-data";
import { Layers, Rocket, ShieldCheck, Terminal, ArrowUpRight, Cpu } from "lucide-react";

export const metadata = {
  title: "Ecosystem Templates & Starters — kr0n Documentation",
  description: "Documentation for production-grade architectural templates configured for instant edge compilation and zero cold-start latency.",
};

export default function TemplatesDocsPage() {
  const currentSection = DOCS_SECTIONS.find((s) => s.id === "templates");

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
      {/* SIDEBAR */}
      <DocsSidebar
        activeSectionId="templates"
        currentSubsections={currentSection.subsections}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 px-6 sm:px-12 py-10 lg:py-14 bg-[#090a0c]">
        {/* HEADER */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">
            <span>DOCS</span>
            <span>/</span>
            <span className="text-white">PROJECT_STARTERS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            Templates &amp; Starters
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Production-grade architectural templates configured for instant edge compilation,
            typed APIs, and zero cold-start latency across the kr0n platform.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 text-[10px] font-mono text-white/50">
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              STARTERS: 5 VERIFIED
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              RUNTIME: EDGE / WASM / NODE
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              IMPORT: ONE-CLICK
            </span>
          </div>
        </div>

        {/* SECTION: OVERVIEW */}
        <section id="overview" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Ecosystem Starters
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Each template is pre-configured with the kr0n build harness, including AST optimization
            rules and edge caching headers. You can deploy any of these starters in one click from
            the <Link href="/dashboard/projects/importrepo" className="text-white underline underline-offset-4">Import Repository</Link> screen
            or clone them via the CLI.
          </p>

          <DocsCallout type="spec" title="PRE-TUNED FOR ZERO COLD-STARTS">
            All official starters feature tree-shaken entry points that conform to kr0n&apos;s
            sub-1.2s build synthesis budget and sub-15ms edge time-to-first-byte (TTFB).
          </DocsCallout>
        </section>

        {/* SECTION: NUCLEUS ENGINE */}
        <section id="nucleus-engine" className="mb-14 scroll-mt-24 space-y-4">
          <div className="border border-white/10 bg-[#0d0f12] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                STARTER // BACKEND_CORE
              </span>
              <span className="border border-white/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                PRODUCTION_READY
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase text-white">nucleus-engine</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              High-throughput backend service starter utilizing kr0n&apos;s refraction engine.
              Ideal for event ingestion, high-speed telemetry streams, and lightweight microservices.
            </p>

            <div className="pt-2 font-mono text-xs text-white/70 flex flex-wrap gap-4">
              <span>Stack: Node.js / Rust FFI</span>
              <span>Branch: main</span>
              <span>Build Time: ~1.8s</span>
            </div>

            <CodeBlock
              language="bash"
              code={`# Deploy nucleus-engine via CLI:
kron init --template=nucleus-engine my-api
cd my-api
kron deploy --prod`}
            />
          </div>
        </section>

        {/* SECTION: QUANTUM WEB */}
        <section id="quantum-web" className="mb-14 scroll-mt-24 space-y-4">
          <div className="border border-white/10 bg-[#0d0f12] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                STARTER // EDGE_SSR
              </span>
              <span className="border border-white/15 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                EDGE_V2
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase text-white">quantum-web</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Next.js 16 SSR web application template featuring Tailwind CSS v4 and streaming server
              components. Built-in protection against client hydration mismatches and automatic
              edge cache revalidation.
            </p>

            <div className="pt-2 font-mono text-xs text-white/70 flex flex-wrap gap-4">
              <span>Stack: Next.js 16 / React 19 / Tailwind 4</span>
              <span>Branch: edge-v2</span>
              <span>SSR Latency: &lt; 12ms</span>
            </div>

            <CodeBlock
              language="bash"
              code={`# Deploy quantum-web via CLI:
kron init --template=quantum-web web-client
cd web-client
kron deploy`}
            />
          </div>
        </section>

        {/* SECTION: AUTH SERVICE */}
        <section id="auth-service" className="mb-14 scroll-mt-24 space-y-4">
          <div className="border border-white/10 bg-[#0d0f12] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                STARTER // WASM_MICROSERVICE
              </span>
              <span className="border border-white/15 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                WASM_NATIVE
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase text-white">auth-service</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              WebAssembly (WASM) token verification microservice. Compiles cryptographic token verification
              into a sub-100KB binary that executes directly inside edge memory without Node.js overhead.
            </p>

            <div className="pt-2 font-mono text-xs text-white/70 flex flex-wrap gap-4">
              <span>Stack: Rust / WASM</span>
              <span>Branch: dev</span>
              <span>Verification Time: &lt; 0.4ms</span>
            </div>
          </div>
        </section>

        {/* SECTION: OBSIDIAN DESIGN SYSTEM */}
        <section id="obsidian-design" className="mb-14 scroll-mt-24 space-y-4">
          <div className="border border-white/10 bg-[#0d0f12] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                STARTER // DESIGN_SYSTEM
              </span>
              <span className="border border-white/15 px-2 py-0.5 text-[10px] font-mono text-white/60">
                UI_KIT
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase text-white">obsidian-design-system</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              The exact brutalist luxury tech design system powering kr0n. Includes clipped-corner polygons,
              monochromatic surfaces, technical coordinate headers, and keyboard-accessible HUD components.
            </p>

            <div className="pt-2 font-mono text-xs text-white/70 flex flex-wrap gap-4">
              <span>Stack: Vanilla CSS / Tailwind 4 / Lucide</span>
              <span>Branch: production</span>
              <span>Tokens: Monochromatic</span>
            </div>
          </div>
        </section>

        {/* SECTION: LEGACY DASH */}
        <section id="legacy-dash" className="mb-14 scroll-mt-24 space-y-4">
          <div className="border border-white/10 bg-[#0d0f12] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                STARTER // OBSERVABILITY
              </span>
              <span className="border border-white/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                MONITORING
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase text-white">legacy-dash / watch-wise</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Real-time analytics and observability dashboard template. Features time-series charts (24H, 7D, 30D),
              regional traffic breakdowns, bandwidth gauges, and deployment velocity tracking.
            </p>
          </div>
        </section>

        {/* SECTION: MANIFEST */}
        <section id="manifest" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            kron.config.json Manifest Schema
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Configure custom build steps, edge routing rules, and regional affinity in your project root:
          </p>

          <CodeBlock
            language="json"
            filename="kron.config.json"
            code={`{
  "$schema": "https://kr0n.dev/schemas/v1.json",
  "name": "quantum-web",
  "framework": "nextjs",
  "build": {
    "command": "npm run build",
    "outputDirectory": ".next",
    "astAnalysis": true
  },
  "edge": {
    "regions": ["iad1", "fra1", "hnd1", "sfo1"],
    "coldStartCaching": true,
    "maxDuration": 15
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Edge-Engine", "value": "kr0n-v1" },
        { "key": "Cache-Control", "value": "s-maxage=3600, stale-while-revalidate" }
      ]
    }
  ]
}`}
          />
        </section>

        {/* BOTTOM PAGINATION */}
        <DocsPagination
          prev={{
            slug: "/docs/cli",
            title: "← CLI Tooling",
          }}
          next={{
            slug: "/docs/quick-start",
            title: "Quick Start →",
          }}
        />
      </main>
    </div>
  );
}
