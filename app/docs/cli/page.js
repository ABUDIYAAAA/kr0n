import Link from "next/link";
import DocsSidebar from "@/components/docs/DocsSidebar";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsCallout from "@/components/docs/DocsCallout";
import DocsPagination from "@/components/docs/DocsPagination";
import { DOCS_SECTIONS } from "@/lib/docs-data";
import { Terminal, Download, Key, Play, Shield, RefreshCw } from "lucide-react";

export const metadata = {
  title: "CLI Tooling Reference — kr0n Documentation",
  description: "Official command-line interface documentation for kr0n local discovery, project import, deployment, and secret management.",
};

export default function CliDocsPage() {
  const currentSection = DOCS_SECTIONS.find((s) => s.id === "cli");

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
      {/* SIDEBAR */}
      <DocsSidebar
        activeSectionId="cli"
        currentSubsections={currentSection.subsections}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 px-6 sm:px-12 py-10 lg:py-14 bg-[#090a0c]">
        {/* HEADER */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/50 mb-3">
            <span>DOCS</span>
            <span>/</span>
            <span className="text-white">COMMAND_LINE_INTERFACE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
            kr0n Developer CLI
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Manage deployments, import local workspaces, stream live execution logs,
            and synchronize encrypted secrets directly from your terminal.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 text-[10px] font-mono text-white/50">
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              BINARY: kron
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              VERSION: 1.0.4-STABLE
            </span>
            <span className="border border-white/10 bg-white/[0.02] px-2 py-0.5">
              SHELL: ZSH / BASH / FISH
            </span>
          </div>
        </div>

        {/* SECTION: INSTALLATION */}
        <section id="installation" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Installation &amp; Setup
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Install the official CLI globally via your package manager of choice, or run via <code className="font-mono text-white text-xs">npx</code>:
          </p>

          <CodeBlock
            language="bash"
            code={`# Install globally via npm
npm install -g @kr0n/cli

# Or run directly without installation
npx @kr0n/cli --help`}
          />

          <DocsCallout type="spec" title="VERIFY INSTALLATION">
            Verify the CLI is installed and check your current runtime version:
            <code className="block mt-2 font-mono text-xs text-white bg-black/60 p-2 border border-white/10">
              $ kron --version
              kron-cli/1.0.4 darwin-arm64 node-v20.12.0
            </code>
          </DocsCallout>
        </section>

        {/* SECTION: AUTHENTICATION */}
        <section id="authentication" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Authentication
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Authenticate your local developer machine with your kr0n workspace. This launches
            a browser handshake with <Link href="/authentication/login" className="text-white underline underline-offset-4">/authentication/login</Link> and
            stores an encrypted session token in <code className="text-white font-mono text-xs">~/.kron/auth.json</code>:
          </p>

          <CodeBlock
            language="bash"
            code={`kron login
# Handshake initialized → opening browser...
# Authenticated as: arpittripathi (Hobby plan)`}
          />
        </section>

        {/* SECTION: IMPORT LOCAL */}
        <section id="import-local" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Local Project Import (kron import --local)
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            As referenced in the New Project dashboard (<Link href="/dashboard/projects/importrepo" className="text-white underline underline-offset-4">/dashboard/projects/importrepo</Link>),
            you can import any local codebase without connecting through the web interface:
          </p>

          <CodeBlock
            language="bash"
            code={`# Inside your project folder:
cd ~/projects/my-edge-service
kron import --local

# The CLI detects your project configuration:
# ✓ Detected Next.js 16 App Router
# ✓ Linked project to: engine.io/my-edge-service
# ✓ Created local metadata: .kron/project.json`}
          />

          <DocsCallout type="info" title="ZERO CLOUD GIT DEPENDENCY">
            Using <code className="text-white font-mono text-xs">--local</code> allows you to stage deployments
            directly from your working tree before pushing upstream commits to GitHub.
          </DocsCallout>
        </section>

        {/* SECTION: DEPLOY */}
        <section id="deploy" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Deploy (kron deploy)
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Trigger an automated build and edge dispatch. The CLI streams real-time status identical
            to the web console&apos;s <code className="font-mono text-white text-xs">BUILD_LOG_STREAM_V1</code>:
          </p>

          <CodeBlock
            language="bash"
            code={`# Deploy current branch to preview:
kron deploy

# Deploy to production with immediate live traffic:
kron deploy --prod`}
          />

          <div className="border border-white/10 bg-black/60 p-4 font-mono text-xs text-zinc-400 space-y-1 my-4">
            <div>Deploying my-edge-service to kr0n edge mesh...</div>
            <div className="text-white/80">→ [08:45:12] INITIALIZING ENGINE</div>
            <div className="text-white/80">→ [08:45:13] FETCHING DEPENDENCIES</div>
            <div className="text-white/80">→ [08:45:15] ANALYZING AST</div>
            <div className="text-emerald-400 font-bold">✓ [08:45:18] BUILD SUCCESSFUL (2.4s)</div>
            <div className="text-white/80">→ [08:45:18] DEPLOYING TO GLOBAL EDGE</div>
            <div className="text-white pt-2">Live Production URL: https://engine.io/my-edge-service</div>
          </div>
        </section>

        {/* SECTION: LIVE LOGS */}
        <section id="logs" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Live Logs (kron logs)
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Tail live edge execution logs directly in your terminal, with support for filtering by project name and severity:
          </p>

          <CodeBlock
            language="bash"
            code={`# Stream all logs for current project:
kron logs --tail

# Stream logs for a specific service:
kron logs --project=nucleus-engine --tail

# Filter only errors (stderr):
kron logs --level=error`}
          />
        </section>

        {/* SECTION: ENVIRONMENT SYNC */}
        <section id="env-management" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Environment Variable Management (kron env)
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Synchronize secrets and configuration with your kr0n workspace without exposing values in source control:
          </p>

          <CodeBlock
            language="bash"
            code={`# Set an encrypted secret for production:
kron env set DATABASE_URL "postgres://..." --scope=production

# Pull remote environment variables into local .env.local:
kron env pull .env.local

# List active keys (values masked):
kron env list`}
          />
        </section>

        {/* SECTION: FLAG REFERENCE MATRIX */}
        <section id="flag-reference" className="mb-14 scroll-mt-24 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">#</span>
            Command Reference Matrix
          </h2>

          <div className="border border-white/10 overflow-x-auto my-4">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-white/50 text-[10px] uppercase tracking-wider">
                  <th className="p-3">Command</th>
                  <th className="p-3">Arguments / Flags</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-300">
                <tr>
                  <td className="p-3 text-white font-bold">kron login</td>
                  <td className="p-3 text-white/60">--token=&lt;key&gt;</td>
                  <td className="p-3">Authenticates local CLI session via web handshake.</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">kron import</td>
                  <td className="p-3 text-white/60">--local, --name=&lt;slug&gt;</td>
                  <td className="p-3">Links current directory to workspace as documented in import flow.</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">kron deploy</td>
                  <td className="p-3 text-white/60">--prod, --branch=&lt;name&gt;</td>
                  <td className="p-3">Synthesizes build and broadcasts immutable artifact to edge.</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">kron logs</td>
                  <td className="p-3 text-white/60">--tail, --level, --project</td>
                  <td className="p-3">Streams live stdout/stderr logs from the BUILD_LOG_STREAM_V1.</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">kron env</td>
                  <td className="p-3 text-white/60">set, pull, list</td>
                  <td className="p-3">Manages encrypted variables for Production and Preview scopes.</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">kron status</td>
                  <td className="p-3 text-white/60">--json</td>
                  <td className="p-3">Returns edge cluster health, deployment status, and latency stats.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM PAGINATION */}
        <DocsPagination
          prev={{
            slug: "/docs/ai",
            title: "← AI & Engine Intelligence",
          }}
          next={{
            slug: "/docs/templates",
            title: "Templates & Starters →",
          }}
        />
      </main>
    </div>
  );
}
