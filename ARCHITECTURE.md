# KR0N — Complete Frontend Architecture, Routes & Page Specification

## 0. Frontend Goal

KR0N should feel like a serious developer platform where a developer can:

* create an organization
* create projects
* create environments
* connect GitHub
* create services
* deploy applications
* monitor deployments
* inspect logs
* inspect metrics
* manage domains
* manage environment variables
* manage persistent storage
* investigate alerts/incidents
* understand usage and quotas
* manage billing
* manage team access
* manage API credentials
* inspect audit activity

The frontend must **not** feel like a Kubernetes dashboard.

The user mental model is:

```text
Organization
    ↓
Project
    ↓
Environment
    ↓
Service
    ↓
Deployment
```

Additional resources attach naturally to those concepts:

```text
Service
├── Deployments
├── Logs
├── Metrics / Traces
├── Domains
├── Environment Variables
├── Volumes
└── Settings
```

The PRD explicitly defines Kubernetes, nodes, pods, controllers, build workers, etc. as implementation details rather than customer-facing product concepts.

---

# 1. MASTER ROUTE TREE

## Public

```text
/
├── /login
├── /signup
└── /auth/github/callback
```

## Application

```text
/app
│
├── /app
│
├── /app/projects/:projectId
│
├── /app/projects/:projectId/services/:serviceId
│
├── /app/projects/:projectId/services/:serviceId/deployments
│
├── /app/projects/:projectId/services/:serviceId/deployments/:deploymentId
│
├── /app/projects/:projectId/services/:serviceId/logs
│
├── /app/projects/:projectId/services/:serviceId/metrics
│
├── /app/projects/:projectId/services/:serviceId/settings
│
├── /app/projects/:projectId/settings
│
├── /app/alerts
│
├── /app/incidents/:incidentId
│
├── /app/usage
│
├── /app/billing
│
└── /app/settings
```

The PRD's complete persistent route list is exactly this structure; it deliberately excludes standalone pages for Kubernetes, clusters, nodes, pods, namespaces, templates, variables, domains, volumes, environments, etc.

---

# 2. FRONTEND APP STRUCTURE

Recommended conceptual structure:

```text
src/
│
├── app/
│   ├── routes/
│   ├── layouts/
│   └── providers/
│
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── deployment/
│   ├── service/
│   ├── project/
│   ├── observability/
│   ├── settings/
│   └── billing/
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── environments/
│   ├── services/
│   ├── deployments/
│   ├── logs/
│   ├── metrics/
│   ├── alerts/
│   ├── incidents/
│   ├── usage/
│   ├── billing/
│   └── settings/
│
├── lib/
│   ├── api/
│   ├── formatting/
│   ├── validation/
│   └── utils/
│
└── styles/
    ├── tokens
    ├── globals
    └── themes
```

The exact framework structure should follow the actual stack, but the architectural principle should remain:

**shared primitives → domain components → page composition.**

Do not create one-off UI components for every page.

---

# 3. GLOBAL APPLICATION SHELL

Every authenticated page should live inside the same application shell.

## Desktop shell

```text
┌─────────────────────────────────────────────────────────────┐
│ KR0N        Organization ▼     Project / Env      Avatar ▼ │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Projects     │                                              │
│ Alerts       │              PAGE CONTENT                    │
│ Usage        │                                              │
│ Billing      │                                              │
│ Settings     │                                              │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## Global sidebar

Primary destinations:

```text
Projects
Alerts
Usage
Billing
Settings
```

## Top bar

Contains:

* organization switcher
* project context when applicable
* environment context when applicable
* notifications
* user menu

Inside a project, the navigation should become more contextual rather than constantly showing a huge global navigation. This follows the PRD's global-shell rules.

---

# 4. `/` — LANDING PAGE

## Purpose

Explain KR0N quickly.

This is not a technical dashboard.

The user should understand:

> KR0N lets developers deploy and operate applications without managing Kubernetes or infrastructure directly.

The PRD specifically says the landing page should explain deployment/operation without exposing architecture internals as the main product story.

## Page structure

### Navbar

```text
KR0N

Product
Docs
Pricing

Log in
Get started
```

Keep this restrained.

Do not create 15 navigation links.

---

## Hero

### Eyebrow

```text
APPLICATION INFRASTRUCTURE, WITHOUT THE INFRASTRUCTURE WORK
```

### Headline

Something conceptually like:

```text
Build it.
Ship it.
Let kr0n run it.
```

### Supporting copy

```text
Deploy and operate your applications without managing
clusters, infrastructure, or deployment machinery.
```

### Actions

```text
Get started
View documentation
```

---

## Product visualization

Instead of a generic SaaS illustration:

Show a sophisticated application deployment surface:

```text
service
    ↓
build
    ↓
security checks
    ↓
deployment
    ↓
