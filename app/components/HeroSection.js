'use client';

import Link from 'next/link';
import TechText from '@/components/landing/TechText';

export default function HeroSection({ onOpenCommand }) {
	return (
		<section
			id='hero'
			className='relative border-b border-[#242930] overflow-hidden bg-[#090B0E]'
			data-kr0n-motion='HeroScene'
		>
			<div className='relative pt-20 sm:pt-28 pb-20 sm:pb-32 px-6 sm:px-12 max-w-7xl mx-auto border-x border-[#242930]'>
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center'>
					{/* Left: Message & Actions (col-span-7) */}
					<div className='lg:col-span-7 space-y-8 z-10'>
						{/* Eyebrow / System Label */}
						<div
							data-kr0n-motion='HeroSystemLabel'
							className='inline-flex items-center gap-2.5 border border-[#363D47] bg-[#111419] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-[#C4C8CE]'
						>
							<span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
							<span>APPLICATION INFRASTRUCTURE // FOR PEOPLE WHO SHIP</span>
							<span className='text-[#4E5560] select-none'>|</span>
							<span className='text-[#858C95]'>v1.8.4</span>
						</div>

						{/* Left-biased Asymmetric Headline */}
						<h1
							data-kr0n-reveal='headline'
							className='text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[0.98]'
						>
							Ship the <br />
							application. <br />
							<span className='text-[#6C7480] font-extrabold'>Stay in the work.</span>
						</h1>

						{/* Supporting Text */}
						<p
							data-kr0n-reveal='support'
							className='text-base sm:text-lg text-[#C4C8CE] max-w-xl leading-relaxed font-sans'
						>
							Deploy and operate applications without turning infrastructure into another job. One deterministic path from code to running software.
						</p>

						{/* Understated Actions */}
						<div
							data-kr0n-reveal='actions'
							className='pt-2 flex flex-wrap items-center gap-3 sm:gap-4'
						>
							<Link
								href='/docs/quick-start'
								className='clipped-btn bg-white hover:bg-neutral-200 text-black px-7 py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-lg hover:shadow-white/10'
							>
								Get started
							</Link>
							<Link
								href='/docs'
								className='border border-[#363D47] bg-[#111419] hover:border-white/40 hover:bg-[#15191E] text-[#F3F4F6] px-6 py-3 text-xs font-mono uppercase tracking-wider transition-all'
							>
								Read the docs
							</Link>
							<button
								type='button'
								onClick={onOpenCommand}
								className='hidden sm:inline-flex items-center gap-2 border border-[#242930] hover:border-[#363D47] bg-[#0D1014] text-[#858C95] hover:text-white px-5 py-3 text-xs font-mono uppercase tracking-wider transition-all'
							>
								<span className='text-[#4E5560]'>⌘K</span>
								<span>Quick actions</span>
							</button>
						</div>
					</div>

					{/* Right: Animated KR0N Wordmark (col-span-5) */}
					<div className='lg:col-span-5 flex items-center justify-center lg:justify-end select-none'>
						<div className='kr0n-hero-wordmark relative w-full max-w-[440px] h-[220px] sm:h-[260px] lg:h-[300px] flex items-center justify-center lg:justify-end'>
							<TechText
								text='KR0N'
								fontWeight={900}
								fontSize={110}
								reveal='letter'
								dashLength={4}
								dashGap={2}
								specks={0}
								color='#9CA3AF'
								accentColor='#FFFFFF'
								letterSpacing={-0.03}
								reach={180}
								softness={0.7}
								strokeWidth={1.5}
								speed={0.8}
								lineStyle='dashed'
								selection={false}
								labels={false}
								draggable={false}
								sweep={true}
								className='w-full h-full'
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
