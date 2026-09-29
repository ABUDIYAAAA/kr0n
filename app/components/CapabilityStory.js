'use client';

import { Rocket, Activity, Eye, ShieldCheck } from 'lucide-react';

const CAPABILITIES = [
	{
		id: 'deploy',
		index: '01',
		name: 'DEPLOY',
		headline: 'From Git push to live edge in seconds',
		description:
			'No cluster manifests, Helm charts, or Dockerfiles required. KR0N infers build requirements automatically and packages standalone containers.',
		signal: 'git push origin main → 31.9s release',
		icon: Rocket,
	},
	{
		id: 'operate',
		index: '02',
		name: 'OPERATE',
		headline: 'Zero-downtime cutover & instant rollback',
		description:
			'Every release runs parallel to existing instances. Traffic shifts dynamically across a secure mTLS mesh. If health probes fail, traffic reverts instantly.',
		signal: 'revert to v1.8.3 in <1s (zero loss)',
		icon: Activity,
	},
	{
		id: 'observe',
		index: '03',
		name: 'OBSERVE',
		headline: 'Real-time telemetry & structured log streaming',
		description:
			'Ingress metrics, CPU/memory profiles, and distributed request traces stream continuously without external monitoring agent configuration.',
		signal: 'p99 latency 24ms • 0.00% err',
		icon: Eye,
	},
	{
		id: 'protect',
		index: '04',
		name: 'PROTECT',
		headline: 'Cryptographic verification & automated SBOMs',
		description:
			'Container images are verified with cosign signatures, scanned for known CVEs, and checked against hardcoded secret exposure before traffic routing.',
		signal: '0 CVEs detected • SBOM signed',
		icon: ShieldCheck,
	},
];

export default function CapabilityStory() {
	return (
		<section
			id='capabilities'
			className='relative py-28 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#090a0c]'
		>
			<div className='max-w-5xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='max-w-2xl space-y-3'>
					<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50'>
						<span className='w-1.5 h-1.5 bg-white' />
						<span>SYSTEM RESPONSIBILITIES</span>
					</div>
					<h2 className='text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight'>
						What KR0N takes care of. <br />
						<span className='text-white/50'>So you don’t have to.</span>
					</h2>
					<p className='text-sm sm:text-base text-zinc-400 font-sans leading-relaxed'>
						Four operational pillars engineered to remove infrastructure toil while
						keeping your applications secure, observable, and available.
					</p>
				</div>

				{/* 4 Strong Concepts Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{CAPABILITIES.map((cap) => {
						const Icon = cap.icon;
						return (
							<div
								key={cap.id}
								className='border border-white/10 bg-[#0d0e11] p-6 sm:p-8 space-y-5 flex flex-col justify-between hover:border-white/25 transition-colors'
							>
								<div className='space-y-4'>
									<div className='flex items-center justify-between text-xs font-mono text-white/40'>
										<span className='text-white font-bold'>{cap.index} {'//'}</span>
										<Icon size={16} className='text-white/60' />
									</div>

									<div className='space-y-1'>
										<h3 className='text-lg sm:text-xl font-bold font-mono uppercase tracking-wider text-white'>
											{cap.name}
										</h3>
										<p className='text-sm font-semibold text-zinc-200'>
											{cap.headline}
										</p>
									</div>

									<p className='text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans'>
										{cap.description}
									</p>
								</div>

								{/* Product signal strip */}
								<div className='pt-4 border-t border-white/5'>
									<div className='p-2.5 bg-[#090a0c] border border-white/10 text-xs font-mono text-white/80 flex items-center justify-between'>
										<span className='truncate'>{cap.signal}</span>
										<span className='text-[10px] text-emerald-400 font-bold ml-2'>
											VERIFIED
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
