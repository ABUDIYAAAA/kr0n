'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Check, ArrowRight, CornerDownLeft, Play, Radio } from 'lucide-react';

export default function CommandFlow() {
	const [status, setStatus] = useState('idle'); // 'idle' | 'executing' | 'deployed'

	const handleExecute = () => {
		if (status === 'executing') return;
		setStatus('executing');
		setTimeout(() => {
			setStatus('deployed');
		}, 1800);
	};

	const handleReset = () => {
		setStatus('idle');
	};

	return (
		<section
			id='command-flow'
			className='relative py-28 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#090a0c] overflow-hidden'
		>
			<div className='max-w-4xl mx-auto space-y-12 text-center'>
				{/* Editorial Header */}
				<div className='space-y-4'>
					<div className='inline-flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-white/50'>
						<span>KEYBOARD-FIRST CONTROL</span>
					</div>
					<h2 className='text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-[1.08]'>
						It’s not about deploying faster. <br />
						<span className='text-white/40'>It’s about staying in flow.</span>
					</h2>
					<p className='text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed'>
						Trigger immutable releases, inspect service state, and execute rollbacks
						without ever switching context away from your keyboard.
					</p>
				</div>

				{/* The Tactile Command Canvas */}
				<div className='max-w-2xl mx-auto border border-white/20 bg-[#0d0e11] shadow-2xl text-left overflow-hidden'>
					{/* Top Terminal Bar */}
					<div className='px-5 py-3 border-b border-white/10 bg-[#111215] flex items-center justify-between text-xs font-mono text-white/50'>
						<div className='flex items-center gap-2'>
							<span className='w-2 h-2 rounded-full bg-white/20' />
							<span>KR0N COMMAND LAYER</span>
						</div>
						<div className='flex items-center gap-2'>
							<kbd className='border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60'>
								⌘ K
							</kbd>
						</div>
					</div>

					{/* Command Search Bar */}
					<div className='p-5 border-b border-white/10 bg-[#090a0c] flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3 w-full'>
							<span className='text-white/40 font-mono text-sm'>&gt;</span>
							<span className='text-sm sm:text-base font-mono text-white font-medium'>
								Deploy storefront to production
							</span>
							<span className='w-2 h-4 bg-white animate-pulse' />
						</div>

						{status === 'idle' ? (
							<button
								type='button'
								onClick={handleExecute}
								className='clipped-btn bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors'
							>
								<span>Deploy</span>
								<CornerDownLeft size={12} />
							</button>
						) : (
							<button
								type='button'
								onClick={handleReset}
								className='border border-white/15 hover:border-white/30 text-white/60 hover:text-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider shrink-0 transition-colors'
							>
								Reset
							</button>
						)}
					</div>

					{/* Command Results / Contextual State Drawer */}
					<div className='p-5 bg-[#0d0e11] space-y-4'>
						<div className='flex items-center justify-between text-xs font-mono text-white/40 pb-2 border-b border-white/5'>
							<span>TARGET SPECIFICATION</span>
							<span>REGION // US-EAST-1</span>
						</div>

						<div className='grid grid-cols-3 gap-3 text-xs font-mono'>
							<div className='p-3 bg-[#111215] border border-white/10'>
								<span className='text-white/40 block text-[10px] uppercase'>
									Service
								</span>
								<span className='text-white font-bold mt-0.5 block'>
									storefront
								</span>
							</div>
							<div className='p-3 bg-[#111215] border border-white/10'>
								<span className='text-white/40 block text-[10px] uppercase'>
									Target Env
								</span>
								<span className='text-white font-bold mt-0.5 block'>
									production
								</span>
							</div>
							<div className='p-3 bg-[#111215] border border-white/10'>
								<span className='text-white/40 block text-[10px] uppercase'>
									Release
								</span>
								<span className='text-white font-bold mt-0.5 block'>v1.8.4</span>
							</div>
						</div>

						{/* Dynamic State Progression */}
						<AnimatePresence mode='wait'>
							{status === 'executing' && (
								<motion.div
									key='executing'
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									className='p-4 bg-[#111215] border border-white/20 flex items-center justify-between font-mono text-xs'
								>
									<div className='flex items-center gap-3'>
										<span className='w-2 h-2 rounded-full bg-amber-400 animate-ping' />
										<span className='text-white'>
											Compiling standalone container & verifying SBOM...
										</span>
									</div>
									<span className='text-white/50 text-[11px]'>18.2s</span>
								</motion.div>
							)}

							{status === 'deployed' && (
								<motion.div
									key='deployed'
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									className='p-4 bg-[#111215] border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs'
								>
									<div className='flex items-center gap-2.5'>
										<Check size={16} className='text-emerald-400' />
										<span className='text-white font-bold'>
											Release v1.8.4 Live: 100% traffic shifted
										</span>
									</div>
									<div className='flex items-center gap-3'>
										<span className='text-white/50 text-[11px]'>p99: 24ms</span>
										<a
											href='https://storefront.kr0n.app'
											target='_blank'
											rel='noreferrer'
											className='text-white underline hover:text-white/80 text-[11px]'
										>
											storefront.kr0n.app
										</a>
									</div>
								</motion.div>
							)}

							{status === 'idle' && (
								<div className='p-3 bg-[#090a0c] border border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40'>
									<span>Press ↵ or click Deploy to trigger execution</span>
									<span>Zero Downtime Cutover</span>
								</div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</section>
	);
}
