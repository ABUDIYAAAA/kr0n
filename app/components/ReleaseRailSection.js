'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Play, Pause } from 'lucide-react';

const RAIL_NODES = [
	{
		id: 'source',
		index: '01',
		name: 'SOURCE',
		badge: 'Git Webhook',
		summary: 'Webhook received & cryptographic signature validated against repository credentials.',
		telemetry: 'commit a83f2c1 • author gurmehar • branch main',
		traces: [
			{ title: 'Receive webhook payload from repository', stat: 'verified', done: true },
			{ title: 'Validate cryptographic webhook signature', stat: '0.2s', done: true },
			{ title: 'Resolve commit metadata & trigger rules', stat: 'a83f2c1', done: true },
			{ title: 'Queue hermetic container compilation', stat: 'ready', done: true },
		],
	},
	{
		id: 'build',
		index: '02',
		name: 'BUILD',
		badge: 'Hermetic OCI',
		summary: 'Isolated container image compilation with persistent layer caching.',
		telemetry: 'cache 94% hit rate • output image 64.2 MB',
		traces: [
			{ title: 'Restore persistent dependency cache layers', stat: '94% hit', done: true },
			{ title: 'Compile application standalone bundle', stat: '14.1s', done: true },
			{ title: 'Package minimal distroless container image', stat: '64.2MB', done: true },
			{ title: 'Push immutable image to regional registry', stat: 'synced', done: true },
		],
	},
	{
		id: 'verify',
		index: '03',
		name: 'VERIFY',
		badge: 'Supply Chain',
		summary: 'Vulnerability scanning, secret detection, and cryptographic signing prior to release.',
		telemetry: '0 CVEs detected • cosign signature attached',
		traces: [
			{ title: 'Scan container layers for known CVEs', stat: '0 detected', done: true },
			{ title: 'Detect accidentally hardcoded private keys', stat: '0 tokens', done: true },
			{ title: 'Generate CycloneDX software bill of materials', stat: 'SBOM gen', done: true },
			{ title: 'Sign container artifact with cosign signature', stat: 'signed', done: true },
		],
	},
	{
		id: 'release',
		index: '04',
		name: 'RELEASE',
		badge: 'Canary Cutover',
		summary: 'Zero-downtime canary traffic ramp. Previous instances drain cleanly without dropped connections.',
		telemetry: 'canary ramp 10% → 50% → 100% • 0 dropped packets',
		traces: [
			{ title: 'Spin up parallel instances on edge regions', stat: '3 nodes', done: true },
			{ title: 'Ramp canary traffic: 10% → 50% → 100%', stat: 'active', active: true },
			{ title: 'Drain connections from previous release', stat: 'draining', done: true },
			{ title: 'Arm automated rollback guard snapshot', stat: 'armed', done: true },
		],
	},
	{
		id: 'live',
		index: '05',
		name: 'LIVE',
		badge: 'Edge Active',
		summary: 'Serving production traffic globally with instant automated rollback guard armed.',
		telemetry: 'synthetic probes 200 OK • latency 24ms',
		traces: [
			{ title: 'Route primary apex & custom domains', stat: 'routed', done: true },
			{ title: 'Synthetic HTTP health verification (200 OK)', stat: '24ms', done: true },
			{ title: 'Automated rollback point saved to storage', stat: 'ready', done: true },
			{ title: 'Release v1.8.4 confirmed active', stat: 'LIVE', done: true },
		],
	},
];

