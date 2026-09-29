'use client';

import Link from 'next/link';
import { ArrowUpRight, Radio } from 'lucide-react';

export default function SiteFooter({ onOpenCommand }) {
	return (
		<footer className='border-t border-white/10 bg-black py-16 text-white'>
			<div className='max-w-7xl mx-auto px-6 sm:px-8 space-y-12'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-10'>
					{/* Brand Column */}
					<div className='space-y-4 md:col-span-1'>
						<div className='flex items-center gap-3 text-lg font-black tracking-widest text-white'>
							<span>kr0n</span>
							<span className='border border-white/20 px-2 py-0.5 text-[9px] font-mono font-normal uppercase tracking-widest text-white/50'>
								PLATFORM // v1.8.4
							</span>
						</div>
						<p className='text-xs text-zinc-400 font-sans leading-relaxed'>
							Application-centric developer infrastructure. Build, release, and
							operate software without managing cloud complexity.
						</p>
						<div className='inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-mono text-emerald-400'>
							<span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
							<span>SYSTEMS NOMINAL // US-EAST-1</span>
						</div>
					</div>

					{/* Navigation: Documentation */}
					<div className='space-y-3 font-mono text-xs'>
						<div className='text-white/40 uppercase tracking-widest text-[11px]'>
							DOCUMENTATION
						</div>
						<ul className='space-y-2 text-white/60'>
							<li>
								<Link
									href='/docs/quick-start'
									className='hover:text-white transition-colors flex items-center gap-1.5'
								>
									<span>Quick Start Guide</span>
									<ArrowUpRight size={11} className='text-white/30' />
								</Link>
							</li>
							<li>
								<Link
									href='/docs/templates'
									className='hover:text-white transition-colors flex items-center gap-1.5'
								>
									<span>Framework Templates</span>
									<ArrowUpRight size={11} className='text-white/30' />
								</Link>
							</li>
							<li>
								<Link
									href='/docs/cli'
									className='hover:text-white transition-colors flex items-center gap-1.5'
								>
									<span>Command-Line Interface</span>
									<ArrowUpRight size={11} className='text-white/30' />
								</Link>
							</li>
							<li>
								<Link
									href='/docs/ai'
									className='hover:text-white transition-colors flex items-center gap-1.5'
								>
									<span>AI Agents & Workflows</span>
									<ArrowUpRight size={11} className='text-white/30' />
								</Link>
							</li>
						</ul>
					</div>

					{/* Navigation: Architecture */}
					<div className='space-y-3 font-mono text-xs'>
						<div className='text-white/40 uppercase tracking-widest text-[11px]'>
							SYSTEM MAP
						</div>
						<ul className='space-y-2 text-white/60'>
							<li>
								<a href='#rail' className='hover:text-white transition-colors'>
									Release Rail System
								</a>
							</li>
							<li>
								<a
									href='#command-flow'
									className='hover:text-white transition-colors'
								>
									Command Layer
								</a>
							</li>
							<li>
								<a
									href='#capabilities'
									className='hover:text-white transition-colors'
								>
									Operational Pillars
								</a>
							</li>
							<li>
								<a
									href='#releases'
									className='hover:text-white transition-colors'
								>
									Release Audit Trail
								</a>
							</li>
						</ul>
					</div>

					{/* Mental Model */}
					<div className='space-y-3 font-mono text-xs'>
						<div className='text-white/40 uppercase tracking-widest text-[11px]'>
							HIERARCHY MODEL
						</div>
						<div className='p-3 bg-[#0d0e11] border border-white/10 text-[11px] space-y-1 text-white/50'>
							<div className='text-white font-bold'>Organization</div>
							<div className='pl-2 text-white/70'>↳ Project</div>
							<div className='pl-4 text-white/70'>↳ Environment</div>
							<div className='pl-6 text-white font-bold text-white'>↳ Service</div>
							<div className='pl-8 text-emerald-400 font-bold'>↳ Deployment</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className='pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40'>
					<div>© 2026 KR0N Platform. Built for developers who ship.</div>
					<div className='flex items-center gap-4'>
						<span>Protocol: v1.8.4</span>
						<span>•</span>
						<button
							type='button'
							onClick={onOpenCommand}
							className='hover:text-white transition-colors'
						>
							Search ⌘K
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
}
