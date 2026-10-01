KR0N — Design System & UI Direction

Status: Current product-wide visual source of truth
Scope: Landing page, dashboard, projects, services, deployments, docs, settings, auth, and future KR0N surfaces
Core identity: Technical luxury × black/white precision × developer software × restrained motion

1. Purpose

This document defines the visual language that every KR0N screen should follow.

KR0N must feel like one coherent product, not a collection of independently designed pages.

The landing page, Docs, Dashboard, Projects, Services, Deployments, Settings, authentication, and future features should share the same:

color language

typography

spacing

border treatment

control language

interaction behavior

motion philosophy

information hierarchy

Individual pages may have different compositions, but they must clearly belong to KR0N.

The current landing-page direction is the strongest expression of the brand:

premium black / graphite / white

editorial typography

product-led visuals

technical precision

varied section composition

restrained but sophisticated motion

no generic SaaS card-grid aesthetic

2. KR0N Design Thesis

The product should feel designed, not decorated.

KR0N is a developer infrastructure platform, but its UI should not look like an infrastructure monitoring console.

Users should primarily think in terms of:

Organization → Project → Environment → Service → Deployment

not:

cluster → node → pod → controller → infrastructure primitive

Infrastructure complexity should disappear behind a clear application-centric interface.

3. Visual Personality

KR0N should feel:

premium

technical

precise

calm

confident

modern

developer-native

slightly futuristic

editorial

understated

highly intentional

KR0N should NOT feel:

generic SaaS

AI-generated

cyberpunk

gaming UI

crypto UI

neon futuristic

overly glassy

overly rounded

template-driven

childish

visually noisy

4. Inspiration DNA

KR0N is informed by the design principles of:

Railway

Use for:

product storytelling

deployment/release narratives

timeline/rail concepts

infrastructure relationships

visual progression

Do not copy:

layouts

branding

exact illustrations

exact components

Cursor

Use for:

product UI as visual storytelling

believable developer workflows

interactive product demonstrations

software states as visual material

Do not copy:

exact product UI

exact visual effects

exact composition

Linear

Use for:

restraint

typography

spacing

calm information density

refined dark surfaces

consistency

Do not turn KR0N into a Linear clone.

Raycast

Use for:

command-driven interactions

keyboard-first moments

interaction as branding

polished micro-interactions

Resend

Use for:

black/white technical composition

developer-native presentation

strong dark components

code as visual material

storytelling through scroll

These are references, not templates.

5. Core Visual Rule

Black is the foundation. White is the signal.

The visual system should primarily use:

deep black

near-black

charcoal

graphite

gunmetal

smoke

muted silver

cool off-white

pure white

Avoid building the entire interface out of #000000.

Different dark surfaces should create depth.

Example conceptual hierarchy:

PAGE
  ↓
DEEP BLACK
  ↓
GRAPHITE SURFACE
  ↓
GUNMETAL / INNER SURFACE
  ↓
WHITE / OFF-WHITE CONTENT
  ↓
PURE WHITE EMPHASIS

The exact values should be defined in the project's Tailwind theme and shared across all pages.

Do not independently invent colors on individual screens.

6. Accent Color Policy

KR0N is primarily monochrome.

Indigo/purple or other accent colors may exist only where they communicate a functional state or existing product requirement.

They must NOT become the visual identity.

Avoid:

purple gradients

blue gradients

neon cyan

rainbow accents

colorful glowing cards

gradient text

If an accent is used, it should be:

sparse

purposeful

low saturation

subordinate to black and white

7. Typography

Typography is one of KR0N's strongest visual tools.

Use the project's existing typography system wherever possible.

The system should distinguish:

Display

For:

landing headlines

major page statements

major product moments

Characteristics:

large

confident

tight but controlled tracking

strong contrast

not excessively bold everywhere

Interface

For:

navigation

controls

cards

labels

forms

application content

Characteristics:

highly readable

neutral

compact

consistent

Technical / Monospace

For:

versions

deployment IDs

commands

code

technical values

timestamps

URLs

system states

Use monospace intentionally, not decoratively.

