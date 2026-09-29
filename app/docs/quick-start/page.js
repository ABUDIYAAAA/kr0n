import Link from "next/link";
import DocsSidebar from "@/components/docs/DocsSidebar";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsCallout from "@/components/docs/DocsCallout";
import DocsPagination from "@/components/docs/DocsPagination";
import { DOCS_SECTIONS } from "@/lib/docs-data";
import { CheckCircle2, ArrowRight, GitBranch, Terminal, Shield, Globe } from "lucide-react";

export const metadata = {
  title: "Quick Start Guide — kr0n Documentation",
  description: "Get started with the kr0n edge computing and deployment infrastructure in under 60 seconds.",
};

export default function QuickStartPage() {
  const currentSection = DOCS_SECTIONS.find((s) => s.id === "quick-start");

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
      {/* SIDEBAR */}
      <DocsSidebar
        activeSectionId="quick-start"
        currentSubsections={currentSection.subsections}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 px-6 sm:px-12 py-10 lg:py-14 bg-[#090a0c]">
        {/* HEADER */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">
            <span>DOCS</span>
            <span>/</span>
            <span className="text-white">GETTING_STARTED</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            Quick Start &amp; Core Workflow
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Take a repository from your local environment to kr0n&apos;s global edge network in
            under 60 seconds using the automated build engine and live log stream.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 text-[10px] font-mono text-white/50">
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              ESTIMATED TIME: ~60 SECONDS
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              DEPLOY ENGINE: V1.0.4
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              EDGE COLD-START: &lt; 15MS
            </span>
          </div>
        </div>

        {/* SECTION: PLATFORM OVERVIEW */}
        <section id="overview" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Platform Overview
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            kr0n is a next-generation edge deployment platform engineered for modern web applications,
            microservices, and WebAssembly runtimes. When you push a deployment, kr0n analyzes your
            project&apos;s Abstract Syntax Tree (AST), resolves dependencies in an isolated sandbox,
            and broadcasts immutable build outputs across our global network of edge PoPs.
          </p>

          <DocsCallout type="spec" title="IMMUTABLE EDGE ARCHITECTURE">
            Every deployment generates an isolated cryptographic hash (e.g. <code className="text-white font-mono">f2a991b</code>)
            associated with your commit. Traffic can be routed instantaneously with zero downtime
            or rolled back without rebuild overhead.
          </DocsCallout>
        </section>

        {/* SECTION: PREREQUISITES */}
        <section id="prerequisites" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Prerequisites
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Before initiating a deployment, ensure you have:
          </p>
          <ul className="space-y-2 text-sm text-zinc-400 font-sans list-disc list-inside">
            <li>A Git repository containing a standard framework manifest (<code className="text-white font-mono text-xs">package.json</code>, <code className="text-white font-mono text-xs">kron.config.json</code>).</li>
            <li>A verified kr0n account (authenticated via <Link href="/authentication/login" className="text-white underline underline-offset-4">Login</Link>).</li>
            <li>Optional: Node.js 18+ if deploying via the terminal CLI (<code className="text-white font-mono text-xs">kron</code>).</li>
          </ul>
        </section>

        {/* SECTION: CONNECT REPO */}
        <section id="connect-repo" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Step 1: Connect Repository
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            You can link repositories via the Web Dashboard or directly from the homepage hero:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="border border-white/10 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono">
                <Globe size={15} />
                <span>Web Console</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Navigate to <Link href="/dashboard/projects/importrepo" className="text-white underline underline-offset-2">Import Repository</Link>.
                Select an authorized account (e.g. <span className="font-mono text-white">arpittripathi</span>),
                browse available git branches, and click <strong>Import</strong>.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase font-mono">
                <Terminal size={15} />
                <span>Terminal CLI</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run the local discovery command inside your project directory:
              </p>
              <div className="font-mono text-xs bg-black/60 p-2 border border-white/10 text-white">
                $ kron import --local
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: CONFIGURE ENVIRONMENT */}
        <section id="environment" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Step 2: Configure Environment Variables
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Define encrypted secrets and application configuration via the Environment Variables dashboard
            at <Link href="/dashboard/evariables" className="text-white underline underline-offset-4">/dashboard/evariables</Link>.
          </p>

          <CodeBlock
            language="bash"
            filename=".env.production"
            code={`# Production Configuration
DATABASE_URL="postgres://user:secret@edge-db.kron.internal:5432/production"
NEXT_PUBLIC_API_URL="https://engine.io/api/v1"
SESSION_SECRET="e9b28fa48c21e69b0f47e248b991"`}
          />

          <DocsCallout type="info" title="ENVIRONMENT SCOPES">
            kr0n supports three distinct variable scopes: <strong>Production</strong>, <strong>Preview</strong>,
            and <strong>Development</strong>. Variables marked as sensitive are encrypted with AES-256 and never logged in the build stream.
          </DocsCallout>
        </section>

        {/* SECTION: BUILD & AST PIPELINE */}
        <section id="build-pipeline" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Step 3: Build &amp; AST Pipeline Execution
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Upon triggering deployment, the build stream (<code className="font-mono text-white text-xs">BUILD_LOG_STREAM_V1</code>)
            executes sequentially:
          </p>

          <div className="border border-white/10 bg-black/60 p-5 font-mono text-xs space-y-2 my-4">
            <div className="text-white/40">[08:45:12] <span className="text-white">INITIALIZING ENGINE</span></div>
            <div className="text-white/40">[08:45:13] <span className="text-white/60">→ FETCHING DEPENDENCIES</span></div>
            <div className="text-white/40">[08:45:15] <span className="text-white/60">→ ANALYZING AST</span></div>
            <div className="text-white/40">[08:45:18] <span className="text-white font-bold">✓ BUILD SUCCESSFUL (2.4s)</span></div>
            <div className="text-white/40">[08:45:18] <span className="text-white/60">→ DEPLOYING TO GLOBAL EDGE</span></div>
            <div className="text-white/40">[08:45:19] <span className="text-white">OPTIMIZING ASSETS...</span></div>
            <div className="text-white/40">[08:45:20] <span className="text-white">COLD START CACHING...</span></div>
          </div>

          <p className="text-sm text-zinc-400">
            You can monitor this live stream in your dashboard at <Link href="/dashboard/deployments" className="text-white underline underline-offset-4">/dashboard/deployments</Link> or
            in your terminal using <code className="font-mono text-white text-xs">kron logs --tail</code>.
          </p>
        </section>

        {/* SECTION: EDGE DISPATCH */}
        <section id="edge-dispatch" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Step 4: Global Edge Dispatch &amp; Live URL
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Once build synthesis is complete, your application is live on the kr0n global edge.
            Each project is allocated an immediate edge subdomain:
          </p>

          <CodeBlock
            language="bash"
            code={`https://engine.io/watch-wise
# Staging/Branch Previews:
https://engine.io/watch-wise-edge-v2.preview.kron.app`}
          />

          <p className="text-sm text-zinc-300">
            Inspect response times, edge requests, and bandwidth transfer metrics on the
            dedicated <Link href="/usage" className="text-white underline underline-offset-4">Usage Analytics</Link> dashboard.
          </p>
        </section>

        {/* SECTION: CANVAS WORKSPACE */}
        <section id="canvas-workspace" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Spatial Canvas Workspace
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The kr0n Projects interface (<Link href="/dashboard/projects" className="text-white underline underline-offset-4">/dashboard/projects</Link>)
            features an interactive spatial canvas workspace. You can drag and organize your deployed service cards
            (<code className="font-mono text-white text-xs">nucleus-engine</code>, <code className="font-mono text-white text-xs">quantum-web</code>,
            <code className="font-mono text-white text-xs">auth-service</code>, <code className="font-mono text-white text-xs">legacy-dash</code>)
            to map your multi-service microfrontend architecture.
          </p>
        </section>

        {/* BOTTOM PAGINATION */}
        <DocsPagination
          next={{
            slug: "/docs/ai",
            title: "AI & Engine Intelligence →",
          }}
        />
      </main>
    </div>
  );
}
