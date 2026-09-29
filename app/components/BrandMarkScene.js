'use client';

import { motion } from 'motion/react';

export default function BrandMarkScene() {
	return (
		<section
			id='brand-scene'
			className='relative py-24 sm:py-32 px-6 sm:px-12 bg-[#090B0E] border-b border-[#242930] overflow-hidden select-none'
			data-kr0n-motion='BrandAnimationScene'
		>
			{/* LAYER 1: Very Slow Ambient Background Grid Drift */}
			<div
				className='absolute inset-0 pointer-events-none opacity-20'
				style={{
					backgroundImage: `
						linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
						linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
					`,
					backgroundSize: '40px 40px',
				}}
			/>

			{/* LAYER 2: Moving SVG Geometric Wireframe Traces & Signal Paths */}
			<svg
				className='absolute inset-0 w-full h-full pointer-events-none'
				xmlns='http://www.w3.org/2000/svg'
				preserveAspectRatio='none'
			>
				<defs>
					<linearGradient id='signalGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
						<stop offset='0%' stopColor='transparent' />
						<stop offset='50%' stopColor='rgba(255, 255, 255, 0.4)' />
						<stop offset='100%' stopColor='transparent' />
					</linearGradient>
				</defs>

				{/* Primary Horizontal Coordinate Axis Line */}
				<line
					x1='0%'
					y1='50%'
					x2='100%'
					y2='50%'
					stroke='rgba(255, 255, 255, 0.12)'
					strokeWidth='1'
				/>

				{/* Angled Diagonal Geometry Traces */}
				<line
					x1='15%'
					y1='20%'
					x2='35%'
					y2='50%'
					stroke='rgba(255, 255, 255, 0.08)'
					strokeWidth='1'
					strokeDasharray='4 4'
				/>
				<line
					x1='85%'
					y1='20%'
					x2='65%'
					y2='50%'
					stroke='rgba(255, 255, 255, 0.08)'
					strokeWidth='1'
					strokeDasharray='4 4'
				/>
				<line
					x1='35%'
					y1='50%'
					x2='20%'
					y2='80%'
					stroke='rgba(255, 255, 255, 0.08)'
					strokeWidth='1'
					strokeDasharray='4 4'
				/>
				<line
					x1='65%'
					y1='50%'
					x2='80%'
					y2='80%'
					stroke='rgba(255, 255, 255, 0.08)'
					strokeWidth='1'
					strokeDasharray='4 4'
				/>
			</svg>

			{/* LAYER 3: Continuously Moving Technical Scan Pulse (Occasional Sweep) */}
			<motion.div
				className='absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none'
				animate={{ left: ['-15%', '115%'] }}
				transition={{
					duration: 7,
					repeat: Infinity,
					ease: 'easeInOut',
					repeatDelay: 1.5,
				}}
			/>

			{/* LAYER 4: Thin Signal Node Traveling along the Center Line (Medium Slow) */}
			<motion.div
				className='absolute top-1/2 -translate-y-1/2 pointer-events-none z-10'
				animate={{ left: ['5%', '95%', '5%'] }}
				transition={{
					duration: 16,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
			>
				<div className='relative flex items-center justify-center'>
					<div className='w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]' />
					<div className='absolute -top-5 text-[9px] font-mono text-white/40 whitespace-nowrap'>
						SIG // 0x4F
					</div>
				</div>
			</motion.div>

			{/* LAYER 5: Slow Drifting Secondary Coordinate Marker */}
			<motion.div
				className='absolute top-[32%] pointer-events-none'
				animate={{ left: ['85%', '25%', '85%'] }}
				transition={{
					duration: 22,
					repeat: Infinity,
					ease: 'linear',
				}}
			>
				<div className='w-1.5 h-1.5 bg-white/40 border border-white/20' />
			</motion.div>

			{/* LAYER 6: Foreground Structured Content Container */}
			<div className='max-w-7xl mx-auto space-y-8 relative z-10'>
				{/* Top System Metadata Bar */}
				<div className='flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-[#858C95] pb-4 border-b border-[#242930]'>
					<div className='flex items-center gap-3'>
						<span className='w-1.5 h-1.5 bg-white' />
						<span className='text-[#F3F4F6] font-semibold'>SYSTEM CORE // BRAND ARCHITECTURE</span>
					</div>
					<div className='flex items-center gap-4 text-[#858C95]'>
						<span className='hidden sm:inline'>GRID: 40PX POLAR</span>
						<span className='hidden sm:inline text-[#363D47]'>|</span>
						<div className='flex items-center gap-1.5'>
							<span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
							<span className='text-emerald-400 font-bold'>ACTIVE RUNTIME</span>
						</div>
					</div>
				</div>

				{/* Center Stage: The Large Intentionally DIM KR0N Wordmark */}
				<div className='relative py-12 sm:py-20 flex flex-col items-center justify-center'>
					{/* Fixed Center Anchor Hairline Crosshair */}
					<div className='absolute left-1/2 top-0 bottom-0 w-px bg-white/5 pointer-events-none' />

					{/* Tiny System Label Above Logo */}
					<div className='mb-4 text-[10px] font-mono tracking-widest uppercase text-[#858C95] bg-[#111419] border border-[#242930] px-3 py-1'>
						PLATFORM WORKMARK // 20–35% VISUAL INTENSITY
					</div>

					{/* 
						THE KR0N LOGO:
						- Intentionally DIM (~25% visual intensity: text-white/25)
						- Soft off-white / graphite
						- No aggressive glow or shadow
						- Targetable via [data-kr0n-logo] and .kr0n-logo-stage
						- Ready for custom user hover animation later
					*/}
					<div
						data-kr0n-logo='brand-wordmark'
						className='kr0n-logo-stage text-[18vw] sm:text-[15vw] font-black uppercase tracking-tight text-white/25 hover:text-white/40 transition-colors duration-300 leading-none text-center select-none cursor-default'
					>
						KR0N
					</div>

					{/* Center Node on Axis */}
					<div className='w-2 h-2 rounded-full bg-white/30 border border-white/20 mt-4 pointer-events-none' />
				</div>

				{/* Bottom Coordinates & Technical Readouts */}
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-widest text-[#858C95] pt-4 border-t border-[#242930]'>
					<div className='flex items-center gap-3'>
						<span>CORE SIGNAL PROCESSING</span>
						<span className='text-[#363D47]'>/</span>
						<span>ZERO INFRASTRUCTURE MACHINERY</span>
					</div>
					<div className='flex items-center gap-6'>
						<span>STANDBY FOR INTERACTION</span>
						<span className='text-[#363D47]'>/</span>
						<span>PROTOCOL: v1.8.4</span>
					</div>
				</div>
			</div>
		</section>
	);
}
