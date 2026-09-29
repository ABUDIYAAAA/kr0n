# KR0N — Design System & Visual Direction

## 0. Purpose

This document is the visual and interaction source of truth for KR0N.

KR0N is a developer workspace for building, shipping, and operating applications without forcing developers to think in terms of Kubernetes, clusters, nodes, pods, namespaces, or other infrastructure machinery.

The design must feel like serious software with an exceptional product website — not like a marketing template pretending to be a software product.

Primary qualities:

**calm / technical / precise / editorial / fast / premium / original**

The four external references used as inspiration are:

- Railway — product-led infrastructure storytelling, visual architecture, technical canvases, deployment/environment relationships.
- Cursor — product-as-demonstration, multi-surface interfaces, contextual tooling, state-driven motion, software shown in use.
- Linear — hierarchy, spacing, restrained surfaces, dense-but-calm information design, thin separators, strong typography, polished interaction states.
- Raycast — command-oriented interaction, compact search/action surfaces, keyboard-first thinking, sharp micro UI, strong product identity.

These are **inspiration sources only**. Do not reproduce their exact layouts, colors, copy, logos, illustrations, DOM structures, or visual identity.

---

## 1. Core Thesis

### KR0N should look like this:

> A quiet, extremely well-crafted developer instrument for shipping software.

Not this:

> A futuristic SaaS landing page with gradients, floating glass cards, random glow, and generic dashboard mockups.

The visual personality comes from **composition, typography, information density, product surfaces, and interaction quality**.

Effects are secondary.

### Design equation

```text
Railway product storytelling
+ Cursor product-as-demo
+ Linear restraint and hierarchy
+ Raycast command-layer interaction
= KR0N
```

The synthesis must be original rather than visually averaging the four references.

---

## 2. What We Borrow From Each Reference

### 2.1 Railway — Architecture as Product

Use Railway's strongest principle: infrastructure becomes understandable through the product surface itself.

KR0N should communicate relationships visually:

```text
Application
    ↓
Service
    ↓
Release
    ↓
Health
    ↓
Live application
```

Borrow:

- architecture/canvas thinking
- environment and service relationships
- technical composition
- visual explanation instead of long prose
- feature sections that show the product doing the work
- strong “product is the illustration” philosophy

Do not borrow:

- Railway's visual identity
- Railway's exact canvas appearance
- Railway's brand colors
- Railway's copy or section layouts

### 2.2 Cursor — Product In Use

Use Cursor's current product-site strength: showing believable interfaces and workflows instead of decorating the page with abstract art.

Borrow:

- interactive product demonstrations
- multi-panel product surfaces
- contextual actions
- clear progress/state representation
- software UI as the main visual object
- motion that represents a real state transition

Do not borrow:

- editor/IDE aesthetics as KR0N's primary style
- AI-agent copy patterns
- Cursor's exact window composition
- Cursor's product-specific terminology

### 2.3 Linear — Restraint and Information Design

Linear contributes the discipline of making a complex interface feel quiet.

Borrow:

- excellent typography hierarchy
- generous but deliberate whitespace
- thin separators
- restrained borders
- calm dark surfaces
- compact information rows
- contextual navigation
- clear active and selected states
- highly polished tiny details

Do not borrow:

- Linear's exact purple/indigo identity
- Linear's exact page structure
- issue/project terminology unless KR0N actually uses it
- the increasingly common “Linear clone” visual pattern

### 2.4 Raycast — Command Layer

Raycast contributes a sense of speed and directness.

Borrow:

- command/search surface as a signature interaction
- keyboard-first thinking
- compact action rows
- strong icon + label relationships
- highly legible hierarchy at small sizes
- quick-action affordances

Do not turn KR0N into a launcher clone.

The command surface should be a **KR0N control layer**, not a Raycast imitation.

---

## 3. Brand Personality

KR0N should feel:

- composed, not loud
- technical, not cyberpunk
- futuristic, not sci-fi themed
- premium, not glossy
- dense when information matters, open when communicating an idea
- confident, not hype-heavy
- fast, not animated everywhere
- precise, not sterile

A developer should be able to stare at the interface for hours without feeling visually fatigued.