healthy
```

The visual should communicate the product itself.

---

## Capability sections

### Deploy

GitHub → build → deploy.

### Operate

Logs, metrics, health, deployments.

### Protect

Security checks, provenance, vulnerability information.

### Scale

Resources, environments, quotas.

---

## Final CTA

```text
Your application.
Your code.
The infrastructure handled.
```

CTA:

```text
Start building
```

---

# 5. `/login` — LOGIN

## Layout

Split-screen or centered premium auth surface.

Avoid a generic template.

## Content

```text
Welcome back

Sign in to your kr0n workspace.
```

### Fields

```text
Email
Password
```

### Actions

```text
Log in
Continue with GitHub
```

### Secondary

```text
Forgot password?
Don't have an account? Sign up
```

## States

### Invalid credentials

```text
We couldn't sign you in.

Check your email and password and try again.
```

### GitHub failure

```text
GitHub authentication could not be completed.

Try again or continue with email.
```

---

# 6. `/signup` — SIGN UP

## Content

```text
Create your kr0n account

Start building your first application.
```

Fields:

```text
Email
Password
Confirm password
```

Actions:

```text
Create account
Continue with GitHub
```

Footer:

```text
Already have an account? Log in
```

After successful signup:

```text
→ organization setup
→ first project
→ first service
```

The PRD explicitly expects signup to enter the application and then create/select an organization.

---

# 7. FIRST-RUN ONBOARDING

Do **not** create a permanent `/onboarding` route initially.

Use a guided modal/wizard.

## Step 1 — Organization

```text
Create your organization

Organization name
```

---

## Step 2 — GitHub

```text
Connect GitHub

Connect GitHub to deploy repositories directly from kr0n.

[Connect GitHub]

Skip for now
```

---

## Step 3 — Project

```text
Create your first project

Project name
Environment
```

---

## Step 4 — Service

Launch:

```text
Add Service Wizard
```

This keeps onboarding short and avoids creating unnecessary persistent routes.

---

# 8. `/app` — DASHBOARD / PROJECTS

This is the authenticated home.

## Header

```text
Projects

Your applications and environments.
```

Actions:

```text
Search
+ Create Project
```

---

## Project cards

Each card should show:

```text
Project Name

Production      ● Healthy

3 services
2 deployments today

Updated 8 min ago
```

Possible secondary information:

```text
Services
Current deployment
Health
Environment count
```

The PRD explicitly calls for project cards/listing with environment summary, service count, deployment/health information, search, recent activity, global alerts, and compact usage/quota information.

---

## Dashboard sections

### Projects

Main content.

### Recent activity

```text
deployment completed
service restarted
domain verified
member invited
```

### Usage snapshot

```text
Compute       62%
Memory        48%
Storage       71%
Network       31%
```

### Alert summary

```text
2 active alerts
```

---

# 9. CREATE PROJECT MODAL

Triggered by:

```text
+ Create Project
```

## Fields

```text
Project name
Description
Initial environment
```

Default:

```text
Production
```

## CTA

```text
Create project
```

After creation:

```text
→ /app/projects/:projectId
```

---

# 10. `/app/projects/:projectId` — PROJECT OVERVIEW

This is one of the most important pages.

## Header

```text
Projects / Atlas

Atlas

Production ▼

[Deploy] [+ Add Service] [...]
```

---

## Project summary

```text
Production
● Healthy

4 Services
3 Deployments today
1 active alert
```

---

## Environment selector

```text
Production
Staging
Preview
```

Fast environment switching should happen here rather than creating a separate environment page.

---

# 11. SERVICE GRID / LIST

Each service card:

```text
┌──────────────────────────────┐
│ api                    ●     │
│ Long-running                 │
│                              │
│ v42 · deployed 4m ago        │
│ https://api.kr0n.app         │
│                              │
│ CPU    21%                   │
│ RAM    38%                   │
│ 2 instances                  │
│                              │
│ View service →               │
└──────────────────────────────┘
```

Actions:

```text
Open
Deploy
Restart
More
```

---

# 12. PROJECT ACTIVITY

Show:

```text
2 min ago
api deployed v42

18 min ago
web deployment completed

1 hr ago
database volume attached
```

Keep this human-readable.

---

# 13. EMPTY PROJECT STATE

If no services exist:

```text
Nothing is running here yet.

Create your first service and deploy your application.

[Add Service]
```

The PRD explicitly specifies this type of empty state.

---

# 14. CREATE ENVIRONMENT MODAL

Not a page.

```text
Create environment

Name
Description

Environment type
Production / Staging / Preview
```

CTA:

```text
Create environment
```

---

# 15. ADD SERVICE WIZARD

This is one of KR0N's most important frontend workflows.

It should be a large modal/wizard or full-screen workspace depending on implementation.

## Step 1 — Choose source

```text
Add a service

What are you deploying?
```

Options:

```text
GitHub repository
Docker / custom source
Infrastructure template
```

---

# 16. ADD SERVICE — GITHUB

## Step 2

```text
Choose repository

