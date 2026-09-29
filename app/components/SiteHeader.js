'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, ArrowUpRight } from 'lucide-react';

export default function SiteHeader({ onOpenCommand }) {
	const [mobileOpen, setMobileOpen] = useState(false);

	const links = [
		{ name: 'Docs', href: '/docs' },
		{ name: 'Quick Start', href: '/docs/quick-start' },
		{ name: 'Templates', href: '/docs/templates' },
		{ name: 'CLI', href: '/docs/cli' },
	];

	return (
		<header className='sticky top-0 z-40 w-full border-b border-white/10 bg-black/85 backdrop-blur-xl'>
			<div className='max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between'>
				{/* Left: Brand mark & nav */}
				<div className='flex items-center gap-6'>
					<Link
						href='/'
						className='flex items-center gap-3 text-lg font-black tracking-widest text-white hover:text-white/80 transition-colors'
					>
						<span>kr0n</span>
						<span className='border border-white/20 bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono font-normal uppercase tracking-widest text-white/50'>
							PLATFORM // v1.8.4
						</span>
					</Link>

					<span className='hidden md:inline-block text-white/20'>/</span>

					{/* Desktop Navigation */}
					<nav
						className='hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-wider'
						aria-label='Main Navigation'
					>
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className='text-white/60 hover:text-white transition-colors py-1'
							>
								{link.name}
							</Link>
						))}
					</nav>
				</div>

				{/* Right affordances */}
				<div className='flex items-center gap-3 sm:gap-4'>
					{/* Search trigger button */}
					<button
						type='button'
						onClick={onOpenCommand}
						className='flex items-center gap-2.5 border border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] px-3.5 py-1.5 text-xs text-white/60 hover:text-white transition-all'
						aria-label='Open Command Palette (⌘K)'
					>
						<Search size={13} className='text-white/70' />
						<span className='hidden sm:inline text-[11px] font-mono'>
							Search or act...
						</span>
						<kbd className='border border-white/20 bg-white/5 px-1.5 py-0.2 text-[9px] font-mono text-white/40'>
							⌘K
						</kbd>
					</button>

					{/* Log In */}
					<button
						type='button'
						onClick={onOpenCommand}
						className='hidden sm:inline-block text-xs font-mono uppercase text-white/60 hover:text-white px-2 py-1 transition-colors'
					>
						Log in
					</button>

					{/* Primary Get Started Button */}
					<Link
						href='/docs/quick-start'
						className='clipped-btn bg-white hover:bg-neutral-200 text-black px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-colors'
					>
						Get started
					</Link>

					{/* Mobile Menu Toggle */}
					<button
						type='button'
						onClick={() => setMobileOpen(!mobileOpen)}
						className='md:hidden p-1.5 text-white/70 hover:text-white focus:outline-none'
						aria-label='Toggle navigation menu'
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			{/* Mobile Dropdown Menu */}
			{mobileOpen && (
				<div className='md:hidden border-b border-white/10 bg-[#0d0e11] px-6 py-5 space-y-4'>
					<nav className='flex flex-col gap-3 text-xs font-mono uppercase tracking-wider'>
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMobileOpen(false)}
								className='py-1.5 text-white/70 hover:text-white transition-colors flex items-center justify-between border-b border-white/5'
							>
								<span>{link.name}</span>
								<ArrowUpRight size={12} className='text-white/40' />
							</Link>
						))}
					</nav>

					<div className='pt-2 flex items-center justify-between'>
						<button
							type='button'
							onClick={() => {
								setMobileOpen(false);
								onOpenCommand();
							}}
							className='text-xs font-mono text-white/70 flex items-center gap-2'
						>
							<Search size={14} />
							<span>Search ⌘K</span>
						</button>
						<Link
							href='/docs/quick-start'
							onClick={() => setMobileOpen(false)}
							className='clipped-btn bg-white text-black px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold'
						>
							Get started
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
