# KR0N frontend completion — implementation brief for Gemini

You are the frontend engineer and product designer completing this existing KR0N project. Implement the remaining frontend pages, routes, and supporting interactions in this workspace. Deliver working code and verify it in the browser; do not stop at a plan or mockup.

Project: `/Users/gurmeharsingh/Documents/DEV/PROJECTS/SEM3 PROJECTS/KRON/kr0n`

## 1. Read the project before changing it

Read `AGENTS.md`, `DESIGN.md`, `package.json`, `app/globals.css`, and `app/layout.js`. Follow AGENTS.md's requirement to consult the relevant installed Next.js guides in `node_modules/next/dist/docs/` before implementation. Inspect current git changes and preserve existing work.

Use these existing implementations as your design and architecture references:
- `components/navigation/AppShell.js` and `CommandPalette.js`
- `components/projects/DashboardOverview.js`, `ProjectsWorkspace.js`, `ProjectCard.js`, `NewProjectModal.js`
- `app/projects/[projectId]/page.js`
- Existing service `logs/page.js` and `metrics/page.js`
- `app/usage/page.js`, `app/capacity/page.js`, `app/status/page.js`
- `app/page.js`, its imported marketing components, and the documentation components
- `lib/projects-data.js` and `lib/observability-data.js`

Run the app and inspect representative completed pages before composing new screens. Preserve their established visual identity and working behavior. Existing pages may receive focused navigation/data/interaction changes needed to connect the complete experience.

Product specifications live one directory above the app:
- `../kr0n_UI_Routes_and_Pages_PRD_Aligned.docx` — detailed route and interaction requirements
- `../kr0n_PRD.docx` — broader product intent

Read the route specification (extract its Word XML if needed). Interpret its `/app/...` examples through the existing route conventions below; do not migrate the entire application just to match an older prefix.

## 2. Use the installed skills selectively

The user's skills are available at `/Users/gurmeharsingh/.agents/skills/<skill-name>/SKILL.md`. Read the actual instructions, not only the names. Primary skills for this task:
- `ui-ux-pro-max`: navigation, accessibility, forms, tables, responsive behavior, and relevant Next.js guidance. Use focused local searches for actual issues.
- `design-system`: reuse and extend existing tokens and shared component states; avoid a parallel theme.
- `ui-styling`: accessible, consistent Tailwind-based components using the project's existing stack.
- `redesign-existing-projects`: audit-first, targeted improvements and complete interaction states.
- `brand` and `high-end-visual-design`: use applicable consistency, spacing, and hierarchy guidance, subordinate to KR0N's current identity.

Other installed skills: banner-design, brandkit, design, design-taste-frontend, design-taste-frontend-v1, find-skills, image-to-code, imagegen-frontend-web, industrial-brutalist-ui, minimalist-ui, slides, stitch-design-taste. Use only if genuinely relevant. In particular, design-taste-frontend explicitly targets marketing/portfolio pages rather than dashboards; do not apply its marketing defaults to operational screens. Do not invoke both its current and legacy versions. Raster-generation, brand-kit, banner, slide, and Stitch workflows are unnecessary for ordinary settings, service, billing, or deployment interfaces. Do not generate assets solely to claim skill usage.

The user's requirement to keep the same theme takes precedence over any generic skill suggestion to replace Inter, Lucide, the palette, or the navigation shell. Do not redesign the brand or landing page.

## 3. Lock the visual direction

Read this as serious developer software with KR0N's existing black/graphite/white identity, precise borders, useful density, and restrained motion.

Reuse `kr0n-*` tokens from `app/globals.css`: canvas `#090B0E`, raised canvas `#0D1014`, surface `#111419`, secondary surface `#15191E`, line `#242930`, stronger line `#363D47`, white primary text, muted gray supporting text. Use the existing green/amber/red tokens only for meaningful status. Keep Inter for interface text and JetBrains Mono for IDs, commits, timestamps, commands, and technical values. Keep Lucide icons consistent in size and stroke.