GitHub account
Organization
Repository
Branch
```

Actions:

```text
Connect GitHub
```

If connected:

```text
Search repositories
```

---

# 17. ADD SERVICE — DETECTION

After repository selection:

```text
We detected your application.
```

Show:

```text
Language       TypeScript
Framework      Next.js
Build          npm run build
Start          npm start
Port           3000
```

Confidence where useful.

Allow:

```text
Use detected configuration
Edit configuration
```

The PRD explicitly calls for detection of language/framework/build strategy/runtime/output type.

---

# 18. ADD SERVICE — CONFIGURATION

Fields:

```text
Service name
Root directory

Build command
Start command

Port

Health check path
Health check timeout

Resource tier
```

Advanced settings should be collapsed.

---

# 19. ADD SERVICE — ENVIRONMENT VARIABLES

```text
Environment variables
```

Rows:

```text
DATABASE_URL        •••••••
API_KEY             •••••••
NODE_ENV            production
```

Actions:

```text
+ Add variable
```

Secrets masked.

---

# 20. ADD SERVICE — REVIEW

Summary:

```text
Service
api

Source
github.com/company/api
main

Runtime
Long-running

Resources
2 CPU
4 GB memory
2 instances

Networking
kr0n generated URL

Environment
Production
```

CTA:

```text
Deploy service
```

---

# 21. ADD SERVICE — DEPLOYMENT START

After submission:

Do not say:

```text
Deployment successful
```

immediately.

Instead:

```text
Deployment requested

kr0n is preparing your deployment.
```

Then show:

```text
Queued
↓
Building
↓
Security checks
↓
Deploying
↓
Health checking
↓
Active
```

The PRD explicitly requires reconciliation/progress instead of pretending an accepted request is immediately healthy.

---

# 22. `/app/projects/:projectId/services/:serviceId` — SERVICE OVERVIEW

This is arguably the **core KR0N page**.

## Service header

```text
Atlas / Production / api

api

● Healthy

Long-running

https://api.kr0n.app
```

Actions:

```text
Deploy
Restart
Rollback
More
```

---

# 23. SERVICE SUMMARY

## Current deployment

```text
v42

main · a81c3d9

Deployed 4 minutes ago

● Active
```

---

## Health

```text
Health

● Healthy

Last health check
12 sec ago

Response
200 OK
```

---

## Resources

```text
CPU        21%
Memory     38%
Network    2.4 GB
Instances  2
```

---

## Networking

```text
Production URL
https://api.kr0n.app

TLS
● Active

Custom domains
1
```

---

## Storage

```text
Persistent storage

postgres-data
20 GB
Mounted at /data
● Healthy
```

---

## Recent deployments

```text
v42   Active
v41   Rolled back
v40   Active
```

---

## Recent alerts

```text
Memory usage exceeded 80%
12 min ago
```

---

## Logs preview

```text
10:32:12  GET /api/users 200 24ms
10:32:11  GET /api/projects 200 31ms
10:32:08  Worker started
```

CTA:

```text
View logs
```

The PRD calls for current deployment, health, resource usage, networking, volumes, deployments, alerts and recent logs on this page.

---

# 24. SERVICE ACTION MENU

Dropdown:

```text
Deploy
Redeploy
Restart
Rollback

Edit configuration

Deployments
Logs
Metrics

Delete service
```

If deletion:

```text
Delete service?

This will stop the service and remove its deployment.

Persistent volumes are independent and will not be
deleted automatically.

[Cancel] [Delete service]
```

This distinction is explicitly required by the PRD.

---

# 25. SERVICE TABS

Recommended service navigation:

```text
Overview
Deployments
Logs
Metrics
Settings
```

This is cleaner than turning every service resource into a top-level page.

---

# 26. `/deployments` — DEPLOYMENT HISTORY

## Header

```text
Deployments

Every version deployed to api.
```

Actions:

```text
Deploy
```

---

## Filters

```text
Status
Branch
Time
```

---

## Deployment table

Columns:

```text
Version
Status
Commit
Branch
Triggered by
Created
Duration
```

Example:

```text
v42     ● Active       a81c3d9    main    Guru      4m ago
v41     ↩ Rolled back  73ca9d2    main    Guru      2h ago
v40     ● Active       98ab1e4    main    GitHub    1d ago
```

Each row:

```text
View
Rollback
```

---

# 27. `/deployments/:deploymentId` — DEPLOYMENT DETAILS

This page should be highly polished.

## Header

```text
Deployment v42

● Active

main
a81c3d9

Created 4 minutes ago
Triggered by GitHub
```

Actions:

```text
Redeploy
Rollback
View logs
```

---

# 28. DEPLOYMENT LIFECYCLE TIMELINE

Primary visual:

```text
✓ Queued
    ↓
✓ Building
    ↓
✓ Built
    ↓
✓ Security checks
    ↓
✓ Planning
    ↓
✓ Deploying
    ↓
✓ Health checking
    ↓