export default function ReleaseRailSection() {
	const [activeIdx, setActiveIdx] = useState(0);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);

	// Automated live iteration through all 5 stages (SOURCE -> BUILD -> VERIFY -> RELEASE -> LIVE)
	useEffect(() => {
		if (!isAutoPlaying) return;

		const interval = setInterval(() => {
			setActiveIdx((prev) => (prev + 1) % RAIL_NODES.length);
		}, 2600);

		return () => clearInterval(interval);
	}, [isAutoPlaying]);

	const handleManualSelect = (idx) => {
		setActiveIdx(idx);
		// Pause auto-play temporarily on manual click, resume after 6s
		setIsAutoPlaying(false);
		setTimeout(() => {
			setIsAutoPlaying(true);
		}, 6000);
	};

	const activeNode = RAIL_NODES[activeIdx];

	return (
		<section
			id='rail'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#090B0E] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='ReleaseRailScene'
		>
			<div className='max-w-7xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#242930]'>
					<div className='space-y-3 max-w-2xl'>
						<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#858C95]'>
							<span className='w-1.5 h-1.5 bg-white' />
							<span>SYSTEM MOTIF // 02</span>
							<span className='text-[#363D47] select-none'>|</span>
							<span className='text-white font-semibold'>THE RELEASE RAIL</span>
						</div>
						<h2 className='text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.04]'>
							From code to live. <br />
							<span className='text-[#6C7480] font-extrabold'>One clear path.</span>
						</h2>
					</div>

					<div className='text-left md:text-right font-mono text-xs text-[#858C95] space-y-1.5'>
						<div className='flex items-center md:justify-end gap-2'>
							<span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
							<span className='text-white font-bold tracking-wider'>
								{isAutoPlaying ? 'LIVE PIPELINE ITERATING' : 'MANUAL INSPECTION'}
							</span>
						</div>
						<div className='text-[#858C95]'>
							STAGE 0{activeIdx + 1} OF 05 // RELEASE v1.8.4
						</div>
					</div>
				</div>

				{/* The Technical Rail Instrument */}
				<div
					data-kr0n-rail='ReleaseRail'
					className='bg-[#0D1014] border border-[#242930] p-6 sm:p-8 space-y-8 shadow-2xl relative'
				>
					{/* Top Rail Telemetry Bar */}
					<div className='flex items-center justify-between text-xs font-mono text-[#858C95] pb-4 border-b border-[#242930]'>
						<div className='flex items-center gap-2'>
							<span className='text-white font-bold'>ACTIVE RUNTIME:</span>
							<span className='text-[#C4C8CE]'>storefront / production</span>
						</div>
						<div className='flex items-center gap-3'>
							<span className='text-[11px] text-[#858C95] hidden sm:inline'>
								AUTO-ITERATING THROUGH PIPELINE
							</span>
							<button
								type='button'
								onClick={() => setIsAutoPlaying(!isAutoPlaying)}
								className='flex items-center gap-1.5 px-2 py-0.5 border border-[#363D47] bg-[#15191E] text-white text-[10px] hover:border-white/40 transition-colors'
							>
								{isAutoPlaying ? <Pause size={10} /> : <Play size={10} />}
								<span>{isAutoPlaying ? 'Pause' : 'Resume'}</span>
							</button>
						</div>
					</div>

					{/* The Continuous Hairline Axis */}
					<div className='relative w-full py-4'>
						{/* Background Track Line */}
						<div
							data-kr0n-line='rail-hairline'
							className='absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[#242930]'
						/>

						{/* Highlighted Progress Segment (moves live through stages) */}
						<motion.div
							className='absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
							animate={{ width: `${(activeIdx / (RAIL_NODES.length - 1)) * 100}%` }}
							transition={{ duration: 0.6, ease: 'easeInOut' }}
						/>

						{/* Moving Marker */}
						<motion.div
							className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none'
							animate={{ left: `${(activeIdx / (RAIL_NODES.length - 1)) * 100}%` }}
							transition={{ duration: 0.6, ease: 'easeInOut' }}
						>
							<div className='w-4 h-4 rounded-full bg-white border-2 border-[#090B0E] shadow-[0_0_12px_rgba(255,255,255,1)] flex items-center justify-center'>
								<div className='w-1.5 h-1.5 rounded-full bg-black' />
							</div>
						</motion.div>

						{/* 5 Nodes Spaced Along the Axis */}
						<div className='relative flex items-center justify-between z-10'>
							{RAIL_NODES.map((node, idx) => {
								const isSelected = activeIdx === idx;
								const isPassed = idx < activeIdx;

								return (
									<button
										key={node.id}
										type='button'
										onClick={() => handleManualSelect(idx)}
										data-kr0n-node={`node-${node.id}`}
										className='group relative flex flex-col items-center focus:outline-none'
									>
										{/* Coordinate Label */}
										<span className={`text-[10px] font-mono mb-2 transition-colors ${
											isSelected ? 'text-white font-bold' : 'text-[#858C95] group-hover:text-white'
										}`}>
											{node.index}
										</span>

										{/* Geometric Marker */}
										<div
											className={`w-7 h-7 rounded-sm flex items-center justify-center transition-all ${
												isSelected
													? 'bg-white text-black font-bold scale-110 shadow-[0_0_12px_rgba(255,255,255,0.8)]'
													: isPassed
													? 'bg-[#15191E] border border-white/40 text-white'
													: 'bg-[#111419] border border-[#242930] text-[#4E5560] group-hover:border-[#363D47]'
											}`}
										>
											{isPassed ? (
												<Check size={12} strokeWidth={3} className='text-emerald-400' />
											) : isSelected ? (
												<span className='w-2 h-2 rounded-full bg-black' />
											) : (
												<span className='text-[10px] font-mono'>—</span>
											)}
										</div>

										{/* Node Name */}
										<span
											className={`text-xs sm:text-sm font-mono tracking-widest uppercase mt-3 transition-colors ${
												isSelected ? 'text-white font-bold' : 'text-[#858C95] group-hover:text-white'
											}`}
										>
											{node.name}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Live Contextual Inspection Object Below Rail */}
					<div className='pt-6 border-t border-[#242930] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
						{/* Left: Stage Description (col-span-5) */}
						<div className='lg:col-span-5 space-y-4'>
							<div className='flex items-center gap-3 text-xs font-mono text-[#858C95]'>
								<span className='text-white font-bold'>{activeNode.index} //</span>
								<span className='uppercase tracking-widest text-white font-bold'>{activeNode.name}</span>
								<span className='text-[#363D47]'>—</span>
								<span className='text-[10px] px-2 py-0.5 border border-[#363D47] bg-[#15191E] font-mono text-[#C4C8CE]'>
									{activeNode.badge}
								</span>
							</div>

							<h3 className='text-xl sm:text-2xl font-bold text-white leading-snug'>
								{activeNode.summary}
							</h3>

							<div className='text-xs font-mono text-[#858C95] pt-2'>
								TELEMETRY: <span className='text-[#C4C8CE]'>{activeNode.telemetry}</span>
							</div>
						</div>

						{/* Right: Live Stage Execution Trace (col-span-7) */}
						<div className='lg:col-span-7 bg-[#111419] border border-[#242930] p-5 space-y-3 font-mono text-xs'>
							<div className='flex items-center justify-between text-[11px] text-[#858C95] pb-2 border-b border-[#242930]'>
								<span>STAGE EXECUTION TRACE</span>
								<span className='text-emerald-400 font-bold'>ACTIVE VERIFICATION</span>
							</div>

							<div className='space-y-2'>
								{activeNode.traces.map((trace, i) => (
									<div
										key={trace.title}
										className='flex items-center justify-between p-2.5 bg-[#15191E] border border-white/10 text-white'
									>
										<div className='flex items-center gap-2.5 truncate'>
											<span className='text-[#4E5560] select-none'>0{i + 1}</span>
											<span className='truncate text-xs'>{trace.title}</span>
										</div>
										<span className='text-[11px] font-bold text-emerald-400 shrink-0 ml-3'>
											{trace.stat}
										</span>
									</div>
								))}
							</div>

							<div className='pt-2 flex items-center justify-between text-[10px] text-[#858C95] border-t border-[#242930]'>
								<span>HERMETIC CONTAINER WORKFLOW</span>
								<span>REPRODUCIBLE BUILD SHA</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
