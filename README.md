# Kr0n — A Minimal Vercel-like Deployment Platform

Kr0n is a platform that automates building and deploying applications directly from a GitHub repository.

It enables a simple workflow: code → build → live URL.

---

## Overview

Kr0n implements a basic CI/CD pipeline:

Webhook → API → Build Worker → Deployment → Reverse Proxy → URL

---

## Core Features

- GitHub webhook integration for automatic deployments  
- Framework detection (React, Next.js, Vite, etc.)  
- Isolated builds using containers or VMs  
- Subdomain-based routing  
- Static site hosting (with optional server support)

---

## Deployment Flow

1. User connects a GitHub repository  
2. Webhook triggers on push/branch update  
3. System:
   - Clones repository  
   - Detects framework  
   - Installs dependencies  
   - Runs build command  
4. Output is stored and deployed  
5. Application is accessible via a subdomain  

---

## Framework Detection

Detection is based on:

- `package.json` dependencies  
- Build scripts  
- Config files  

Fallback to user-defined build commands if needed.

---

## Build Environment

### Containers (recommended)

Using Docker:
- Isolated builds  
- Consistent environments  
- Easy cleanup  

### Virtual Machines

- Stronger isolation  
- Higher overhead  

---

## Networking

### Subdomains

Each deployment is mapped to:
<project>.Kr0n.app

### Reverse Proxy

Handles:
- Request routing  
- Subdomain resolution  
- SSL termination  

---

## Deployment Types

### Static

- Served from build output (`dist/`, `build/`)  

### Server (optional)

- Runs as a process  
- Routed via reverse proxy  

---

## Infrastructure

- Node.js (API and workers)  
- Docker (build isolation)  
- Reverse proxy (Nginx/Traefik)  
- Wildcard domain (`*.Kr0n.app`)  

Optional:
- Redis (queue)  
- Database (metadata, logs)

---

## Project Structure

/api  
/worker  
/deployments  
/proxy  

---

## Scope

Kr0n is a simplified system designed for learning purposes. It does not include production-grade scaling, security, or distributed infrastructure.

---

## Philosophy

Clone → Build → Deploy → Serve