Make each page deliberately composed for its purpose: deployment history as a disciplined table; deployment details as a lifecycle rail and logs; settings as structured form sections; incidents as an event timeline; billing as a clear summary and ledger. Avoid repeating the same card grid on every route. Favor aligned baselines, dividers, measured whitespace, restrained corners, tabular numbers, concise labels, and a clear primary action. No new decorative gradients, neon glows, stock imagery, excessive nesting, oversized marketing headings, or ornamental animation in application UI.

## 4. Complete these nine empty routes

These route pages currently return null. Verify the current state and implement all nine:

1. `/projects/[projectId]/services/[serviceId]` — Service overview. Service identity, project/environment breadcrumbs, runtime label, health, active release, URL, CPU/memory/instances, networking/TLS, volume summary, recent releases, alerts, and logs preview. Wire Deploy/Redeploy, Restart, and Rollback to coherent demo workflows. Provide contextual Overview / Deployments / Logs / Metrics / Settings navigation shared across service pages.
2. `/projects/[projectId]/services/[serviceId]/deployments` — Deployment history. Search/filter by status, branch and time; chronological rows with commit, trigger, duration, timestamp, lifecycle state, active release marker, detail links, and eligible rollback actions. Include useful no-results and first-deployment states.
3. `/projects/[projectId]/services/[serviceId]/deployments/[deploymentId]` — Deployment detail. Source/branch/author, current/previous release, timestamps, duration, artifact digest, build logs, health checks, and expandable security results (SBOM, vulnerability scan, provenance, signature, admission). Show the complete lifecycle Queued → Building → Built → Security Checks → Planning → Deploying → Health Checking → Ready → Active. Represent build failure, rejection, and rollback with specific explanations and next actions. Use a compact rail on desktop and a readable vertical sequence on mobile.
4. `/projects/[projectId]/services/[serviceId]/settings` — Service settings. General; repository/branch/root directory and auto-deploy; build/start commands and port; environment variables with secret masking; platform/custom domains and DNS/TLS states; resources and quota feedback; health checks; persistent volumes; danger zone. Advanced options start collapsed. Forms need validation, unsaved-change handling, save/cancel, and feedback. Domain and volume operations use modals or drawers. Deleting a service explicitly preserves independent volumes; deleting volume data is a separate confirmed action.
5. `/projects/[projectId]/settings` — Project settings. Name/description, environment management, applicable project configuration, activity, and a clearly separated deletion section. Keep organization membership controls in global settings. Link back to the project.
6. `/alerts` — Alerts inbox. Firing/acknowledged/resolved, severity, project/environment/service context, source, timestamps, search and filters. Link related service/deployment/incident, support demo acknowledgement/resolution, grouped related alerts, and a useful quiet state.
7. `/incidents/[incidentId]` — Incident detail. Status/severity, affected resources, concise impact, related alerts, chronological known events, deployment correlation, diagnostic links, acknowledge/resolve actions. Do not invent AI root-cause certainty. Supply the application shell for this route without double wrapping other routes.
8. `/billing` — Current plan, billing period, entitlements, resource usage breakdown, estimate and invoice history. Use a polished ledger composition with plan-management dialog and clearly simulated actions. Do not integrate or charge a real payment method. Keep figures consistent with Usage.
9. `/settings` — Account/organization settings with sections or tabs for profile, organization, members/roles, GitHub integration, security/session management, API tokens, and audit log. Implement demo invite/change-role/remove flows, token creation with one-time display of a clearly fake token, session revoke and integration connection states. No real credentials or external account mutations. Do not claim real 2FA or OAuth support.

## 5. Complete connected flows and route integrity

Keep current canonical `/dashboard`, `/projects/...`, `/alerts`, `/incidents/...`, `/usage`, `/capacity`, `/status`, `/billing`, `/settings`, `/login`, `/signup`, and `/docs/...` routes. Do not create a competing `/app` application tree. Audit all links and tabs, breadcrumbs, command-palette actions, and browser back/forward behavior.

Known stale links in docs include `/authentication/login`, `/dashboard/projects`, `/dashboard/projects/importrepo`, `/dashboard/evariables`, `/dashboard/deployments`, `/dashboard/logs`, and `/dashboard/support`. Replace them with correct existing destinations or purposeful entry points with enough project/service context. For example, an import link may open Add Service through a supported query parameter; environment variables belong in service Settings. Do not add placeholder pages just to satisfy stale links. Preserve useful documentation while correcting navigation and unrealistic implementation claims where directly relevant.