8. Typography Hierarchy

Avoid making every element bold.

Recommended hierarchy:

DISPLAY
Large, high-impact statement

TITLE
Page / section heading

SUBTITLE
Short explanation

BODY
Readable product explanation

LABEL
Small utility information

TECHNICAL
Version / ID / status / code

Micro labels may use uppercase + tracking, but do not overuse them.

Do not turn entire pages into uppercase text.

9. Spacing

KR0N should feel spacious but not empty.

Use a consistent spacing scale through Tailwind.

Important principle:

Whitespace should create hierarchy, not dead space.

Good whitespace:

separates ideas

frames important visuals

gives typography room

improves scanning

Bad whitespace:

leaves large blank regions with no visual purpose

makes the page feel unfinished

separates related content too far

exists only because the layout was not composed properly

For dense product pages:

use tighter spacing

group related information

prioritize scanability

For marketing pages:

use more breathing room

but maintain visual objects throughout the viewport

10. Layout Philosophy

KR0N does not use one universal page template.

Different pages should have different compositions while sharing the same design language.

Allowed compositions:

asymmetric split

editorial column

centered statement

full-width visual

timeline

technical rail

command surface

data table

product canvas

side panel

drawer

dense operational view

sticky section

full-bleed brand moment

Do NOT default every page to:

heading
↓
three cards
↓
four cards
↓
CTA

11. Component Philosophy

Components should be reused at the system level, but not every page should look identical.

Reusable primitives include:

Button

Input

Select

Tabs

Badge

Status

Tooltip

Modal

Drawer

Dropdown

Command menu

Table

Code block

Breadcrumb

Navigation

Empty state

Toast

Progress / release indicator

These primitives should share:

typography

border language

radius

focus state

spacing

interaction timing

colors

But larger compositions should be page-specific.

12. Cards

Cards are NOT the default KR0N visual language.

Use cards when the content is genuinely a contained object.

Good uses:

service summary

deployment item

configuration group

documentation category

settings section

focused product surface

Avoid:

putting every section inside a rounded card

stacking many identical cards

huge rounded rectangles containing simple text

cards purely for decoration

Prefer raw surfaces, dividers, typography, rails, tables, and composition when appropriate.

13. Border Language

Borders should be:

thin

subtle

precise

low opacity

Use borders to establish structure, not decoration.

Avoid:

thick borders

glowing borders

multiple nested borders

borders around everything

A border should answer:

What relationship or boundary does this line communicate?

14. Radius

Use restrained rounding.

Suggested hierarchy:

page-level surfaces: modest rounding or none

cards: medium radius

controls: small/medium radius

pills: only when semantically appropriate

Avoid excessive rounded-2xl / rounded-3xl usage.

KR0N should feel engineered rather than bubbly.

15. Shadows

Prefer subtle layering over heavy shadows.

Use shadows sparingly.

Depth can come from:

background value changes

borders

surface contrast

overlap

spacing

Avoid:

large black shadows on black

colorful glows

neon shadows

excessive elevation

16. Navigation

Navigation should be calm and highly usable.

Public navigation

Typically:

KR0N

Product

Docs

Pricing if available

Log in

Get started

Only link to routes that actually exist.

Application navigation

Application pages may use:

organization context

project picker

environment picker

service picker

contextual breadcrumbs

compact side navigation where needed

Do not force a huge permanent sidebar onto every screen.

17. Application Information Architecture

The primary mental model is:

Organization
    ↓
Project
    ↓
Environment
    ↓
Service
    ↓
Deployment / Release

Use these concepts consistently across the application.

Do not randomly rename the same concept between pages.

18. Product Surfaces

Product UI should feel real.

When showing:

deployments

services

environments

releases

logs

metrics

domains

configuration

resources

use believable application states.

Avoid meaningless fake dashboards.

Avoid fabricated metrics unless clearly illustrative.

Do not invent functionality that the product does not actually have.

19. Deployment Visual Language

Deployment is one of KR0N's strongest visual concepts.

Use the release lifecycle:

SOURCE
   ↓
BUILD
   ↓
VERIFY
   ↓