● Active
```

Failed deployment:

```text
✓ Queued
✓ Building
✕ Build failed
```

The PRD defines these reconciliation stages and requires the UI to distinguish requested/reconciling state from healthy/active state.

---

# 29. DEPLOYMENT BUILD INFORMATION

Show:

```text
Build duration
2m 14s

Build command
npm run build

Artifact
sha256:...

Source
a81c3d9
```

---

# 30. SECURITY RESULTS

Section:

```text
Security checks
```

Cards:

```text
SBOM                 ✓ Complete
Vulnerability scan   ✓ Passed
Provenance           ✓ Verified
Signature            ✓ Verified
Admission            ✓ Passed
```

The PRD explicitly includes SBOM, vulnerability scanning, provenance/attestation, signatures and admission as deployment lifecycle/security information.

---

# 31. DEPLOYMENT HEALTH

```text
Health checking

Startup              4.2s
Readiness             ✓
HTTP health           ✓
Instances             2/2 healthy
```

---

# 32. FAILED DEPLOYMENT PAGE STATE

Never just show:

```text
Deployment failed.
```

Use:

```text
Build failed

Your application could not be built.

Why this happened
The build command exited with code 1.

Affected
api / deployment v43

Likely cause
TypeScript compilation failed.

Next action
Review the build logs and fix the reported error.

[View build logs]
```

The PRD defines this exact error philosophy: what happened, why, affected resource, likely cause, and next action.

---

# 33. ROLLBACK FLOW

From deployment history:

```text
Rollback to v41?
```

Show:

```text
Current
v42

Target
v41

Traffic will remain protected until the
replacement deployment passes health checks.
```

CTA:

```text
Confirm rollback
```

Rollback should create a new desired deployment toward the previous version rather than pretending history itself has been rewritten.

---

# 34. `/logs` — LOGS

This should feel like a professional developer terminal, not a random black rectangle.

## Header

```text
Logs

api / Production
```

Controls:

```text
Live
Pause

Deployment ▼
Instance ▼

Search logs
```

---

## Log viewer

```text
10:42:12.231  INFO   GET /api/users     200   24ms
10:42:12.102  INFO   GET /api/projects  200   31ms
10:42:11.884  WARN   cache miss
10:42:10.442  INFO   worker started
```

Use:

* monospace
* aligned timestamps
* structured metadata
* selectable text
* horizontal scrolling only inside log area

---

## Empty state

```text
No logs yet.

Logs will appear when this service starts running.
```

---

# 35. LOG STATES

### Live

```text
● Live
```

### Paused

```text
Ⅱ Paused
```

### Rate limited

```text
Log volume is currently capped.

Some entries may not be displayed.
```

The PRD explicitly requires live streaming, historical search, pause/resume, filtering, deployment/instance selection, timestamps, metadata and volume warnings.

---

# 36. `/metrics` — METRICS + TRACES

Do not create a separate traces page.

Use:

```text
Metrics
Traces
```

as internal sections/tabs.

The PRD specifically says traces should initially live inside Metrics.

---

## Header

```text
Metrics

api / Production

Last 24 hours ▼
```

---

## Metric cards

```text
CPU
21%

Memory
38%

Requests
12.4k

Latency
84ms

Errors
0.4%

Network
2.4 GB
```

---

## Charts

### CPU

Time-series.

### Memory

Time-series.

### Requests

Requests per minute.

### Latency

P50 / P95 / P99.

### Errors

Error rate.

---

## Deployment markers

Charts should optionally show:

```text
v42 deployed
```

on the timeline.

---

## Serverless-specific metrics

Only when applicable:

```text
Invocations
Cold starts
Concurrency
```

Do not show serverless metrics on a long-running service.

---

# 37. `/settings` — SERVICE SETTINGS

This is a dense but organized page.

Sections:

```text
General
Source
Build & Deploy
Environment Variables
Networking
Resources
Health
Storage
Danger Zone
```

---

# 38. GENERAL

```text
Service name
Service identifier
Runtime
Environment
```

Inline editing or small modal.

---

# 39. SOURCE

```text
GitHub repository
Branch
Root directory
Auto deploy
```

Example:

```text
github.com/kr0n-labs/api

main

Auto deploy
● Enabled
```

---

# 40. BUILD & DEPLOY

```text
Framework
Build command
Start command
Port
Dockerfile
```

Advanced:

```text
Advanced configuration
⌄
```

Keep advanced controls collapsed by default.

---

# 41. ENVIRONMENT VARIABLES

Table:

```text
NAME                 VALUE
DATABASE_URL         •••••••••
JWT_SECRET           •••••••••
NODE_ENV             production
```

Actions:

```text
+ Add variable
```

---

# 42. NETWORKING

Show:

```text
Platform URL
Custom domains
TLS
Internal connectivity
Traffic
```

Custom domain flow:

```text
+ Add domain
```

---

# 43. DOMAIN MODAL

```text
Add custom domain