Add or complete Create Environment and the Add Service wizard from Project Overview. The wizard supports application source/repository/branch or an approved template, detection, configuration, environment variables, review, and simulated deployment progress. Templates belong inside the wizard: PostgreSQL, Redis, Kafka, MySQL, MongoDB, ClickHouse. Use coherent fixture repository choices and honest demo connection states.

Connect project/service rows to the right detail pages. Ensure newly created demo projects/services remain navigable, rather than existing only in one component's state. Give unknown project/service/deployment/incident IDs useful not-found behavior; never silently display Orvea for every ID. Add appropriate route loading, error/retry, and branded not-found states. The current `/callback` handler only returns OK: make the frontend demo auth journey end meaningfully without pretending to implement secure OAuth. Never display a false authenticated-security guarantee.

Do not add standalone infrastructure, template marketplace, variable, domain, volume, member, API-token, or traces routes. Keep those controls in their prescribed contexts. The service is the operational object; users should not need cluster, node, pod, controller, or runtime-engine knowledge.

## 6. Frontend behavior and data architecture

This task is frontend-only. Build an internally consistent, clearly identified demo experience with no real infrastructure, billing, emails, OAuth credentials, or backend provisioning. Use the existing stack: Next.js App Router, React, Tailwind v4, Motion (`motion/react`), Lucide, and existing utilities. Confirm dependencies before importing anything. Avoid unnecessary packages or blanket framework upgrades.

Extend the structured fixtures with stable IDs and timestamps, connected relationships, and deterministic values. Resolve every view from route parameters. Create a lightweight shared demo state layer only where needed to keep creation, deploys, settings, alerts and navigation consistent across pages. If persisting harmless demo state in localStorage, guard SSR access, validate/version stored data and provide reset; never store real passwords, secrets, or credentials. Keep secret examples demonstrably fake.

Actions should have actual frontend effects, validation, loading/progress, success/failure, and disabled states. No inert primary buttons, generic alert() dialogs, or fake success toasts without state changes. A deployment request must progress through reconciliation before becoming active; maintain the prior stable version until simulated health checks pass. Include a reproducible rejected-quota/failure example with recovery. Clean up timers and stream subscriptions; avoid hydration differences caused by random render-time data.

Reuse or introduce a small set of shared primitives where useful: page/context header, service tabs, status badge, form field, confirmation dialog, drawer, table state, toast, release timeline. Avoid giant duplicated route components. Respect existing client/server boundaries and current async params conventions.

## 7. Quality gates and delivery

Implement in coherent batches, but continue until all nine pages and their supporting flows are finished. Keep a route checklist. Do not ask for approval of routine design choices; the theme and scope are defined here.

Run existing lint and production build commands. Fix issues introduced by your changes and distinguish any pre-existing or environmental blockers honestly. Do not weaken lint rules or hide errors to claim success. Add focused tests where they protect shared route resolution or deployment/state transitions; do not add tests that merely repeat markup.

Use browser verification at approximately 390px, 768px, and 1440px. Inspect actual screenshots and refine spacing, alignment, density, clipping and overflow. Verify long names, empty lists, no filter matches, invalid IDs, quota failure, keyboard navigation and reduced motion. Dialogs need accessible names, initial focus, focus containment, Escape close and restored focus; tabs need correct semantics; icon buttons need labels. Avoid page-level horizontal scrolling and ensure tables have intentional narrow-screen handling.

Exercise at least: projects → project → service → history → deployment → rollback; project → Add Service → new service; settings edit → save/cancel; alert → incident → affected service; usage → billing; keyboard command navigation. Confirm existing landing/docs/dashboard/projects/logs/metrics/usage/capacity/status pages still work.

At completion, provide the implemented route checklist, concise summary of shared components and demo behavior, exact validation results, any remaining limitations, and screenshots or browser evidence. Leave the app running locally for review if practical. Do not deploy, push, or publish the project as part of this task.