---

## 4. Visual North Star

### “Instrument, not advertisement.”

Every major visual should look as though it belongs to a real KR0N workflow.

The marketing page should repeatedly give the impression:

> “I am seeing the product itself.”

not:

> “I am seeing a designer's representation of a cloud platform.”

This means the landing page should prefer:

- release timelines
- service lists
- environment selectors
- deployment states
- command surfaces
- logs
- metrics summaries
- service maps
- domain/status rows
- real UI density

over:

- abstract clouds
- 3D servers
- floating planets
- generic code windows
- meaningless charts
- giant decorative gradients
- stock imagery

---

## 5. Color System

### 5.1 Base Palette

KR0N uses a graphite-black foundation rather than pure black everywhere.

```text
Canvas        #090A0C
Canvas raised #0D0F12
Surface       #111419
Surface 2     #15191F
Surface 3     #1A1F26
Line          rgba(255,255,255,0.08)
Line strong   rgba(255,255,255,0.13)
Text          #F5F7FA
Text muted    #A4ACB8
Text faint    #68717E
```

### 5.2 Functional Accent

Use a restrained cool “ice” blue as the KR0N interaction accent.

```text
Signal        #8EAFFF
Signal soft   rgba(142,175,255,0.12)
Signal line   rgba(142,175,255,0.32)
```

The accent is functional, not decorative.

Use it for:

- primary interactive emphasis
- focused controls
- selected navigation
- links
- progress/state accents
- small key UI highlights

Do not use it as a page-wide wash.

### 5.3 Semantic States

```text
Healthy       #54D39A
Warning       #F2C76E
Error         #F07D87
Info          #8EAFFF
Neutral       #8B95A3
```

Status colors should appear next to the object they describe.

### 5.4 Strict Color Constraints

Never use:

- purple gradients
- blue/purple gradient backgrounds
- neon glow as decoration
- rainbow accents
- large colored blobs
- multiple unrelated accent colors

The page should remain visually coherent if all decorative color is removed.

---

## 6. Typography

### Primary UI font

Preferred order:

1. Geist / Geist Sans, if already available in the project
2. Inter
3. system sans-serif

### Technical font

Preferred:

- Geist Mono
- JetBrains Mono
- ui-monospace / SFMono-Regular / Menlo / monospace

### Type hierarchy

Use strong hierarchy without excessively huge marketing type.

```text
Display      64–80px desktop / 44–56px mobile
H1           48–64px
H2           32–44px
H3           20–28px
Body         15–18px
UI           13–14px
Micro        10–11px uppercase, tracked
Code         12–14px monospace
```

Rules:

- headings are compact and confident
- avoid exaggerated letter spacing on large text
- body copy stays readable and short
- technical labels may use uppercase mono styling
- never use typography merely as decoration

A landing-page headline should usually occupy **two or three lines**, not six.

---

## 7. Spacing and Rhythm

Use a consistent spacing scale and let whitespace create the premium feeling.

Preferred Tailwind rhythm:

```text
4  / micro gap
6  / control gap
8  / compact section gap
10 / content gap
12 / component gap
16 / card/section internal gap
20 / major block gap
24 / section transition
32 / large visual gap
```

Landing-page sections should generally have generous vertical separation, but avoid enormous blank areas that make the product feel unfinished.

A section needs enough whitespace to make its **one central idea** obvious.

---

## 8. Geometry

KR0N should not be built from giant rounded rectangles.

Use:

- `rounded-md` for compact controls
- `rounded-lg` for standard controls
- `rounded-xl` for major product frames
- occasional `rounded-2xl` only for large product surfaces

Avoid:

- `rounded-3xl` everywhere
- pill-shaped cards
- floating blobs
- excessive circular UI

Borders should generally be more important than shadows.

---

## 9. Borders and Surfaces

Surface hierarchy should be subtle:

```text
Canvas
  └── Surface
       └── Raised surface
            └── Nested surface
```

Use thin, low-opacity borders to establish hierarchy.

Preferred Tailwind patterns:

```text
border-white/[0.06]
border-white/[0.08]
border-white/[0.10]
```

Use stronger borders sparingly for selected or focused states.