Domain
api.example.com
```

After submission:

```text
DNS verification required

Type: CNAME
Name: api
Value: ...
```

Do not expose internal proxy/DNS architecture.

The PRD explicitly says to show DNS/TLS state while hiding raw implementation details.

---

# 44. RESOURCES

Show controls allowed by the platform:

```text
CPU
Memory
Instances
Storage
Resource tier
```

When quota blocks the change:

```text
This resource configuration exceeds your project quota.

Current memory:
7.8 GB / 8 GB

Required:
2 GB additional

[View usage]
[View billing]
```

---

# 45. HEALTH

```text
Health check path
Port
Timeout
Failure threshold
Success threshold
```

---

# 46. STORAGE

Show volumes:

```text
postgres-data
20 GB
/data
● Attached
```

Actions:

```text
Create volume
Attach volume
Detach
```

---

# 47. VOLUME CREATION MODAL

```text
Create persistent volume

Name
Size
Mount path
```

Explain:

```text
Persistent storage has an independent lifecycle
from the service using it.
```

This independence is a core PRD rule.

---

# 48. DANGER ZONE

```text
Delete service
```

Use an intentionally visually separated danger section.

Confirmation must explicitly explain what happens to persistent volumes.

---

# 49. `/app/projects/:projectId/settings` — PROJECT SETTINGS

Sections:

```text
General
Configuration
Access
Activity
Danger Zone
```

## General

```text
Project name
Description
```

## Configuration

Only project-level configuration actually supported by the backend.

## Access

Only if project-scoped permissions exist.

Otherwise:

```text
Manage organization members in Organization Settings.
```

## Danger Zone

```text
Delete project
```

Explain affected services/resources before confirmation.

---

# 50. `/app/alerts` — ALERTS

Global operational inbox.

## Header

```text
Alerts

Everything requiring attention across your organization.
```

Filters:

```text
Status
Severity
Project
Service
Environment
Source
Time
```

---

## Alert row

```text
● Critical

Memory usage exceeded 90%

api / Production

8 minutes ago
```

Possible sources:

```text
Metric
Deployment
Security
Usage
Billing
Platform
```

The PRD calls for firing, acknowledged and resolved alerts with project/service/environment context and deduplicated/grouped presentation.

---

# 51. ALERT EMPTY STATE

Do not say:

```text
No data.
```

Say:

```text
Everything looks quiet.

No active alerts across your organization.
```

This follows the PRD's requirement to make a no-alert state feel like a healthy state.

---

# 52. `/app/incidents/:incidentId` — INCIDENT DETAILS

## Header

```text
Incident

● Investigating

API latency increased
```

Show:

```text
Severity
Affected services
Started
Duration
```

---

## Affected resources

```text
Atlas / Production / api
```

---

## Related alerts

```text
Latency > 500ms
Error rate increased
```

---

## Timeline

```text
10:12 Deployment v42 started
10:14 Health degradation detected
10:15 Latency alert triggered
10:18 Incident acknowledged
```

---

## Related deployments

```text
v42
```

---

## Diagnostics

Links:

```text
View logs
View metrics
View deployment
```

Do not fake automated root-cause analysis in V1; the PRD explicitly treats advanced incident reconstruction as future scope.

---

# 53. `/app/usage` — USAGE + QUOTAS

This should be a highly visual analytics page.

## Header

```text
Usage

September 2026
```

Period:

```text
Today
7 days
30 days
Custom
```

---

## Usage cards

```text
Compute
72.4 CPU-hours

Memory
184 GB-hours

Storage
84 GB

Network
212 GB

Build
31 minutes
```

---

## Quota visualization

```text
Memory

7.8 GB / 8 GB
███████████████████░
97.5%
```

---

# 54. QUOTA EXCEEDED STATE

This must be explicit.

```text
Deployment rejected

Project memory quota exceeded.

Current
7.8 GB / 8 GB

Required
2 GB additional

To continue:

Reduce resource usage
or increase your entitlement.
```

Actions:

```text
View usage
View billing
```

The PRD defines quota as a hard boundary rather than something that should look like temporary throttling.

---

# 55. `/app/billing` — BILLING

## Header

```text
Billing
```

---

## Current plan

```text
Developer

Current billing period
Sep 1 – Sep 30

Next billing date
Oct 1
```

---

## Entitlements

```text
Compute
Memory
Storage
Network
Build resources
```

---

## Usage summary

Link to:

```text
View detailed usage
```

---

## Plan management

```text
Manage plan
```

This may open a modal or external checkout until billing becomes complex enough to require its own route.

---

# 56. `/app/settings` — ORGANIZATION / ACCOUNT SETTINGS

This should be a settings workspace with internal sections.

Recommended structure:

```text
Settings
│
├── Account
├── Organization
├── Members
├── Integrations
├── Security
├── API Tokens
└── Audit Log
```

Do not create separate persistent routes unless these workflows become large enough to justify them.

---

# 57. ACCOUNT

```text
Profile