RELEASE
   ↓
LIVE

This may appear as:

timeline

rail

status sequence

deployment drawer

release history

activity visualization

It should not always be represented in exactly the same way.

20. Status Language

Use simple human-readable states.

Examples:

Queued

Building

Verifying

Deploying

Health checking

Active

Failed

Rolled back

Do not expose low-level infrastructure terminology unless the user actually needs it.

Failure UX should answer:

What happened?

Why?

What should I do?

Is the stable version still safe?

21. Landing Page Design Language

The landing page is a marketing experience.

Its goal is:

attraction → understanding → desire → action

It should not attempt to expose every product feature.

The landing page should use varied visual scenes.

Preferred rhythm:

EDITORIAL HERO
      ↓
TYPOGRAPHIC STATEMENT
      ↓
RELEASE / TIMELINE VISUAL
      ↓
COMMAND INTERACTION
      ↓
CODE / PRODUCT COMPOSITION
      ↓
CAPABILITY TYPOGRAPHY
      ↓
OPERATIONAL PRODUCT SURFACE
      ↓
BRAND MOMENT
      ↓
FINAL CTA

Not every future landing page section must follow this exact order, but the principle of visual variation must remain.

22. Landing Page Hero

The current KR0N hero uses:

Left

positioning

large headline

supporting text

CTA

Right

KR0N wordmark / TechText visual

The KR0N wordmark is a visual object, not a card.

It should not be surrounded by:

HUD

particles

extra labels

fake metrics

decorative boxes

The current TechText animation may provide the visual movement.

Future custom logo/text hover animation may be layered on top.

23. Animation Philosophy

KR0N supports sophisticated motion.

Motion should communicate:

state

progression

focus

hierarchy

relationship

interaction

Good examples:

release marker moving through a deployment rail

command result appearing after input

code becoming a release state

active deployment state changing

subtle section transitions

typography responding to scroll

data rows updating

lines drawing between related objects

Motion should not exist merely because animation is possible.

24. Animation Intensity

Use three levels.

Level 1 — Ambient

Slow, subtle:

line movement

background shift

very light field motion

Level 2 — Interactive

Responsive:

hover

focus

press

command selection

status transition

Level 3 — Cinematic

Reserved for:

landing page hero

release storytelling

major brand moments

Even cinematic motion must remain controlled.

25. Reduced Motion

Every animated component must support:

prefers-reduced-motion: reduce

When reduced motion is enabled:

remove continuous movement

reduce scroll-linked motion

preserve state changes

preserve visual hierarchy

keep content fully usable

26. Docs Design

Docs must feel like KR0N, not a generic Markdown renderer.

The Docs page should share:

black/graphite surfaces

white typography

technical monospace

precise borders

restrained radius

quiet navigation

strong code blocks

Docs can be denser than marketing pages.

Prioritize:

readability

scanning

code clarity

navigation

hierarchy

Do not inject landing-page animations into normal documentation content.

27. Dashboard Design

The dashboard is more functional and information-dense than the landing page.

Use:

clear application hierarchy

project/service/deployment relationships

useful status summaries

recent activity

clear primary actions

The dashboard should still feel premium, but utility comes first.

Do not turn it into a marketing page.

28. Projects Canvas

Projects may use a more visual canvas.

Allowed:

subtle dot/grid background

draggable project cards

service relationships

project navigation

search

Requirements:

cards remain inside the real canvas bounds

no artificial forbidden movement zones

search/navigation layer remains usable

stacking and z-index are intentional

default positions are clean

cards remain compact and readable

The canvas may be visually expressive while retaining application usability.

29. Service Pages

The service is the primary operational object.

A service page may contain:

service identity

environment

current release

deployment status

live URL

domains

logs

configuration

resources

release history

Use contextual navigation rather than excessive chrome.

30. Deployment Pages

Deployment pages should emphasize:

release identity

lifecycle

status

logs

health

rollback

relevant configuration

Use the deployment rail language where useful.

Avoid overwhelming users with raw infrastructure implementation details.

31. Tables

Tables should be clean and technical.

Use:

subtle row dividers