Shadows should be soft and limited to:

- floating popovers
- command surfaces
- major product frames

No heavy card shadows.

---

## 10. Layout System

### Global container

Use a centered content system with a maximum width around 1200–1320px depending on the viewport.

Default outer padding:

```text
mobile   px-5
small    px-6
large    px-8
xl       px-10
```

### Grid

Use a 12-column mental model on desktop.

Do not force every section into an obvious symmetrical grid.

Allowed compositions:

- asymmetric text + product surface
- full-width product frame
- text-only editorial break
- split technical detail
- wide command surface
- edge-to-edge architecture visualization
- dense release list

### Important principle

**The layout should have rhythm, not repetition.**

Do not build:

```text
section = heading + paragraph + 3 cards
section = heading + paragraph + 3 cards
section = heading + paragraph + 3 cards
```

That pattern is one of the strongest signals of AI-generated SaaS design.

---

## 11. Signature KR0N Components

These components define the product's landing-page visual language.

### 11.1 Release Rail

A compact horizontal or vertical representation of a deployment moving through:

```text
Queued → Building → Security → Deploying → Health → Active
```

Use fine lines, small state markers, and precise timestamps/labels.

This is a core KR0N pattern.

### 11.2 Service Surface

A real-looking service workspace showing:

- service name
- environment
- current release
- health state
- domain
- compact operational metadata

It should feel like a real product surface rather than a marketing card.

### 11.3 Command Layer

A KR0N-specific command palette inspired by the interaction model of Raycast.

Example categories:

```text
Deploy service
Open production
Inspect release
View logs
Switch environment
Rollback
```

The exact actions shown must correspond to real/planned KR0N functionality.

### 11.4 Architecture Field

A controlled technical canvas inspired by Railway's architectural visualization.

Show application-centric relationships, for example:

```text
web
 │
 ├── api
 │    │
 │    └── postgres
 │
 └── worker
```

Do not show Kubernetes primitives.

### 11.5 Release List

Dense Linear-inspired rows for versioned releases.

Each row may contain:

- release identifier
- branch/commit
- state
- timestamp
- duration
- actor/source

Keep the rows quiet and readable.

### 11.6 Diagnostic Surface

When showing failure, use plain language:

```text
Build failed

The application could not complete its build.

Likely cause
Missing dependency in package.json

Next action
Add the dependency and redeploy.

[View build logs]
```

No Kubernetes jargon.

---

## 12. Landing Page Composition

The landing page should feel like a **sequence of product moments**.

Recommended narrative:

```text
1. Contextual navigation
2. Hero: application + release
3. Product surface in use
4. Architecture / service relationship
5. Release lifecycle
6. Command layer
7. Operational visibility
8. Developer workflow
9. Compact proof / philosophy
10. Final CTA
```

Not every item needs to be a boxed section.

Some should be almost editorial:

```text
small label
large statement
short explanation
```

Then immediately return to a product surface.

---

## 13. Hero Direction

The hero is **not** a giant empty center-aligned billboard.

Preferred composition:

- compact nav
- asymmetric two-column hero
- left side: concise product proposition
- right side: a large KR0N product surface
- product surface may visually extend beyond the text grid
- no decorative 3D object
- no gradient orb
- no fake floating dashboard in a glass capsule

Suggested messaging direction:

```text
SHIP SOFTWARE.
STAY IN THE PRODUCT.
```

Supporting direction:

```text
KR0N gives developers one workspace to build, release,
and operate applications without managing the machinery underneath.
```

Primary CTA:

```text
Get started
```

Secondary:

```text
Explore KR0N
```

The exact copy may be refined after implementation if it improves clarity, but it must remain calm and direct.

### Hero product surface

The hero surface should show an application-centric workflow:

```text
kr0n / production

storefront
ACTIVE

release 1.8.4

Build           ✓
Security        ✓
Deploy          ✓
Health          ✓

https://storefront....
```

This is a visual demonstration only unless wired to actual backend state.

---

## 14. Section Design Rules

### Rule A — One idea per section

A section should communicate one product idea.

### Rule B — Show before explaining

Prefer a product surface before a long paragraph.

### Rule C — Vary composition