Name
Email
Avatar
```

Session:

```text
Active sessions
```

---

# 58. ORGANIZATION

```text
Organization name
Organization identifier
```

---

# 59. MEMBERS

Table:

```text
Member
Role
Status
Joined
Actions
```

Roles, if implemented:

```text
Owner
Developer
Viewer
```

Actions:

```text
Invite
Change role
Remove
```

The PRD explicitly defines these initial role concepts.

---

# 60. INVITE MEMBER MODAL

```text
Invite member

Email
Role
```

CTA:

```text
Send invitation
```

---

# 61. INTEGRATIONS

GitHub:

```text
GitHub

● Connected

Organizations
Repositories

[Manage connection]
[Disconnect]
```

Disconnected state:

```text
GitHub isn't connected.

Connect GitHub to deploy repositories through kr0n.
```

---

# 62. SECURITY

Sections:

```text
Authentication
Connected accounts
Active sessions
Credentials
```

2FA should only appear if actually implemented.

Do not build fake security controls.

---

# 63. API TOKENS

Table:

```text
Token name
Created
Last used
Status
```

CTA:

```text
Create token
```

---

# 64. CREATE API TOKEN MODAL

```text
Create API token

Token name
```

After creation:

```text
Your token will only be shown once.

kr0n_••••••••••••
```

Actions:

```text
Copy token
Done
```

The PRD specifically requires one-time token visibility.

---

# 65. AUDIT LOG

Table:

```text
Time
Actor
Action
Resource
Details
```

Examples:

```text
10:42  Guru    Deployed       api / v42
09:12  Guru    Added domain   api.example.com
Yesterday      Sam    Changed role    Alex → Developer
```

Filters:

```text
Actor
Action
Resource
Date
```

The PRD specifies audit coverage across authentication, credentials, permissions, deployments, domains, volumes, billing and security actions.

---

# 66. GLOBAL NOTIFICATION SYSTEM

Top-right notification button.

Drawer:

```text
Notifications

● Deployment v42 is active
5 min ago

⚠ Memory usage exceeded 80%
18 min ago

✓ Domain verified
1 hour ago
```

Notifications should link directly to the relevant resource.

---

# 67. GLOBAL SEARCH

Not required for first pass.

But architect for:

```text
Cmd/Ctrl + K
```

Future search:

```text
Search kr0n

Projects
Services
Deployments
Domains
Alerts
Documentation
```

The PRD identifies command/search as optional later functionality.

---

# 68. GLOBAL MODAL SYSTEM

All mutation workflows should use shared modal primitives.

Required:

```text
CreateProjectModal
CreateEnvironmentModal
AddServiceWizard
ConnectGitHubModal
TemplateConfigModal
EnvironmentVariableModal
DomainModal
VolumeModal
RestartConfirmModal
RedeployConfirmModal
RollbackModal
DeleteServiceModal
DeleteVolumeModal
InviteMemberModal
ChangeRoleModal
CreateTokenModal
ManagePlanModal
DisconnectIntegrationModal
```

This keeps persistent routes focused on durable information rather than CRUD screens.

---

# 69. GLOBAL DRAWER SYSTEM

Use drawers for quick inspection.

Examples:

```text
Deployment drawer
Alert drawer
Notification drawer
Log detail drawer
Resource detail drawer
```

A deployment drawer could show:

```text
v42

● Active

Queued ✓
Building ✓
Security ✓
Deploying ✓
Health ✓

[Open deployment]
[Rollback]
```

---

# 70. IMPORTANT STATE SYSTEM

Every page must account for:

```text
Loading
Loaded
Empty
Error
Reconciling
Success
Partial data
Permission denied
Quota blocked
```

Do not only design the happy path.

---

# 71. DEPLOYMENT STATE MACHINE

Frontend state model:

```text
REQUESTED
   ↓
QUEUED
   ↓
BUILDING
   ↓
BUILT
   ↓
SECURITY_CHECKS
   ↓
PLANNING
   ↓
DEPLOYING
   ↓
HEALTH_CHECKING
   ↓
ACTIVE
```

Failure branches:

```text
BUILD_FAILED
REJECTED
UNHEALTHY
ROLLING_BACK
ROLLED_BACK
```

The UI should map backend states to human-readable product language.

---

# 72. RECONCILIATION BANNER

When the API accepted an action but the system has not converged:

```text
Deployment requested

kr0n is preparing your deployment.
```

Do NOT instantly switch to:

```text
Active
```

The PRD explicitly requires the distinction between desired state and observed/healthy state.

---

# 73. QUOTA ERROR SYSTEM

Standard component:

```text
QuotaAlert
```

Structure:

```text
Title
What happened
Current usage
Required capacity
What can be changed
Action
```

Example:

```text
Deployment blocked by memory quota

Current: 7.8 GB / 8 GB
Required: 2 GB additional

