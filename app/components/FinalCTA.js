'use client';

import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';

export default function FinalCTA({ onOpenCommand }) {
	return (
		<section
			id='cta'
			className='relative py-32 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#090a0c] text-center overflow-hidden'
		>
			<div className='max-w-4xl mx-auto space-y-8'>
				{/* Eyebrow */}
				<div className='inline-flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-white/50'>
					<span>READY TO SHIP</span>
				</div>

				{/* Massive Confident Headline */}
				<h2 className='text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-[1.04]'>
					Ship what you came <br />
					<span className='text-white/40'>here to build.</span>
				</h2>

				{/* Supporting Paragraph */}
				<p className='text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed'>
					Connect your repository and deploy your first application service in under two
					minutes. Zero cluster management, zero configuration debt.
				</p>

				{/* Actions */}
				<div className='pt-4 flex flex-wrap items-center justify-center gap-4'>
					<Link
						href='/docs/quick-start'
						className='clipped-btn bg-white hover:bg-neutral-200 text-black px-7 py-3.5 text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-xl'
					>
						Get started
					</Link>
					<Link
						href='/docs'
						className='border border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] text-white px-6 py-3.5 text-xs font-mono uppercase tracking-wider transition-all'
					>
						Explore the docs
					</Link>
					<button
						type='button'
						onClick={onOpenCommand}
						className='hidden sm:flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-5 py-3.5 text-xs font-mono uppercase tracking-wider transition-all'
					>
						<span>⌘K Search</span>
					</button>
				</div>

				{/* Technical Footnote */}
				<div className='pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-white/40'>
					<span>Free Developer Tier</span>
					<span>•</span>
					<span>OCI Standard Containers</span>
					<span>•</span>
					<span>Deterministic Rollback</span>
				</div>
			</div>
		</section>
	);
}
