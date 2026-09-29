'use client';

import Link from 'next/link';

export default function SiteFooter({ onOpenCommand }) {
	return (
		<footer className='border-t border-[#242930] bg-[#0B0E12] py-14 text-white'>
			<div className='max-w-7xl mx-auto px-6 sm:px-12 space-y-8'>
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-8'>
					{/* Left: Brand Wordmark & Tagline */}
					<div className='space-y-2'>
						<div className='flex items-center gap-3 text-lg font-black tracking-widest text-white'>
							<span>KR0N</span>
							<span className='border border-[#363D47] bg-[#111419] px-2 py-0.5 text-[9px] font-mono font-normal uppercase tracking-widest text-[#858C95]'>
								PLATFORM // v1.8.4
							</span>
						</div>
						<p className='text-xs text-zinc-400 font-sans max-w-sm'>
							Application-centric developer infrastructure. Build, release, and operate software without managing cloud complexity.
						</p>
					</div>

					{/* Right: Minimal Links */}
					<nav
						className='flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-mono uppercase tracking-wider text-white/60'
						aria-label='Footer Navigation'
					>
						<Link href='/docs' className='hover:text-white transition-colors'>
							Docs
						</Link>
						<Link href='/docs/quick-start' className='hover:text-white transition-colors'>
							Product
						</Link>
						<Link href='/billing' className='hover:text-white transition-colors'>
							Pricing
						</Link>
						<a
							href='https://github.com'
							target='_blank'
							rel='noreferrer'
							className='hover:text-white transition-colors'
						>
							GitHub
						</a>
						<button
							type='button'
							onClick={onOpenCommand}
							className='text-white/40 hover:text-white transition-colors'
						>
							⌘K
						</button>
					</nav>
				</div>

				{/* Bottom Technical Single Line */}
				<div className='pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-white/30'>
					<div>© 2026 KR0N Platform. Built for developers who ship.</div>
					<div className='flex items-center gap-4'>
						<span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
						<span className='text-white/50'>SYSTEMS NOMINAL // US-EAST-1</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