A page should contain several different composition types.

### Rule D — Do not cardify everything

Cards are for grouping information that genuinely belongs together.

### Rule E — Reuse visual primitives

The same service row, status marker, release rail, and control patterns should recur across the site.

### Rule F — Keep product truth visible

Use the actual KR0N mental model:

```text
Organization
→ Project
→ Environment
→ Service
→ Deployment
```

Do not replace it with generic “workspace / workflow / intelligence” terminology.

---

## 15. Motion

Motion should communicate **change**.

Good:

- release state progressing along a rail
- command palette opening
- selected service changing
- subtle product surface transitions
- hover elevation of an interactive product surface
- status marker changing state
- content entering with short, restrained movement

Avoid:

- parallax everywhere
- floating particles
- constant background motion
- large spring animations for simple UI
- bouncing badges
- infinite marquees unless they communicate actual system data
- scroll-triggered animation on every section

Motion should generally feel between roughly 120–240ms for local interaction, with slightly longer timing only for product-state transitions.

Always support reduced motion.

---

## 16. Interaction Principles

The landing page should have a few deliberate interactions rather than dozens of effects.

Recommended:

### Product demo selector

A small set of states such as:

```text
Build / Verify / Deploy / Active
```

Switching states changes the product surface.

### Command layer

A visually strong command/search interaction that opens from a button or keyboard shortcut.

### Service focus

Clicking a service in the architecture field highlights its connections.

### Release inspection

Selecting a release row reveals a compact detail state.

These interactions should be deterministic on the marketing page and must not pretend to be live backend data.

---

## 17. Icons

Use one icon family consistently.

Icons should be:

- simple
- small
- stroke-based
- optically aligned
- supportive rather than decorative

Do not mix unrelated icon sets.

Do not use oversized icons inside every section.

---

## 18. Imagery

KR0N should not depend on stock imagery.

For the landing page, prefer:

- product UI
- architecture diagrams
- technical type
- restrained diagrams
- carefully cropped application surfaces

Do not use image-generation tools for the core landing page unless the user explicitly requests branded artwork.

---

## 19. Tailwind CSS Requirement

### Mandatory

**The landing page must use Tailwind CSS for styling.**

Use the project's existing Tailwind version and conventions after inspecting the repository.

Preferred approach:

- Tailwind utilities for layout
- Tailwind utilities for typography
- Tailwind utilities for spacing
- Tailwind utilities for borders/surfaces
- Tailwind utilities for states and responsive behavior
- Tailwind theme/tokens for KR0N design values

Do not introduce a competing CSS styling system.

Avoid:

- CSS modules for landing components
- styled-components
- emotion
- large hand-authored CSS blocks
- inline styles for static design values
- per-component style objects

A small global stylesheet is acceptable for:

- font setup
- document-level defaults
- Tailwind base/theme integration

But component styling should remain Tailwind-first.

### Tailwind token requirement

Convert the KR0N palette and spacing language into reusable theme tokens rather than scattering arbitrary values across components.

Prefer semantic names such as:

```text
kr0n-canvas
kr0n-surface
kr0n-surface-raised
kr0n-line
kr0n-text
kr0n-muted
kr0n-signal
kr0n-healthy
kr0n-warning
kr0n-error
```

---

## 20. Accessibility

All interactive landing-page elements must support:

- semantic HTML
- keyboard navigation
- visible focus state
- sufficient contrast
- meaningful labels
- correct button/link semantics
- reduced-motion support

Command surfaces and demos need proper focus behavior.

Never rely on color alone to communicate state.

---

## 21. Responsive Behavior

### Desktop

Use the full asymmetric composition and larger product surfaces.

### Laptop

Maintain the visual rhythm but reduce visual width and padding.

### Tablet

Collapse asymmetric hero into a readable stacked composition while preserving product-first storytelling.

### Mobile

The product surface becomes a first-class vertical block.

Avoid:

- horizontal scrolling
- tiny unreadable product UI
- desktop canvas squeezed into mobile
- navigation that becomes an oversized hamburger system

On mobile, simplify the architecture visualization rather than merely shrinking it.

---

## 22. Anti-AI Design Rules

These rules are mandatory.

