'use client';

import { motion } from 'motion/react';
import { Layers, Shield, Radio, Cpu, ArrowRight } from 'lucide-react';

const INFRA_INPUTS = [
	{ label: 'INGRESS & TLS', delay: 0 },
	{ label: 'IMAGE COMPILATION', delay: 0.2 },
	{ label: 'SECRET INJECTION', delay: 0.4 },
	{ label: 'HEALTH PROBING', delay: 0.6 },
	{ label: 'TRAFFIC CUTOVER', delay: 0.8 },
];

export default function ManifestoScene() {
	return (
		<section
			id='manifesto'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#0B0E12] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='ManifestoScene'
		>
			<div className='max-w-7xl mx-auto space-y-12'>
				{/* Distant Top Metadata Bar */}
				<div className='flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-[#858C95] pb-6 border-b border-[#242930]'>
					<div className='flex items-center gap-3'>
						<span className='w-1.5 h-1.5 bg-white' />
						<span className='text-[#F3F4F6] font-semibold'>KR0N // PRINCIPLE 01</span>
					</div>
					<div className='flex items-center gap-4'>
						<span>COLLAPSED RUNTIME ABSTRACTION</span>
						<span className='hidden sm:inline text-[#363D47]'>|</span>
						<span className='hidden sm:inline text-[#858C95]'>SPEC v1.8.4</span>
					</div>
				</div>

				{/* Two-Column Grid: Statement on Left, Animated Convergence Visualization on Right */}
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center'>
					{/* Left: Editorial Statement (col-span-6) */}
					<div className='lg:col-span-6 space-y-6'>
						<blockquote
							data-kr0n-reveal='statement'
							className='text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#F3F4F6] leading-[1.12]'
						>
							<span
								data-kr0n-word='infrastructure'
								className='block font-normal text-white'
							>
								Infrastructure should disappear
							</span>
							<span
								data-kr0n-word='disappear'
								className='block text-[#6C7480] font-light italic mt-1'
							>
								until you actually need it.
							</span>
						</blockquote>

						<div className='pt-4 max-w-lg'>
							<p
								data-kr0n-reveal='annotation'
								className='text-sm sm:text-base text-[#C4C8CE] font-sans leading-relaxed'
							>
								Developers should spend their days constructing application value, not babysitting ingress controllers, configuring routing rules, or managing deployment machinery.
							</p>
						</div>

						<div className='pt-2 flex items-center gap-3 text-xs font-mono text-[#858C95]'>
							<span className='w-2 h-px bg-white/40' />
							<span>SYSTEM ABSTRACTION LEVEL: APPLICATION-NATIVE</span>
						</div>
					</div>

					{/* Right: Technical Convergence Visualization (col-span-6) */}
					<div className='lg:col-span-6 bg-[#111419] border border-[#242930] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden'>
						{/* Subtle Grid Accent in Visualization Box */}
						<div
							className='absolute inset-0 pointer-events-none opacity-10'
							style={{
								backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
								backgroundSize: '24px 24px',
							}}
						/>

						{/* Top Header of Diagram */}
						<div className='flex items-center justify-between text-xs font-mono text-[#858C95] pb-4 border-b border-[#242930] relative z-10'>
							<span className='text-white font-bold'>CONVERGENCE DIAGRAM</span>
							<span>DISTRIBUTED → UNIFIED</span>
						</div>

						{/* Animated System Convergence Core */}
						<div className='relative py-6 z-10 space-y-6'>
							{/* 5 Input Pipelines Converging */}
							<div className='space-y-2.5'>
								{INFRA_INPUTS.map((item, i) => (
									<div key={item.label} className='flex items-center gap-3 font-mono text-xs'>
										<div className='w-36 sm:w-44 text-[#858C95] text-[11px] truncate'>
											{item.label}
										</div>

										{/* Horizontal Trace Line with Moving Pulse */}
										<div className='flex-1 h-px bg-[#242930] relative overflow-hidden'>
											<motion.div
												className='absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white to-transparent'
												animate={{ left: ['-20%', '120%'] }}
												transition={{
													duration: 2.2,
													repeat: Infinity,
													delay: item.delay,
													ease: 'linear',
												}}
											/>
										</div>

										<span className='text-[10px] text-emerald-400 font-bold'>ABSORBED</span>
									</div>
								))}
							</div>

							{/* Convergence Point / Funnel Symbol */}
							<div className='flex items-center justify-center py-2'>
								<div className='h-8 w-px bg-gradient-to-b from-[#242930] via-white/50 to-[#242930]' />
							</div>

							{/* Output: Single Clean Unified Application Service Node */}
							<div className='p-4 bg-[#15191E] border border-white/20 flex items-center justify-between font-mono text-xs'>
								<div className='space-y-1'>
									<div className='text-[10px] text-[#858C95] uppercase'>CONVERGED RUNTIME</div>
									<div className='text-white font-bold text-sm flex items-center gap-2'>
										<span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
										<span>SERVICE // storefront</span>
									</div>
								</div>
								<div className='text-right'>
									<span className='px-2.5 py-1 bg-white/10 border border-white/20 text-white text-[11px] uppercase font-bold'>
										1 REPO • 1 URL
									</span>
								</div>
							</div>
						</div>

						{/* Footnote */}
						<div className='flex items-center justify-between text-[11px] font-mono text-[#858C95] pt-3 border-t border-[#242930] relative z-10'>
							<span>COMPLEXITY HANDLED INTERNALLY</span>
							<span className='text-white font-semibold'>ZERO CLUSTER OVERHEAD</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
