'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, ShieldCheck, Activity, Eye, Rocket } from 'lucide-react';

const PILLARS = [
	{
		id: 'deploy',
		index: '01',
		word: 'DEPLOY',
		tag: 'CONTINUOUS ORCHESTRATION',
		headline: 'From Git push to live edge in seconds',
		sentence: 'No cluster manifests, Helm charts, or configuration files required. KR0N compiles and packages standalone application artifacts deterministically.',
		signal: 'git push origin main → automated release',
		icon: Rocket,
	},
	{
		id: 'operate',
		index: '02',
		word: 'OPERATE',
		tag: 'TRAFFIC CUTOVER & REVERT',
		headline: 'Zero-downtime cutover & instant rollback',
		sentence: 'Every release runs parallel to existing instances. Traffic shifts dynamically across an isolated service network. If health checks fail, traffic reverts instantly.',
		signal: 'revert to v1.8.3 in <1s (zero packet loss)',
		icon: Activity,
	},
	{
		id: 'observe',
		index: '03',
		word: 'OBSERVE',
		tag: 'TELEMETRY STREAMING',
		headline: 'Real-time telemetry & structured log streaming',
		sentence: 'Edge request metrics, service health, and runtime traces stream continuously without external monitoring agent configuration or manual dashboard wiring.',
		signal: 'synthetic latency monitoring • 0.00% error rate',
		icon: Eye,
	},
	{
		id: 'protect',
		index: '04',
		word: 'PROTECT',
		tag: 'SUPPLY CHAIN GATES',
		headline: 'Cryptographic verification & automated SBOMs',
		sentence: 'Container images are verified with cosign signatures, scanned for known CVEs, and checked against hardcoded secret exposure before any traffic cutover.',
		signal: '0 CVEs detected • SBOM cryptographically signed',
		icon: ShieldCheck,
	},
];

export default function CapabilityTypographyScene() {
	const [activeIdx, setActiveIdx] = useState(0);

	// Automated subtle progression through the 4 responsibilities
	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIdx((prev) => (prev < PILLARS.length - 1 ? prev + 1 : 0));
		}, 3200);
		return () => clearInterval(interval);
	}, []);

	const activePillar = PILLARS[activeIdx];
	const Icon = activePillar.icon;

	return (
		<section
			id='capabilities'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#0B0E12] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='CapabilityTypographyScene'
		>
			<div className='max-w-7xl mx-auto space-y-12'>
				{/* Editorial Header */}
				<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#242930]'>
					<div className='space-y-3 max-w-2xl'>
						<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#858C95]'>
							<span className='w-1.5 h-1.5 bg-white' />
							<span>SYSTEM RESPONSIBILITIES // 05</span>
							<span className='text-[#363D47] select-none'>|</span>
							<span className='text-white font-semibold'>KR0N TAKES THE WEIGHT</span>
						</div>
						<h2 className='text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.04]'>
							What KR0N takes care of. <br />
							<span className='text-[#6C7480] font-extrabold'>So you don’t have to.</span>
						</h2>
					</div>
					<div className='text-xs font-mono text-[#858C95]'>
						AUTONOMOUS OPERATIONAL ARCHITECTURE
					</div>
				</div>

				{/* Continuous Technical Track (DEPLOY → OPERATE → OBSERVE → PROTECT) */}
				<div className='bg-[#0D1014] border border-[#242930] p-6 sm:p-8 space-y-8 shadow-2xl'>
					{/* Interactive Horizontal Highway */}
					<div className='relative w-full py-4 border-b border-[#242930]'>
						{/* Background Track Line */}
						<div className='absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[#242930]' />

						{/* Moving Highlight Line */}
						<motion.div
							className='absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
							animate={{ width: `${(activeIdx / (PILLARS.length - 1)) * 100}%` }}
							transition={{ duration: 0.5, ease: 'easeInOut' }}
						/>

						{/* 4 Pillars along the track */}
						<div className='relative flex items-center justify-between z-10'>
							{PILLARS.map((p, idx) => {
								const isSelected = activeIdx === idx;
								return (
									<button
										key={p.id}
										type='button'
										onClick={() => setActiveIdx(idx)}
										data-kr0n-word={p.id}
										className='group flex flex-col items-center focus:outline-none'
									>
										<div
											className={`w-7 h-7 rounded-sm flex items-center justify-center font-mono text-xs transition-all ${
												isSelected
													? 'bg-white text-black font-bold scale-110 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
													: 'bg-[#15191E] border border-[#242930] text-[#858C95] group-hover:border-[#363D47] group-hover:text-white'
											}`}
										>
											{p.index}
										</div>
										<span
											className={`text-xs sm:text-base font-black font-mono uppercase tracking-wider mt-3 transition-colors ${
												isSelected ? 'text-white' : 'text-[#858C95] group-hover:text-white'
											}`}
										>
											{p.word}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Active Responsibility Detail Showcase */}
					<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2'>
						{/* Left: Pillar Mechanics (col-span-7) */}
						<div className='lg:col-span-7 space-y-4'>
							<div className='flex items-center gap-3 text-xs font-mono text-[#858C95]'>
								<span className='text-white font-bold'>{activePillar.index} //</span>
								<span className='tracking-wider text-white font-semibold'>{activePillar.tag}</span>
								<span className='text-[#363D47]'>—</span>
								<span className='text-emerald-400'>MANAGED INTERNALLY</span>
							</div>

							<h3 className='text-xl sm:text-2xl font-bold text-white leading-snug'>
								{activePillar.headline}
							</h3>

							<p className='text-sm sm:text-base text-[#C4C8CE] font-sans leading-relaxed'>
								{activePillar.sentence}
							</p>

							<div className='pt-2 flex items-center gap-2 text-xs font-mono text-white/90'>
								<span className='px-3 py-1 bg-[#15191E] border border-[#242930] text-[#F3F4F6]'>
									{activePillar.signal}
								</span>
							</div>
						</div>

						{/* Right: Architectural Metric Display (col-span-5) */}
						<div className='lg:col-span-5 bg-[#111419] border border-[#242930] p-6 space-y-4 font-mono text-xs shadow-lg'>
							<div className='flex items-center justify-between text-[#858C95] pb-2 border-b border-[#242930]'>
								<span>OPERATIONAL STATE</span>
								<span className='text-emerald-400 font-bold'>ACTIVE RUNTIME</span>
							</div>

							<div className='flex items-center gap-4 py-2'>
								<div className='w-12 h-12 bg-[#15191E] border border-white/20 flex items-center justify-center shrink-0'>
									<Icon size={22} className='text-white' />
								</div>
								<div className='space-y-1'>
									<div className='text-sm font-bold text-white uppercase tracking-wider'>
										{activePillar.word} AUTOMATION
									</div>
									<div className='text-[#858C95] text-[11px]'>
										Autonomous execution without DevOps manual intervention
									</div>
								</div>
							</div>

							<div className='pt-2 border-t border-[#242930] flex items-center justify-between text-[11px] text-[#858C95]'>
								<span>INFRASTRUCTURE DETAILS:</span>
								<span className='text-white font-semibold'>SILENT & PROTECTED</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
