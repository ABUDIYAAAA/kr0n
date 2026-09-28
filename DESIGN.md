# kr0n — Design System & UI Direction: Developer Workspace

This document serves as the design reference for **kr0n**. It captures the philosophy, aesthetic direction, and component patterns established by the **Developer Workspace** theme.

The guiding philosophy is: **kr0n is where developers build, ship, and operate their applications—not an infrastructure monitoring console.**

---

## 1. Core Philosophy & Mental Model

- **Application-Centric, Not Cluster-Centric**: The primary object of interest is the **Service** and its **Versioned Releases**, not server nodes, namespaces, or infrastructure internals.
- **Hiding Kubernetes Complexity**: Users think in terms of _Organizations_, _Projects_, _Environments_, _Services_, and _Deployments_. Never expose raw Kubernetes concepts like pods, controllers, or `CrashLoopBackOff`.
- **Low Cognitive Overhead**: The interface feels calm, orderly, and modern—similar to craft-driven tools like Linear, Vercel, and modern code editors.

---

## 2. Visual Foundation

### Clean & Aesthetic Typography

- **Primary Body Font**: Clean modern geometric sans-serif (`-apple-system`, `BlinkMacSystemFont`, Inter, or Geist Sans).
- **Code & Numeric Font**: High-legibility monospaced font (`ui-monospace`, `SF Mono`, JetBrains Mono) used selectively for commit hashes, versions, endpoints, ports, and telemetry metrics.
- **Hierarchy & Weights**:
    - Headings: Bold or medium with tight tracking (`tracking-tight`), avoiding loud oversized headings.
    - Subheadings & Breadcrumbs: Muted medium weight (`text-slate-400 font-medium`).
    - Microcopy: Crisp uppercase tracking for metadata badges (`text-[10px] uppercase tracking-wider`).

### Deep Dark Palette with Purple / Indigo Accents

- **Base Surfaces**:
    - Root Canvas: `#0b0c10` (deep dark charcoal, calm and non-distracting)
    - Elevated Workspace Bars: `#0e1017`
    - Cards & Content Panels: `#12141c`
    - Nested Inset Elements: `#090a0f` or `rgba(0, 0, 0, 0.3)`
- **Purple & Indigo Accent Suite**:
    - Primary Accent / Actions: Indigo `#6366f1` / Violet `#818cf8`
    - Subtle Indigo Glows / Tints: `rgba(99, 102, 241, 0.1)` to `rgba(99, 102, 241, 0.2)`
    - Active Borders: `border-indigo-500/40` or subtle ring highlights
- **Semantic State Colors**:
    - Active / Healthy: Soft Mint Emerald (`#10b981` / `#34d399`) with subtle green pulse dots.
    - Warning: Soft Amber (`#f59e0b`).
    - Error / Failure: Soft Rose (`#f43f5e`), paired with plain-language diagnostic copy.
    - Informational / Secondary: Slate `#94a3b8` / `#64748b`.

### Plenty of Spacing & Breathing Room

- **Open Canvas**: Avoid cramped tables or dense dashboards. Let cards, headers, and tabs breathe.
- **Generous Padding**:
    - Section Containers: `p-6` to `p-8`
    - Cards: `p-5` with comfortable vertical gaps (`gap-4` to `gap-6`)
    - Toolbars: `py-3.5 px-6`
- **Comfortable Line Heights**: Generous leading (`leading-relaxed`) for descriptions and changelogs.

### Soft Borders & Refined Depths

- **Translucent Borders**: Use subtle white/slate opacity borders (`border-white/5` to `border-white/10`) rather than harsh solid dividers.
- **Gentle Rounded Corners**: Cards and panels use `rounded-xl` (12px), buttons and badges use `rounded-md` or `rounded-lg` (6–8px).
- **Subtle Layering**: Depth is achieved through gentle contrast shifts between surfaces and 1px translucent borders, avoiding heavy dropped shadows.

### Smooth & Responsive Feel

- **Micro-Interactions**: Smooth hover transitions (`transition-all duration-150 ease-out`).
- **Tactile Feedback**: Subtle button press feedback, copy confirmations ("Copied!"), and clean focus rings.
- **Low Visual Noise**: Avoid distracting decorative gradients, particle effects, or generic SaaS marketing cards.

---

## 3. Structural & Navigation Patterns

### Contextual Breadcrumb Navigation

Instead of a heavy permanent sidebar that consumes horizontal space:

- Top breadcrumbs anchor the user’s location:
  `Organization / Project / Environment Picker ▾ / Service Picker ▾`
- Fast environment switching (e.g. _Production_, _Staging_, _Preview_) directly in the navigation path.
- Quick global actions pinned to the top right (_Deploy New Version_, _Rollback_).

### Service Header as the Hero Element

Each service view establishes immediate context:

- Service Name & Type (`api` • WebService)
- Live Production URL badge with automatic TLS lock icon and 1-click copy
- Current Version & Deployment Status (`v1.8.4` • Active)
- Scale & Health summary (Replicas count, Health probe status)

### Contextual Toolset Tabs

Organize service functionality into natural workspaces:

1. **Overview**: Current release card, latest commit details, health summary, and recent activity.
2. **Deployments (Releases)**: Chronological release history with actionable failure diagnostics.
3. **Environment & Secrets**: Key-value secrets manager with hide/reveal toggles.
4. **Domains & Routing**: Custom domain bindings with automatic Let's Encrypt TLS status.
5. **Logs & Traces**: Streaming log feed with instance tagging and search filters.
6. **Resources & Quotas**: Sizing controls, replica count, and hard boundary indicators.

---

## 4. Deployment Lifecycle & Error Handling

### Asynchronous Reconciliation Model

A deployment is not an instantaneous binary event; it is an asynchronous reconciliation flow:

1. `Queued` (Controller dispatches reconciliation)
2. `Building` (Dockerfile / buildpack layer caching)
3. `Security Checks` (Vulnerability scans & SBOM verification)
4. `Deploying` (Rolling update of replicas)
5. `Health Checking` (Verification of port & `/healthz` response)
6. `Active` (Live traffic shifted with zero downtime)

### Slide-Over Drawers

- Use slide-over side drawers (`max-w-md`) for active deployment monitoring and rollback confirmations. This allows the user to inspect deployment logs without losing context of their current view.

### Actionable Plain-English Error Communication

When a deployment fails, present actionable information without Kubernetes jargon:

- **Title**: _Deployment failed (v1.8.2)_
- **Reason**: _Health check failed_
- **Likely Cause**: _Application did not respond on port 8080 after 3 attempts_
- **Recommended Action**: _Verify the service port or health endpoint `/healthz` in your application configuration_
- **Safety Reassurance**: _Zero downtime — live traffic was automatically retained on stable version v1.8.3_

---

## 5. Summary Checklist for Future Components

- [ ] Does it prioritize the developer's application and releases over infrastructure details?
- [ ] Is spacing generous and open, avoiding cramped data tables where not needed?
- [ ] Are borders soft (`border-white/10`) with rounded corners (`rounded-xl`)?
- [ ] Is the color palette anchored in deep charcoal surfaces with purple/indigo accents?
- [ ] Are error messages actionable, clear, and free of Kubernetes jargon?
- [ ] Does it feel calm, smooth, and enjoyable to use every day?