Reduce memory elsewhere or increase your entitlement.

[View usage]
```

---

# 74. ERROR COMPONENT

Standard KR0N error pattern:

```text
WHAT HAPPENED
WHY IT HAPPENED
AFFECTED RESOURCE
LIKELY CAUSE
NEXT ACTION
```

Never expose raw infrastructure errors as the primary message.

Bad:

```text
CrashLoopBackOff
```

Better:

```text
Service failed its health checks.

The new deployment did not become healthy, so
kr0n kept the previous healthy version active.

View health checks
View logs
```

---

# 75. RESPONSIVE FRONTEND PLAN

## Desktop

Full application shell.

```text
Sidebar
Topbar
Content
```

## Tablet

Sidebar collapses.

```text
Topbar
Context navigation
Content
```

## Mobile

Use:

```text
Top navigation
Bottom/context navigation
Stacked cards
Full-screen drawers
```

Tables become:

```text
card/list rows
```

Do not simply shrink desktop layouts.

---

# 76. DESIGN SYSTEM

Everything must come from KR0N's design system.

## Color

Base:

```text
Deep black
Near-black
Charcoal
```

Functional accent:

```text
Restrained indigo
```

Semantic:

```text
Success → emerald
Warning → amber
Error → rose
Info → muted blue/slate
```

Indigo should be functional rather than becoming a purple-gradient visual identity.

---

# 77. TYPOGRAPHY

Primary:

```text
Inter / Geist Sans / system sans
```

Technical:

```text
JetBrains Mono
SF Mono
ui-monospace
```

Use monospace for:

* commit hashes
* URLs
* commands
* logs
* IDs
* metrics
* code
* technical values

---

# 78. COMPONENT HIERARCHY

## Primitive

```text
Button
Input
Select
Checkbox
Badge
Tooltip
IconButton
Tabs
```

## Structural

```text
Card
Panel
Drawer
Modal
Table
EmptyState
ErrorState
LoadingState
```

## KR0N-specific

```text
ServiceCard
DeploymentTimeline
DeploymentStatus
HealthIndicator
ResourceMetric
EnvironmentSwitcher
ProjectSwitcher
QuotaIndicator
LogViewer
MetricChart
AlertRow
IncidentTimeline
DomainStatus
VolumeCard
```

---

# 79. PAGE HIERARCHY

Every page should follow:

```text
Context
    ↓
Page title
    ↓
Primary action
    ↓
Summary
    ↓
Primary information
    ↓
Secondary information
    ↓
