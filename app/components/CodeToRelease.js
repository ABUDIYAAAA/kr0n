'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, Play, Terminal } from 'lucide-react';

export default function CodeToRelease() {
	const [isRunning, setIsRunning] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard?.writeText('https://storefront.kr0n.app');
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const triggerRun = () => {
		setIsRunning(true);
		setTimeout(() => setIsRunning(false), 1400);
	};

	return (
		<section className='relative py-28 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#050607] overflow-hidden'>
			<div className='max-w-5xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='max-w-2xl space-y-3'>
					<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50'>
						<span className='w-1.5 h-1.5 bg-white' />
						<span>PROGRAMMATIC DEPLOYMENT</span>
					</div>
					<h2 className='text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight'>
						Code becomes infrastructure. <br />
						<span className='text-white/50'>Without writing cluster manifests.</span>
					</h2>
					<p className='text-sm sm:text-base text-zinc-400 font-sans leading-relaxed'>
						Define your service configuration in standard code or let the build engine
						infer defaults from your repo. KR0N compiles it into an immutable deployment.
					</p>
				</div>

				{/* Two-Column Split: Code Surface on Left, Product Result on Right */}
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch'>
					{/* Left: Clean Code Editor Surface (col-span-7) */}
					<div className='lg:col-span-7 border border-white/15 bg-[#090a0c] shadow-2xl flex flex-col justify-between overflow-hidden'>
						{/* Editor Header Bar */}
						<div className='px-4 py-3 border-b border-white/10 bg-[#0d0e11] flex items-center justify-between text-xs font-mono text-white/50'>
							<div className='flex items-center gap-2'>
								<Terminal size={14} className='text-white/60' />
								<span>deploy.config.ts</span>
							</div>
							<button
								type='button'
								onClick={triggerRun}
								className='flex items-center gap-1.5 border border-white/20 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] text-white transition-colors'
							>
								<Play size={11} className={isRunning ? 'animate-spin' : ''} />
								<span>{isRunning ? 'Compiling...' : 'Run build'}</span>
							</button>
						</div>

						{/* Code Block Content */}
						<div className='p-5 sm:p-6 font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed overflow-x-auto'>
							<div>
								<span className='text-white/40'>01</span>{' '}
								<span className='text-white/60'>import</span> &#123; deploy &#125;{' '}
								<span className='text-white/60'>from</span>{' '}
								<span className='text-emerald-400'>&quot;kr0n&quot;</span>;
							</div>
							<div className='text-white/30'>02</div>
							<div>
								<span className='text-white/40'>03</span>{' '}
								<span className='text-white font-bold'>export default</span>{' '}
								deploy&#40;&#123;
							</div>
							<div>
								<span className='text-white/40'>04</span>{' '}
								<span className='text-white/60 pl-4'>service:</span>{' '}
								<span className='text-emerald-400'>&quot;storefront&quot;</span>,
							</div>
							<div>
								<span className='text-white/40'>05</span>{' '}
								<span className='text-white/60 pl-4'>environment:</span>{' '}
								<span className='text-emerald-400'>&quot;production&quot;</span>,
							</div>
							<div>
								<span className='text-white/40'>06</span>{' '}
								<span className='text-white/60 pl-4'>healthCheck:</span>{' '}
								<span className='text-emerald-400'>&quot;/api/health&quot;</span>,
							</div>
							<div>
								<span className='text-white/40'>07</span>{' '}
								<span className='text-white/60 pl-4'>autoRollback:</span>{' '}
								<span className='text-white font-semibold'>true</span>,
							</div>
							<div>
								<span className='text-white/40'>08</span> &#125;&#41;;
							</div>
						</div>

						{/* Bottom Code Indicator */}
						<div className='px-5 py-2.5 bg-[#0d0e11] border-t border-white/10 text-[11px] font-mono text-white/40 flex items-center justify-between'>
							<span>Hermetic compilation engine</span>
							<span className='text-emerald-400'>TypeScript 5.8 verified</span>
						</div>
					</div>

					{/* Right: Live Result / Deployment Surface (col-span-5) */}
					<div className='lg:col-span-5 border border-white/15 bg-[#0d0e11] shadow-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6'>
						<div className='space-y-4'>
							<div className='flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono'>
								<span className='text-white/50 uppercase'>IMMUTABLE ARTIFACT</span>
								<span className='text-emerald-400 font-bold'>LIVE // ACTIVE</span>
							</div>

							<div className='space-y-1'>
								<div className='text-lg font-bold text-white font-mono'>
									storefront
								</div>
								<div className='text-xs font-mono text-white/50'>
									production • release v1.8.4
								</div>
							</div>

							{/* Verification Checklist */}
							<div className='space-y-2.5 pt-2'>
								<div className='flex items-center justify-between p-2.5 bg-[#111215] border border-white/10 text-xs font-mono'>
									<div className='flex items-center gap-2'>
										<Check size={14} className='text-emerald-400' />
										<span className='text-white'>BUILD</span>
									</div>
									<span className='text-white/50 text-[11px]'>18.2s complete</span>
								</div>

								<div className='flex items-center justify-between p-2.5 bg-[#111215] border border-white/10 text-xs font-mono'>
									<div className='flex items-center gap-2'>
										<Check size={14} className='text-emerald-400' />
										<span className='text-white'>VERIFY</span>
									</div>
									<span className='text-white/50 text-[11px]'>0 CVEs passed</span>
								</div>

								<div className='flex items-center justify-between p-2.5 bg-[#111215] border border-white/10 text-xs font-mono'>
									<div className='flex items-center gap-2'>
										<Check size={14} className='text-emerald-400' />
										<span className='text-white'>LIVE</span>
									</div>
									<span className='text-emerald-400 text-[11px]'>100% traffic</span>
								</div>
							</div>
						</div>

						{/* Endpoint link container */}
						<div className='pt-4 border-t border-white/10 space-y-2 font-mono text-xs'>
							<span className='text-white/40 block text-[10px] uppercase'>
								Public Edge Endpoint
							</span>
							<div className='flex items-center justify-between p-2 bg-[#090a0c] border border-white/10'>
								<span className='text-white truncate'>
									https://storefront.kr0n.app
								</span>
								<button
									type='button'
									onClick={handleCopy}
									className='ml-2 text-white/60 hover:text-white transition-colors shrink-0'
									title='Copy endpoint URL'
								>
									{copied ? (
										<span className='text-[10px] text-emerald-400'>COPIED</span>
									) : (
										<Copy size={13} />
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
