'use client';

import { GitBranch, Sparkles, Sliders, Globe, Box, Terminal, Coffee, Layers } from 'lucide-react';

// Railpack-aligned application preset definitions matching backend catalog
export const APPLICATION_PRESETS = [
  {
    id: 'auto',
    name: 'Auto-Detect (Railpack)',
    category: 'auto',
    buildCommand: '',
    outputDir: '',
    installCommand: '',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'fullstack',
    buildCommand: 'npm run build',
    outputDir: '.next',
    installCommand: 'npm install',
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'frontend',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
  {
    id: 'react',
    name: 'React (CRA / SPA)',
    category: 'frontend',
    buildCommand: 'npm run build',
    outputDir: 'build',
    installCommand: 'npm install',
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'frontend',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'fullstack',
    buildCommand: 'npm run build',
    outputDir: '.output',
    installCommand: 'npm install',
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    category: 'fullstack',
    buildCommand: 'npm run build',
    outputDir: 'build',
    installCommand: 'npm install',
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'fullstack',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm install',
  },
  {
    id: 'remix',
    name: 'Remix / React Router',
    category: 'fullstack',
    buildCommand: 'npm run build',
    outputDir: 'build',
    installCommand: 'npm install',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'backend',
    buildCommand: 'npm run build --if-present',
    outputDir: '',
    installCommand: 'npm install',
  },
  {
    id: 'bun',
    name: 'Bun',
    category: 'backend',
    buildCommand: 'bun run build',
    outputDir: 'dist',
    installCommand: 'bun install',
  },
  {
    id: 'deno',
    name: 'Deno',
    category: 'backend',
    buildCommand: '',
    outputDir: '',
    installCommand: 'deno cache main.ts',
  },
  {
    id: 'go',
    name: 'Go',
    category: 'backend',
    buildCommand: 'go build -o out/app ./...',
    outputDir: 'out',
    installCommand: 'go mod download',
  },
  {
    id: 'python',
    name: 'Python',
    category: 'backend',
    buildCommand: '',
    outputDir: '',
    installCommand: 'pip install -r requirements.txt',
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'backend',
    buildCommand: 'cargo build --release',
    outputDir: 'target/release',
    installCommand: 'cargo fetch',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'backend',
    buildCommand: '',
    outputDir: '',
    installCommand: 'bundle install',
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'backend',
    buildCommand: '',
    outputDir: 'public',
    installCommand: 'composer install --no-dev --optimize-autoloader',
  },
  {
    id: 'java',
    name: 'Java',
    category: 'backend',
    buildCommand: './mvnw clean package -DskipTests',
    outputDir: 'target',
    installCommand: '',
  },
  {
    id: 'dotnet',
    name: '.NET',
    category: 'backend',
    buildCommand: 'dotnet publish -c Release -o out',
    outputDir: 'out',
    installCommand: 'dotnet restore',
  },
  {
    id: 'gleam',
    name: 'Gleam',
    category: 'backend',
    buildCommand: 'gleam export erlang-shipment',
    outputDir: 'build/erlang-shipment',
    installCommand: 'gleam deps download',
  },
  {
    id: 'dockerfile',
    name: 'Dockerfile',
    category: 'container',
    buildCommand: '',
    outputDir: '',
    installCommand: '',
  },
  {
    id: 'static',
    name: 'Static Site',
    category: 'static',
    buildCommand: '',
    outputDir: '.',
    installCommand: '',
  },
  {
    id: 'custom',
    name: 'Custom (Railpack)',
    category: 'custom',
    buildCommand: '',
    outputDir: '',
    installCommand: '',
  },
];

// Synchronous 0ms preset detection helper based on repository metadata
export function detectPresetSynchronously(repo) {
  if (!repo) return 'auto';

  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const lang = (repo.language || '').toLowerCase();
  const topics = Array.isArray(repo.topics)
    ? repo.topics.map((t) => String(t).toLowerCase())
    : [];

  const combined = `${name} ${desc} ${topics.join(' ')}`;

  // 1. Framework-specific keywords in name/desc/topics
  if (
    /\b(nextjs|next-js|next\.js)\b/.test(combined) ||
    combined.includes('nextjs') ||
    combined.includes('next.js') ||
    name.startsWith('next-') ||
    name.endsWith('-next')
  ) {
    return 'nextjs';
  }
  if (/\b(nuxt|nuxtjs|nuxt\.js)\b/.test(combined) || combined.includes('nuxt')) {
    return 'nuxt';
  }
  if (/\b(svelte|sveltekit|svelte-kit)\b/.test(combined) || combined.includes('sveltekit')) {
    return 'sveltekit';
  }
  if (/\b(astro)\b/.test(combined) || combined.includes('astro')) {
    return 'astro';
  }
  if (/\b(remix|react-router)\b/.test(combined) || combined.includes('remix')) {
    return 'remix';
  }
  if (/\b(vite)\b/.test(combined) || combined.includes('vite')) {
    return 'vite';
  }
  if (/\b(vue|vuejs|vue\.js)\b/.test(combined) || combined.includes('vue')) {
    return 'vue';
  }
  if (
    /\b(cra|create-react-app)\b/.test(combined) ||
    (combined.includes('react') && !combined.includes('native') && !combined.includes('remix') && !combined.includes('next'))
  ) {
    return 'react';
  }
  if (/\b(bun)\b/.test(combined) || combined.includes('bun.sh')) {
    return 'bun';
  }
  if (/\b(deno)\b/.test(combined) || combined.includes('deno.land')) {
    return 'deno';
  }
  if (/\b(gleam)\b/.test(combined)) {
    return 'gleam';
  }

  // Dockerfile repository detection
  if (combined.includes('dockerfile') || name === 'docker' || name.endsWith('-docker')) {
    return 'dockerfile';
  }

  // 2. Extension check on repo name (e.g. "main.py", "app.go", "cli.rs")
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.go')) return 'go';
  if (name.endsWith('.rs')) return 'rust';
  if (name.endsWith('.rb')) return 'ruby';
  if (name.endsWith('.php')) return 'php';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.cs')) return 'dotnet';
  if (name.endsWith('.gleam')) return 'gleam';
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'static';

  // 3. Backend framework / ecosystem keywords
  if (/\b(django|flask|fastapi|python|pytorch|tensorflow|pandas|poetry|pipenv|uvicorn|gunicorn)\b/.test(combined)) {
    return 'python';
  }
  if (/\b(golang|gin-gonic|fiber|echo|gorilla)\b/.test(combined)) {
    return 'go';
  }
  if (/\b(rust|cargo|actix|axum|tokio)\b/.test(combined)) {
    return 'rust';
  }
  if (/\b(rails|ruby|sinatra)\b/.test(combined)) {
    return 'ruby';
  }
  if (/\b(laravel|symfony|php|composer|wordpress)\b/.test(combined)) {
    return 'php';
  }
  if (/\b(spring|springboot|spring-boot|maven|gradle|quarkus|micronaut)\b/.test(combined)) {
    return 'java';
  }
  if (/\b(dotnet|\.net|csharp|c#|aspnet|asp\.net)\b/.test(combined)) {
    return 'dotnet';
  }

  // 4. Primary language fallback from GitHub repo object
  switch (lang) {
    case 'python':
      return 'python';
    case 'go':
      return 'go';
    case 'rust':
      return 'rust';
    case 'ruby':
      return 'ruby';
    case 'php':
      return 'php';
    case 'java':
    case 'kotlin':
    case 'scala':
      return 'java';
    case 'c#':
    case 'csharp':
    case 'f#':
    case 'visual basic .net':
      return 'dotnet';
    case 'gleam':
      return 'gleam';
    case 'dockerfile':
      return 'dockerfile';
    case 'html':
    case 'css':
      return 'static';
    case 'javascript':
    case 'typescript': {
      if (/\b(node|express|nest|nestjs|fastify|koa|server|api|backend|bot)\b/.test(combined)) {
        return 'nodejs';
      }
      return 'nextjs';
    }
    default:
      break;
  }

  return 'auto';
}

// Helper to render framework / language / repo icon
export function RepoIcon({ type, name = '' }) {
  const lower = (type || name || '').toLowerCase();

  // Auto detect
  if (lower === 'auto' || lower.includes('auto-detect')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-violet-500/20 border border-violet-500/40 text-violet-300 shrink-0">
        <Sparkles size={11} />
      </div>
    );
  }

  // Custom
  if (lower === 'custom') {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-700 text-neutral-300 shrink-0">
        <Sliders size={11} />
      </div>
    );
  }

  // Next.js
  if (lower === 'nextjs' || lower === 'next.js' || lower.includes('next')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10 border border-white/30 text-white shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 3L22 21H2L12 3z" />
        </svg>
      </div>
    );
  }

  // Vite
  if (lower === 'vite' || lower.includes('vite')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2L2 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    );
  }

  // React (CRA / SPA)
  if (lower === 'react' || lower.includes('react')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }

  // Nuxt
  if (lower === 'nuxt' || lower.includes('nuxt')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 3L1 21h22L12 3zm0 5l6.5 11h-13L12 8z" />
        </svg>
      </div>
    );
  }

  // Vue
  if (lower === 'vue' || lower.includes('vue')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 18.5L22 4.5h-4.2L12 12.3 6.2 4.5H2l10 14z" />
        </svg>
      </div>
    );
  }

  // SvelteKit / Svelte
  if (lower === 'sveltekit' || lower.includes('svelte')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-orange-500/20 border border-orange-500/40 text-orange-400 shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M18.8 4.2C16.6 2 13.2 2 11 4.2L5.2 10c-2.2 2.2-2.2 5.6 0 7.8 2.2 2.2 5.6 2.2 7.8 0l5.8-5.8c1.4-1.4 1.4-3.6 0-5s-3.6-1.4-5 0l-4.4 4.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Astro
  if (lower === 'astro' || lower.includes('astro')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2.5a.75.75 0 0 1 .65.38l6.5 11.5a.75.75 0 0 1-.65 1.12h-2.1l1.1 4.5a.75.75 0 0 1-1.35.58L12 16.5l-4.15 4.08a.75.75 0 0 1-1.35-.58l1.1-4.5H5.5a.75.75 0 0 1-.65-1.12l6.5-11.5a.75.75 0 0 1 .65-.38z" />
        </svg>
      </div>
    );
  }

  // Remix
  if (lower === 'remix' || lower.includes('remix')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20 border border-blue-500/40 text-blue-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-5h2zm0-7h-2V7.5h2z" />
        </svg>
      </div>
    );
  }

  // Node.js
  if (lower === 'nodejs' || lower.includes('node')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20 border border-green-500/40 text-green-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8-3.3 1.9-6.8-3.8 3.3-1.9z" />
        </svg>
      </div>
    );
  }

  // Bun
  if (lower === 'bun' || lower.includes('bun')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-100/20 border border-amber-200/40 text-amber-200 shrink-0 font-bold text-[10px]">
        B
      </div>
    );
  }

  // Deno
  if (lower === 'deno' || lower.includes('deno')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-600 text-white shrink-0 font-mono text-[9px] font-bold">
        D
      </div>
    );
  }

  // Go / Golang
  if (lower === 'go' || lower === 'golang' || lower.includes('go')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shrink-0 font-mono text-[9px] font-bold tracking-tight">
        GO
      </div>
    );
  }

  // Python
  if (lower === 'python' || lower.includes('python') || lower.endsWith('.py')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 shrink-0">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M11.9 2C8.6 2 6.7 3.5 6.7 5.8v2.4h5.2v.7H4.3c-2.3 0-4.3 1.9-4.3 5.2 0 3.3 1.8 5.1 5.1 5.1h2.2v-2.5c0-2.3 1.9-4.3 4.3-4.3h5.2v-.7h-5.2c-2.3 0-4.3-1.9-4.3-4.3V5.8c0-2.3 2.3-3.8 4.6-3.8z" />
        </svg>
      </div>
    );
  }

  // Rust
  if (lower === 'rust' || lower.includes('rust') || lower.endsWith('.rs')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-600/20 border border-amber-500/40 text-amber-400 shrink-0 font-mono text-[9px] font-bold">
        RS
      </div>
    );
  }

  // Ruby
  if (lower === 'ruby' || lower.includes('ruby') || lower.endsWith('.rb')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 2L4 8l3 13 5 3 5-3 3-13-8-6z" />
        </svg>
      </div>
    );
  }

  // PHP
  if (lower === 'php' || lower.includes('php')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shrink-0 font-mono text-[8px] font-bold">
        PHP
      </div>
    );
  }

  // Java
  if (lower === 'java' || lower.includes('java')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-700/20 border border-amber-600/40 text-amber-300 shrink-0">
        <Coffee size={11} />
      </div>
    );
  }

  // .NET
  if (lower === 'dotnet' || lower === '.net' || lower.includes('dotnet') || lower.includes('c#')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-600/20 border border-purple-500/40 text-purple-300 shrink-0 font-mono text-[8px] font-bold">
        .NET
      </div>
    );
  }

  // Gleam
  if (lower === 'gleam' || lower.includes('gleam')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-pink-500/20 border border-pink-500/40 text-pink-300 shrink-0 font-mono text-[8px] font-bold">
        GL
      </div>
    );
  }

  // Dockerfile
  if (lower === 'dockerfile' || lower.includes('docker')) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-sky-500/20 border border-sky-500/40 text-sky-300 shrink-0">
        <Box size={11} />
      </div>
    );
  }

  // Static site
  if (lower === 'static' || lower.includes('static') || lower === 'html') {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-teal-500/20 border border-teal-500/40 text-teal-300 shrink-0">
        <Globe size={11} />
      </div>
    );
  }

  // Fallback repo icon
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-700 text-neutral-300 shrink-0">
      <GitBranch size={11} />
    </div>
  );
}

export function getRepoTimestamp(r) {
  if (!r) return 0;
  const candidates = [r.pushed_at, r.updated_at, r.created_at];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      const ms = new Date(c).getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    } else if (typeof c === 'number') {
      return c > 1e11 ? c : c * 1000;
    } else if (typeof c === 'object' && c.seconds) {
      return Number(c.seconds) * 1000;
    }
  }
  return 0;
}

export function formatLastModified(r) {
  const ms = getRepoTimestamp(r);
  if (!ms) return 'Recently';
  try {
    const diffMs = Date.now() - ms;
    if (isNaN(diffMs)) return 'Recently';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
