'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

export default function FinalCTA({ onOpenCommand }) {
	return (
		<section
			id='cta'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#090B0E] border-b border-[#242930] overflow-hidden text-center'
			data-kr0n-motion='FinalCTAScene'
		>
			<div className='max-w-4xl mx-auto space-y-10'>
				{/* Eyebrow */}
				<div className='inline-flex items-center gap-2 border border-[#363D47] bg-[#111419] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-[#858C95]'>
					<span className='w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse' />
					<span>NARRATIVE RESOLUTION // 08</span>
				</div>

				{/* Cinematic Final Sentence (stable for user future animation) */}
				<h2
					data-kr0n-reveal='cta-headline'
					className='text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.02]'
				>
					Ship what you came <br />
					<span className='text-[#6C7480] font-extrabold'>here to build.</span>
				</h2>

				{/* Supporting Sentence */}
				<p
					data-kr0n-reveal='cta-support'
					className='text-sm sm:text-base text-[#C4C8CE] max-w-xl mx-auto font-sans leading-relaxed'
				>
					KR0N keeps the infrastructure layer out of the way. Connect your repository and launch your first service in seconds.
				</p>

				{/* Actions */}
				<div
					data-kr0n-reveal='cta-actions'
					className='pt-2 flex flex-wrap items-center justify-center gap-4'
				>
					<Link
						href='/docs/quick-start'
						className='clipped-btn bg-white hover:bg-neutral-200 text-black px-8 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-xl hover:shadow-white/10'
					>
						Get started
					</Link>
					<Link
						href='/docs'
						className='border border-[#363D47] bg-[#111419] hover:border-white/40 hover:bg-[#15191E] text-white px-7 py-3 text-xs font-mono uppercase tracking-wider transition-all'
					>
						Read the docs
					</Link>
					<button
						type='button'
						onClick={onOpenCommand}
						className='hidden sm:inline-flex items-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#0D1014] text-[#858C95] hover:text-white px-5 py-3 text-xs font-mono uppercase tracking-wider transition-all'
					>
						<span>⌘K Search</span>
					</button>
				</div>

				{/* Animated Narrative Closure: Final Release Line Traveling from SOURCE to LIVE */}
				<div
					data-kr0n-release='SettledLive'
					className='pt-12 sm:pt-16 border-t border-[#242930] space-y-4 max-w-2xl mx-auto'
				>
					<div className='flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#858C95]'>
						<span>SOURCE</span>
						<span className='hidden sm:inline'>BUILD</span>
						<span className='hidden sm:inline'>VERIFY</span>
						<span className='hidden sm:inline'>RELEASE</span>
						<span className='text-emerald-400 font-bold'>● LIVE</span>
					</div>

					<div className='relative w-full h-px bg-[#242930] overflow-hidden'>
						{/* Active Traveling Pulse settling into LIVE */}
						<motion.div
							className='absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
							animate={{ left: ['-20%', '100%'] }}
							transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
						/>
						<div className='absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]' />
					</div>

					<div className='flex items-center justify-between text-[10px] font-mono text-[#858C95] pt-1'>
						<span>REPOSITORIES SYNCHRONIZED</span>
						<span className='text-emerald-400 font-medium'>RELEASE RESOLVED // ACTIVE RUNTIME</span>
					</div>
				</div>
			</div>
		</section>
	);
}