strong column hierarchy

compact metadata

monospace where useful

restrained hover state

Avoid:

every row inside its own card

excessive colored badges

heavy shadows

huge row heights

32. Forms and Settings

Forms should feel calm and precise.

Use:

clear labels

short descriptions

grouped settings

subtle borders

visible focus

clear validation

explicit destructive actions

Avoid:

oversized inputs

excessive rounded containers

decorative illustrations inside functional forms

33. Empty States

Empty states should be useful, not decorative.

Include:

what is missing

why it matters

one clear next action

Avoid giant empty illustrations.

A small technical visual may be used if it communicates the product state.

34. Error States

Errors must be written in plain English.

Structure:

What happened
Why it happened
What you can do

Where applicable:

Your previous version is still serving traffic.

Avoid exposing implementation jargon unless necessary.

35. Accessibility

All KR0N pages must have:

semantic HTML

correct button/link semantics

keyboard navigation

visible focus states

accessible labels

adequate contrast

reduced-motion support

responsive layouts

Do not sacrifice usability for visual effects.

36. Responsive Design

Do not simply shrink desktop layouts.

Desktop

Full art direction.

Tablet

Preserve hierarchy while simplifying composition.

Mobile

Recompose intentionally.

Examples:

horizontal release rails may become vertical

asymmetric hero may stack

dense operational surfaces may simplify

side navigation may become contextual navigation

large typography must remain readable

decorative motion should reduce

Avoid page-level horizontal overflow.

37. Tailwind CSS

Tailwind is the standard styling system.

Use:

shared Tailwind tokens

reusable utility patterns

semantic component classes where appropriate

consistent responsive breakpoints

Do not create separate styling systems for individual pages.

Do not scatter arbitrary values when a shared token should exist.

38. Component Architecture

Prefer:

components/
├── ui/
├── navigation/
├── landing/
├── deployment/
├── services/
└── ...

Routes belong in:

app/

Shared components belong in:

components/

Business logic/utilities belong in:

lib/

Do not create duplicate versions of the same shared component.

39. Design Token Principle

All major visual decisions should be centralized.

At minimum, define shared tokens for:

page background

surface

elevated surface

text primary

text secondary

text muted

border

focus

success

warning

error

spacing

radius

typography

motion duration

A page should not independently invent:

background: #111
border: #222
text: #eee

if those values already exist as system tokens.

40. Anti-Pattern Checklist

Never let KR0N drift into:

generic AI SaaS

purple gradient hero

neon cyberpunk

glassmorphism everywhere

giant floating dashboard

repeated feature-card grids

identical rounded boxes

decorative fake metrics

meaningless graphs

random particles

constant parallax

excessive blur

huge empty black sections

excessive empty whitespace without purpose

fake infrastructure jargon

fabricated product capabilities

over-animated application UI

inconsistent page-specific colors

inconsistent radius

inconsistent typography

41. Quality Test For Every New Page

Before shipping a new screen, ask:

Brand

Does it immediately feel like KR0N?

Visual

Does it use the black/graphite/white system correctly?

Composition

Is the page visually composed, or just assembled from components?

Repetition

Are cards being used because they are appropriate, or because they are easy?

Product

Does the UI represent a real product state?

Typography

Is hierarchy clear?

Spacing

Is whitespace intentional?

Motion

Does animation communicate something?

Engineering

Are shared components and tokens being reused?

Accessibility

Can the interface be used without relying on animation?

Responsive

Does it remain intentional on smaller screens?

42. Final KR0N Design Principle

KR0N should feel like:

serious software with a distinct visual identity.

Not a marketing template.

Not a dashboard template.

Not an AI-generated SaaS interface.

The design should consistently combine:

BLACK
+
WHITE
+
GRAPHITE
+
PRECISION
+
TYPOGRAPHY
+
REAL PRODUCT SURFACES
+
TECHNICAL MOTION
+
RESTRAINT

The landing page may be cinematic.

The dashboard may be dense.

The Docs may be editorial.

The Projects page may be spatial.

The Service page may be operational.

But they must all feel like they were designed by the same product team for the same product.