'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Play, RotateCcw, ShieldCheck, Terminal, Radio } from 'lucide-react';

const STAGES = [
	{
		step: '01',
		name: 'CODE',
		badge: 'Git Push',
		title: 'Webhook received & commit validated',
		description:
			'Every push to a tracked branch triggers cryptographic webhook verification. No manual CI triggers or external worker setups required.',
		logs: [
			'→ Payload received for repo: storefront (commit: a83f2c1)',
			'→ HMAC-SHA256 signature verified against project secret',
			'→ Target environment: production (isolated cluster sandbox)',
		],
		stat: '0.4s payload sync',
	},
	{
		step: '02',
		name: 'BUILD',
		badge: 'Containerize',
		title: 'Hermetic OCI compilation with layer caching',
		description:
			'KR0N inspects runtime manifests, restores persistent build cache layers, and outputs a standalone immutable container artifact.',
		logs: [
			'→ Framework detected: Next.js 16 (App Router standalone)',
			'→ Layer cache restored: 94% hit rate from previous artifact',
			'→ Output image compiled: 64.2 MB (zero system dependencies)',
		],
		stat: '18.2s build time',
	},
	{
		step: '03',
		name: 'VERIFY',
		badge: 'Security Gates',
		title: 'Automated vulnerability scanning & SBOM generation',
		description:
			'Prior to traffic release, artifacts are scanned for exposed credentials, known CVEs, and signed cryptographically with cosign.',
		logs: [
			'→ Vulnerability database check: 0 CVEs detected in dependencies',
			'→ Secret scanning: 0 API keys or private tokens detected',
			'→ CycloneDX SBOM generated and cryptographically signed',
		],
		stat: '0 CVEs detected',
	},
	{
		step: '04',
		name: 'RELEASE',
		badge: 'Traffic Cutover',
		title: 'Zero-downtime canary traffic ramp',
		description:
			'New instances are brought up behind a high-performance WireGuard service mesh. Traffic is shifted smoothly while health is monitored continuously.',
		logs: [
			'→ Initializing 2 new service replicas on regional nodes',
			'→ Shifting edge ingress traffic: 10% → 25% → 50% → 100%',
			'→ Previous instances drained cleanly without dropped connections',
		],
		stat: '100% traffic shifted',
	},
	{
		step: '05',
		name: 'LIVE',
		badge: 'Global Edge',
		title: 'Serving production traffic with automated rollback guard',
		description:
			'Your service is publicly routed with instant failover protection. If health probes fail post-cutover, traffic reverts instantly to the previous release.',
		logs: [
			'→ Public endpoint routed: https://storefront.kr0n.app',
			'→ Synthetic HTTP health probes: 200 OK (p99 latency 24ms)',
			'→ Automated rollback point saved: revert to v1.8.3 in <1s',
		],
		stat: 'Healthy • p99 24ms',
	},
];

export default function ReleaseRailSection() {
	const [activeStage, setActiveStage] = useState(0);

	return (
		<section
			id='rail'
			className='relative py-24 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#050607]'
		>
			<div className='max-w-5xl mx-auto space-y-12'>
				{/* Header */}
				<div className='flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10'>
					<div className='space-y-3 max-w-2xl'>
						<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50'>
							<span className='w-1.5 h-1.5 bg-white' />
							<span>DEPLOYMENT TIMELINE SYSTEM</span>
						</div>
						<h2 className='text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white'>
							One release path. <br />
							<span className='text-white/50'>From code to production.</span>
						</h2>
					</div>
					<div className='text-xs font-mono text-white/50'>
						<span>IMMUTABLE RELEASE WORKFLOW</span>
					</div>
				</div>

				{/* Interactive Rail Navigation */}
				<div className='grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3'>
					{STAGES.map((s, idx) => {
						const isSelected = activeStage === idx;
						return (
							<button
								key={s.name}
								type='button'
								onClick={() => setActiveStage(idx)}
								className={`p-4 text-left transition-all border ${
									isSelected
										? 'border-white bg-[#16171b] shadow-lg'
										: 'border-white/10 bg-[#0d0e11] hover:border-white/30 text-white/60 hover:text-white'
								}`}
							>
								<div className='flex items-center justify-between text-[10px] font-mono text-white/40 mb-2'>
									<span>{s.step}</span>
									<span className='text-[9px] uppercase px-1.5 py-0.5 border border-white/10 bg-white/5'>
										{s.badge}
									</span>
								</div>
								<div className='text-sm font-mono font-bold uppercase tracking-wider text-white'>
									{s.name}
								</div>
								<div className='text-[11px] font-mono text-white/40 mt-1 truncate'>
									{s.stat}
								</div>
							</button>
						);
					})}
				</div>

				{/* Detailed Stage Execution Card */}
				<div className='border border-white/15 bg-[#0d0e11] p-6 sm:p-8 space-y-6'>
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10'>
						<div className='space-y-1'>
							<div className='text-xs font-mono text-white/50 uppercase tracking-widest'>
								STAGE {STAGES[activeStage].step} {'//'} {STAGES[activeStage].name}
							</div>
							<h3 className='text-lg sm:text-xl font-bold text-white'>
								{STAGES[activeStage].title}
							</h3>
						</div>
						<div className='inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-emerald-400 self-start sm:self-auto'>
							<Check size={14} />
							<span>{STAGES[activeStage].stat}</span>
						</div>
					</div>

					<p className='text-sm text-zinc-400 max-w-3xl leading-relaxed font-sans'>
						{STAGES[activeStage].description}
					</p>

					{/* Log Stream Output */}
					<div className='p-4 bg-[#090a0c] border border-white/10 font-mono text-xs space-y-2 text-white/70'>
						{STAGES[activeStage].logs.map((log, i) => (
							<div key={i} className='flex items-start gap-2'>
								<span className='text-white/40 select-none'>$</span>
								<span>{log}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
