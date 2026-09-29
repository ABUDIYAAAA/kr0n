'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Play, ArrowDown, ExternalLink } from 'lucide-react';

export default function CodeToRelease() {
	const [compilingStep, setCompilingStep] = useState(3); // 0 = code highlight, 1 = build, 2 = verify, 3 = live
	const [copied, setCopied] = useState(false);

	// Cycle through compilation sequence to show living motion
	useEffect(() => {
		const interval = setInterval(() => {
			setCompilingStep((prev) => (prev < 3 ? prev + 1 : 0));
		}, 2600);
		return () => clearInterval(interval);
	}, []);

	const triggerRun = () => {
		setCompilingStep(0);
		setTimeout(() => setCompilingStep(1), 600);
		setTimeout(() => setCompilingStep(2), 1200);
		setTimeout(() => setCompilingStep(3), 1800);
	};

	const handleCopy = () => {
		navigator.clipboard?.writeText('https://storefront.kr0n.app');
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section
			id='code-release'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#090B0E] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='CodeReleaseScene'
		>
			<div className='max-w-7xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#242930]'>
					<div className='max-w-2xl space-y-3'>
						<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#858C95]'>
							<span className='w-1.5 h-1.5 bg-white' />
							<span>COMPOSITION // 04</span>
							<span className='text-[#363D47] select-none'>|</span>
							<span className='text-white font-semibold'>CODE INTO MOTION</span>
						</div>

						<h2 className='text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.05]'>
							Code becomes <br />
							<span className='text-[#6C7480] font-extrabold'>running software.</span>
						</h2>
					</div>

					<button
						type='button'
						onClick={triggerRun}
						className='flex items-center gap-2 border border-[#363D47] bg-[#111419] hover:bg-[#15191E] text-white px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors self-start sm:self-auto'
					>
						<Play size={12} className={compilingStep < 3 ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
						<span>{compilingStep < 3 ? 'Compiling release...' : 'Run build demo'}</span>
					</button>
				</div>

				{/* Editorial Code Composition: Non-card Flow */}
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch'>
					{/* Left Area: High-contrast Editorial Code Panel (col-span-7) */}
					<div
						data-kr0n-code='CodePanel'
						className='lg:col-span-7 bg-[#0D1014] border border-[#242930] p-6 sm:p-8 flex flex-col justify-between shadow-xl'
					>
						<div className='flex items-center justify-between text-xs font-mono text-[#858C95] pb-4 border-b border-[#242930]'>
							<div className='flex items-center gap-2'>
								<span className='text-white font-bold'>deploy.config.ts</span>
								<span className='text-[#363D47]'>—</span>
								<span>DECLARATIVE SPECIFICATION</span>
							</div>
							<span className='text-[10px] text-emerald-400'>TYPESCRIPT 5.8</span>
						</div>

						{/* Editorial Code Block with Active Pulse on Execution Line */}
						<div className='py-6 font-mono text-xs sm:text-sm leading-relaxed text-[#C4C8CE] space-y-1 overflow-x-auto'>
							<div className='text-[#4E5560] text-xs pb-2 select-none'>// 01: Declare service configuration</div>
							<div>
								<span className='text-[#858C95]'>import</span> &#123; deploy &#125;{' '}
								<span className='text-[#858C95]'>from</span>{' '}
								<span className='text-emerald-400'>&quot;kr0n&quot;</span>;
							</div>
							<div className='text-[#242930] select-none'>&nbsp;</div>
							<motion.div
								data-kr0n-code='CodeLineHighlight'
								className={`-mx-4 px-4 py-1.5 transition-colors border-l-2 ${
									compilingStep >= 0 ? 'bg-white/[0.06] border-white' : 'border-transparent'
								}`}
							>
								<span className='text-white font-bold'>await</span> deploy&#40;&#123;
							</motion.div>
							<div className='pl-6'>
								<span className='text-[#858C95]'>service:</span>{' '}
								<span className='text-emerald-400'>&quot;storefront&quot;</span>,
							</div>
							<div className='pl-6'>
								<span className='text-[#858C95]'>environment:</span>{' '}
								<span className='text-emerald-400'>&quot;production&quot;</span>,
							</div>
							<div className='pl-6'>
								<span className='text-[#858C95]'>healthCheck:</span>{' '}
								<span className='text-emerald-400'>&quot;/api/health&quot;</span>,
							</div>
							<div className='pl-6'>
								<span className='text-[#858C95]'>autoRollback:</span>{' '}
								<span className='text-white font-semibold'>true</span>,
							</div>
							<div>&#125;&#41;;</div>
						</div>

						{/* Bottom Code Indicator */}
						<div className='pt-4 border-t border-[#242930] flex items-center justify-between text-xs font-mono text-[#858C95]'>
							<div className='flex items-center gap-2'>
								<span
									data-kr0n-code='CodeCursor'
									className='w-2 h-4 bg-white animate-pulse'
								/>
								<span>Hermetic compiler active</span>
							</div>
							<span className='text-[#F3F4F6] font-bold'>0 CONFIG DEBT</span>
						</div>
					</div>

					{/* Right Area: Direct Embedded Release State (col-span-5) */}
					<div
						data-kr0n-code='ReleaseState'
						className='lg:col-span-5 bg-[#111419] border border-[#242930] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl'
					>
						<div className='space-y-4'>
							<div className='flex items-center justify-between pb-3 border-b border-[#242930] text-xs font-mono'>
								<span className='text-[#858C95] uppercase'>IMMUTABLE ARTIFACT</span>
								<span className='text-emerald-400 font-bold'>
									{compilingStep === 3 ? '● LIVE // ACTIVE' : 'BUILDING...'}
								</span>
							</div>

							<div className='space-y-1'>
								<div className='text-2xl sm:text-3xl font-black font-mono uppercase text-white tracking-tight'>
									storefront
								</div>
								<div className='text-xs font-mono text-[#858C95] flex items-center gap-2'>
									<span>production</span>
									<span>•</span>
									<span className='text-white font-bold'>release v1.8.4</span>
								</div>
							</div>

							{/* Verification Checklist with Sequential Lights */}
							<div className='space-y-3 font-mono text-xs pt-2'>
								<div className={`flex items-center justify-between p-2.5 border transition-all ${
									compilingStep >= 1
										? 'bg-[#15191E] border-white/20 text-white'
										: 'bg-[#0D1014] border-[#242930] text-[#4E5560]'
								}`}>
									<div className='flex items-center gap-2.5'>
										<Check size={13} className={compilingStep >= 1 ? 'text-emerald-400' : 'text-[#4E5560]'} />
										<span className='font-bold'>BUILD</span>
									</div>
									<span className='text-[11px]'>{compilingStep >= 1 ? '14.2s hermetic cache' : 'queued'}</span>
								</div>

								<div className={`flex items-center justify-between p-2.5 border transition-all ${
									compilingStep >= 2
										? 'bg-[#15191E] border-white/20 text-white'
										: 'bg-[#0D1014] border-[#242930] text-[#4E5560]'
								}`}>
									<div className='flex items-center gap-2.5'>
										<Check size={13} className={compilingStep >= 2 ? 'text-emerald-400' : 'text-[#4E5560]'} />
										<span className='font-bold'>VERIFY</span>
									</div>
									<span className='text-[11px]'>{compilingStep >= 2 ? '0 CVEs • signed SBOM' : 'pending'}</span>
								</div>

								<div className={`flex items-center justify-between p-2.5 border transition-all ${
									compilingStep >= 3
										? 'bg-[#15191E] border-emerald-500/30 text-white'
										: 'bg-[#0D1014] border-[#242930] text-[#4E5560]'
								}`}>
									<div className='flex items-center gap-2.5'>
										<Check size={13} className={compilingStep >= 3 ? 'text-emerald-400' : 'text-[#4E5560]'} />
										<span className='font-bold'>LIVE</span>
									</div>
									<span className={compilingStep >= 3 ? 'text-emerald-400 text-[11px] font-bold' : 'text-[#4E5560] text-[11px]'}>
										{compilingStep >= 3 ? '100% traffic shifted' : 'pending cutover'}
									</span>
								</div>
							</div>
						</div>

						{/* Edge Endpoint Line */}
						<div
							data-kr0n-code='EndpointLine'
							className='pt-4 border-t border-[#242930] space-y-2 font-mono text-xs'
						>
							<div className='text-[10px] uppercase tracking-widest text-[#858C95]'>
								RESOLVED PUBLIC ENDPOINT
							</div>
							<div className='flex items-center justify-between p-2.5 bg-[#0D1014] border border-[#242930]'>
								<span className='text-white font-medium truncate text-xs'>
									https://storefront.kr0n.app
								</span>
								<button
									type='button'
									onClick={handleCopy}
									className='ml-2 text-[#858C95] hover:text-white transition-colors shrink-0'
									title='Copy endpoint'
								>
									{copied ? (
										<span className='text-[10px] text-emerald-400 font-bold'>COPIED</span>
									) : (
										<Copy size={12} />
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