Do not use the following generic patterns unless there is a strong product reason:

- centered hero + gradient orb
- three identical feature cards
- six feature cards in a grid
- glassmorphism dashboard floating over a gradient
- large “trusted by” logo wall immediately after hero for no reason
- fake analytics chart with meaningless numbers
- repetitive rounded cards
- generic “AI / Scale / Security / Speed” section labels
- oversized glowing CTA
- excessive blur
- neon borders
- decorative particles
- random technical labels with no product meaning
- floating badges that do not communicate a state
- stock/3D cloud illustrations
- huge continuous scrolling logo marquees
- every section centered
- every section inside a bordered container
- every section entering with the same animation
- copy written like AI marketing filler

A useful test:

> Remove the color, remove the effects, and remove the animation. Does the composition still look intentionally designed?

If not, redesign it.

---

## 23. Copywriting Direction

Use:

- short sentences
- concrete product language
- technical confidence
- plain English
- verbs over adjectives
- application-level terminology

Avoid:

- “revolutionary”
- “next-generation”
- “unlock”
- “unleash”
- “supercharge”
- “AI-powered” as filler
- “seamless” as filler
- “the future of…”
- vague infrastructure buzzwords

KR0N copy should sound like product documentation written by a very good engineer who also cares about language.

---

## 24. Product Truth / Terminology

Use these concepts:

```text
Organization
Project
Environment
Service
Deployment
Release
Domain
Logs
Metrics
Alerts
Usage
Billing
Settings
```

Do not expose these as primary product concepts:

```text
Cluster
Node
Pod
Namespace
Controller
Scheduler
Build worker
```

These may exist internally, but the customer-facing product should hide that complexity.

---

## 25. Engineering and Component Architecture

The design system should produce reusable frontend primitives.

Landing-page examples:

```text
SiteHeader
HeroSection
ProductFrame
ReleaseRail
ServiceRow
StatusMarker
ArchitectureField
CommandLayer
ReleaseList
DiagnosticSurface
SectionIntro
FinalCTA
SiteFooter
```

Do not create one-off versions of the same visual primitive for each section.

Components should be composable and data-driven.

---

## 26. Landing Page Quality Gate

Before declaring the page complete, verify:

### Visual

- Does it immediately look unlike a generic AI SaaS page?
- Is product UI the dominant visual language?
- Is the composition varied?
- Is typography doing meaningful work?
- Are borders and surfaces restrained?
- Is the accent color functional rather than decorative?

### Product

- Does the page clearly communicate what KR0N does?
- Does it use Organization → Project → Environment → Service → Deployment terminology?
- Does it avoid Kubernetes jargon?
- Do visual demos correspond to actual or planned KR0N concepts?

### Interaction

- Do interactive demos behave deterministically?
- Is focus visible?
- Does keyboard interaction work?
- Does reduced motion work?

### Engineering

- Is styling Tailwind-first?
- Are design tokens centralized?
- Are components reusable?
- Are there console errors?
- Are there broken links?
- Is there horizontal overflow?
- Does the page work on mobile?

---

## 27. Reference Interpretation Summary

| Reference | Use as inspiration for | Do not copy |
|---|---|---|
| Railway | architecture, canvas, product-led storytelling, environment/service relationships | exact canvas, branding, colors, page composition |
| Cursor | product-as-demo, contextual UI, stateful interaction, multi-surface composition | editor aesthetic, agent copy, exact interface |
| Linear | typography, spacing, hierarchy, dense information design, restrained surfaces | Linear clone styling, exact purple identity, exact layout |
| Raycast | command layer, compact action rows, keyboard-first interaction, product personality | launcher aesthetic, exact palette, exact command UI |

The result must feel **KR0N**, not “Railway + Cursor + Linear + Raycast.”

---

## 28. Final Visual Definition

KR0N is:

**GRAPHITE**
**PRECISE**
**APPLICATION-FIRST**
**PRODUCT-LED**
**COMMAND-ORIENTED**
**TECHNICAL**
**CALM**
**FAST**
**PREMIUM**
**ORIGINAL**

The website should feel like the product has already existed for years and has been refined by people who care about every interaction.

That is the standard.