Related activity
```

Avoid pages that are just giant collections of cards.

---

# 80. CONTENT HIERARCHY

Use three information levels:

### Primary

What is happening?

```text
● Healthy
Deployment v42
```

### Secondary

Why / context?

```text
main · a81c3d9
4 minutes ago
```

### Tertiary

Technical detail:

```text
sha256:...
build duration
health threshold
```

This lets advanced users inspect technical details without overwhelming normal users.

---

# 81. V1 IMPLEMENTATION ORDER

Do **not** build all pages simultaneously.

Build in this order.

## Phase 1 — Foundation

```text
Design tokens
Typography
Colors
Buttons
Inputs
Cards
Modal
Drawer
Table
Tabs
Badges
Navigation
Toast
Loading
Empty
Error
```

---

## Phase 2 — Application shell

Build:

```text
/app
Global sidebar
Topbar
Organization switcher
Project/environment context
Notifications
User menu
```

---

## Phase 3 — Core product loop

Build:

```text
/app
/app/projects/:projectId
/app/projects/:projectId/services/:serviceId
```

Then:

```text
Create Project
Create Environment
Add Service
GitHub connection
Deployment initiation
```

This creates the primary product loop:

```text
Organization
↓
Project
↓
Environment
↓
Service
↓
Deploy
```

---

# 82. PHASE 4 — DEPLOYMENT SYSTEM

Build:

```text
/deployments
/deployments/:deploymentId
```

Implement:

```text
deployment timeline
reconciliation state
build logs
security results
health
rollback
redeploy
```

This is core V1 functionality. The PRD lists organizations/projects/environments/auth/RBAC, GitHub, builds, deployment state and rollback as Phase 1 core functionality.

---

# 83. PHASE 5 — SERVICE OPERATIONS

Build:

```text
/logs
/metrics
/settings
```

Then:

```text
environment variables
domains
TLS
volumes
resource controls
health checks
```

Some of these belong to Phase 2 product completeness according to the PRD, particularly domains, logs/metrics/traces, security, alerts, billing and templates/volumes.

---

# 84. PHASE 6 — ORGANIZATION OPERATIONS

Build:

```text
/alerts
/incidents/:incidentId
/usage
/billing
/settings
```

Then:

```text
RBAC
API tokens
audit logs
integrations
```

---

# 85. PHASE 7 — POLISH

Only after functionality works:

```text
micro-interactions
motion
transitions
hover states
keyboard navigation
responsive refinement
loading skeletons
empty states
error states
visual hierarchy
performance
```

---

# 86. ROUTE → PAGE MAP

| Route                                                                    | Page                            | Priority |
| ------------------------------------------------------------------------ | ------------------------------- | -------- |
| `/`                                                                      | Landing                         | P1       |
| `/login`                                                                 | Login                           | P1       |
| `/signup`                                                                | Signup                          | P1       |
| `/auth/github/callback`                                                  | OAuth callback                  | P1       |
| `/app`                                                                   | Dashboard / Projects            | P1       |
| `/app/projects/:projectId`                                               | Project Overview                | P1       |
| `/app/projects/:projectId/services/:serviceId`                           | Service Overview                | P1       |
| `/app/projects/:projectId/services/:serviceId/deployments`               | Deployment History              | P1       |
| `/app/projects/:projectId/services/:serviceId/deployments/:deploymentId` | Deployment Details              | P1       |
| `/app/projects/:projectId/services/:serviceId/logs`                      | Logs                            | P2       |
| `/app/projects/:projectId/services/:serviceId/metrics`                   | Metrics + Traces                | P2       |
| `/app/projects/:projectId/services/:serviceId/settings`                  | Service Settings                | P1/P2    |
| `/app/projects/:projectId/settings`                                      | Project Settings                | P2       |
| `/app/alerts`                                                            | Alerts                          | P2       |
| `/app/incidents/:incidentId`                                             | Incident Details                | P2       |
| `/app/usage`                                                             | Usage + Quotas                  | P2       |
| `/app/billing`                                                           | Billing                         | P2       |
| `/app/settings`                                                          | Account / Organization Settings | P1/P2    |

---

# 87. WHAT SHOULD NEVER BECOME A PAGE

Do NOT create:

```text
/kubernetes
/clusters
/nodes
/pods
/namespaces
/controllers
/build-workers
/templates
/variables
/domains
/volumes
/environments
/members
/api-tokens
/traces
/serverless
```

These should be represented inside the appropriate product context.

The PRD explicitly rejects these as standalone customer-facing routes.

---

# 88. WHAT KR0N SHOULD FEEL LIKE

The frontend should communicate:

```text
Precise
Calm
Technical
Premium
Fast
Trustworthy
Dense when necessary
Minimal when possible
```

Not:

```text
Generic SaaS
Kubernetes dashboard
Cyberpunk dashboard
AI dashboard
Monitoring-only tool
Marketing template
```

---

# 89. THE CORE USER JOURNEY

The entire frontend should ultimately make this flow extremely natural:

```text
LANDING
   ↓
SIGN UP
   ↓
ORGANIZATION
   ↓
PROJECT
   ↓
ENVIRONMENT
   ↓
ADD SERVICE
   ↓
CONNECT GITHUB
   ↓
SELECT REPOSITORY
   ↓
DETECT APPLICATION
   ↓
CONFIGURE
   ↓
REVIEW
   ↓
DEPLOY
   ↓
QUEUED
   ↓
BUILDING
   ↓
SECURITY CHECKS
   ↓
DEPLOYING
   ↓
HEALTH CHECKING
   ↓
ACTIVE
   ↓
SERVICE OVERVIEW
   ├── Deployments
   ├── Logs
   ├── Metrics
   └── Settings
```

Then the operational loop:

```text
ALERT
   ↓
SERVICE
   ↓
DEPLOYMENT
   ↓
LOGS
   ↓
METRICS
   ↓
DIAGNOSIS
   ↓
REDEPLOY / ROLLBACK
```

And the organization loop:

```text
ORGANIZATION
├── Projects
├── Alerts
├── Usage
├── Billing
└── Settings
```

---

# 90. FINAL FRONTEND RULE

The most important architectural decision is:

> **Pages represent durable context. Modals represent mutations. Drawers represent quick inspection.**

That principle comes directly from the PRD and should govern the entire frontend.

So:

```text
PROJECT
    → page

SERVICE
    → page

DEPLOYMENT HISTORY
    → page

DEPLOYMENT DETAILS
    → page

LOGS
    → page

METRICS
    → page

SETTINGS
    → page


CREATE PROJECT
    → modal

CREATE ENVIRONMENT
    → modal

ADD SERVICE
    → wizard

ADD DOMAIN
    → modal

ADD VARIABLE
    → modal

CREATE VOLUME
    → modal

ROLLBACK
    → confirmation modal

DELETE
    → confirmation modal


DEPLOYMENT QUICK VIEW
    → drawer

ALERT QUICK VIEW
    → drawer
```

This gives KR0N a frontend that can become large without becoming chaotic.

## KR0N FRONTEND NORTH STAR

The frontend should make a developer think:

```text
"I know where I am."

"I know what is running."

"I know what changed."

"I know why something failed."

"I know what I can do next."

"I don't need to understand the infrastructure underneath it."
```

That is the product experience the frontend should optimize for.
