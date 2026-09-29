'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

export default function HeroSection({ onOpenCommand }) {
	return (
		<section className='relative pt-20 sm:pt-28 pb-24 sm:pb-32 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 overflow-hidden'>
			{/* Technical Grid Background */}
			<div
				className='absolute inset-0 pointer-events-none opacity-20 kr0n-grid-bg'
				aria-hidden='true'
			/>
			<div
				className='absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-white/[0.03] to-transparent blur-3xl pointer-events-none'
				aria-hidden='true'
			/>

			<div className='relative max-w-4xl mx-auto text-center space-y-8'>
				{/* Technical Eyebrow */}
				<motion.div
					initial={{ opacity: 0, y: -6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-white/70'
				>
					<Radio size={12} className='text-emerald-400 animate-pulse' />
					<span>APPLICATION INFRASTRUCTURE FOR PEOPLE WHO SHIP</span>
				</motion.div>

				{/* Headline */}
				<motion.h1
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className='text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-[1.06]'
				>
					From commit to live, <br />
					<span className='text-white/50'>without the infrastructure work.</span>
				</motion.h1>

				{/* Supporting Paragraph */}
				<motion.p
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className='text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-sans'
				>
					Build, release, and operate applications without turning infrastructure into
					another job. One deterministic path from code to running software.
				</motion.p>

				{/* Action CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className='pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4'
				>
					<Link
						href='/docs/quick-start'
						className='clipped-btn bg-white hover:bg-neutral-200 text-black px-6 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-lg'
					>
						Get started
					</Link>
					<Link
						href='/docs'
						className='border border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] text-white px-5 py-3 text-xs font-mono uppercase tracking-wider transition-all'
					>
						Read the docs
					</Link>
					<button
						type='button'
						onClick={onOpenCommand}
						className='hidden sm:flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all'
					>
						<span className='text-white/40'>⌘K</span>
						<span>Quick actions</span>
					</button>
				</motion.div>
			</div>
		</section>
	);
}
