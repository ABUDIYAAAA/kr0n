'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CornerDownLeft, RotateCcw, ArrowRight } from 'lucide-react';

const FULL_COMMAND = 'Deploy storefront to production';

export default function CommandFlow() {
	const [typedText, setTypedText] = useState('');
	const [status, setStatus] = useState('idle'); // 'idle' | 'executing' | 'deployed'

	// Automated simulated typing of the command
	useEffect(() => {
		let currentIdx = 0;
		const typingTimer = setInterval(() => {
			if (currentIdx <= FULL_COMMAND.length) {
				setTypedText(FULL_COMMAND.slice(0, currentIdx));
				currentIdx++;
			} else {
				clearInterval(typingTimer);
			}
		}, 60);

		return () => clearInterval(typingTimer);
	}, []);

	const handleExecute = () => {
		if (status === 'executing') return;
		setStatus('executing');
		setTimeout(() => {
			setStatus('deployed');
		}, 1400);
	};

	const handleReset = () => {
		setStatus('idle');
	};

	return (
		<section
			id='command'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#0B0E12] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='CommandFlowScene'
		>
			<div className='max-w-4xl mx-auto space-y-12 text-center'>
				{/* Section Header */}
				<div className='space-y-3'>
					<div className='inline-flex items-center gap-2 border border-[#363D47] bg-[#111419] px-3.5 py-1 text-[11px] font-mono tracking-widest uppercase text-[#858C95]'>
						<span className='w-1.5 h-1.5 rounded-full bg-white/60' />
						<span>SIGNATURE INTERACTION // 03</span>
						<span className='text-[#363D47] select-none'>|</span>
						<span className='text-white font-semibold'>STAY IN THE WORK</span>
					</div>

					<h2 className='text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.04]'>
						It is not about deploying faster. <br />
						<span className='text-[#6C7480] font-extrabold'>It is about staying in flow.</span>
					</h2>

					<p className='text-sm sm:text-base text-[#C4C8CE] max-w-xl mx-auto font-sans leading-relaxed'>
						Trigger immutable releases, inspect service state, and verify health without ever switching context away from your keyboard.
					</p>
				</div>

				{/* Floating Command Canvas */}
				<div className='relative max-w-2xl mx-auto'>
					{/* The Command Palette Surface */}
					<div
						data-kr0n-command='CommandPalette'
						className='relative border border-[#242930] bg-[#111419] shadow-2xl text-left overflow-hidden'
					>
						{/* Top Header Strip with Large Keyboard Key */}
						<div className='px-5 py-3.5 border-b border-[#242930] bg-[#15191E] flex items-center justify-between text-xs font-mono text-[#858C95]'>
							<div className='flex items-center gap-2.5'>
								<span className='w-2 h-2 rounded-full bg-emerald-400' />
								<span className='text-white font-bold tracking-wider'>KR0N COMMAND LAYER</span>
							</div>

							<div
								data-kr0n-command='CommandKey'
								className='flex items-center gap-2'
							>
								<kbd className='border border-[#363D47] bg-[#191D24] px-2 py-0.5 text-xs font-mono font-bold text-white shadow-inner'>
									⌘ K
								</kbd>
							</div>
						</div>

						{/* Search Input Simulation with Automatic Typing */}
						<div className='p-5 border-b border-[#242930] bg-[#0D1014] flex items-center justify-between gap-4'>
							<div className='flex items-center gap-3 flex-1 min-w-0'>
								<span className='text-[#4E5560] font-mono text-base select-none'>&gt;</span>
								<span className='text-sm sm:text-base font-mono text-white font-medium truncate'>
									{typedText}
								</span>
								<span
									data-kr0n-command='CommandCursor'
									className='w-2 h-4 bg-white animate-pulse shrink-0'
								/>
							</div>

							{status === 'idle' ? (
								<button
									type='button'
									onClick={handleExecute}
									className='clipped-btn bg-white hover:bg-neutral-200 text-black px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-md'
								>
									<span>Deploy</span>
									<CornerDownLeft size={12} />
								</button>
							) : (
								<button
									type='button'
									onClick={handleReset}
									className='border border-[#363D47] hover:border-white/40 text-[#858C95] hover:text-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1.5'
								>
									<RotateCcw size={11} />
									<span>Reset</span>
								</button>
							)}
						</div>

						{/* Target Result Row */}
						<div
							data-kr0n-command='CommandResult'
							className='p-5 bg-[#111419] space-y-4 font-mono text-xs'
						>
							<div className='flex items-center justify-between text-[#858C95] pb-2 border-b border-[#242930] text-[11px]'>
								<span>RESOLVED TARGET ARTIFACT</span>
								<span>ENVIRONMENT // PRODUCTION</span>
							</div>

							<div className='grid grid-cols-3 gap-3'>
								<div className='p-3 bg-[#15191E] border border-[#242930]'>
									<span className='text-[#858C95] block text-[10px] uppercase'>SERVICE</span>
									<span className='text-white font-bold text-sm block mt-0.5'>storefront</span>
								</div>
								<div className='p-3 bg-[#15191E] border border-[#242930]'>
									<span className='text-[#858C95] block text-[10px] uppercase'>ENVIRONMENT</span>
									<span className='text-white font-bold text-sm block mt-0.5'>production</span>
								</div>
								<div className='p-3 bg-[#15191E] border border-[#242930]'>
									<span className='text-[#858C95] block text-[10px] uppercase'>RELEASE</span>
									<span className='text-white font-bold text-sm block mt-0.5'>v1.8.4</span>
								</div>
							</div>

							{/* Compact State Progression */}
							<div className='pt-1'>
								<AnimatePresence mode='wait'>
									{status === 'idle' && (
										<div className='p-3 bg-[#0D1014] border border-[#242930] flex items-center justify-between text-[11px] text-[#858C95]'>
											<span>Click [Deploy ↵] or press Enter to trigger execution</span>
											<span className='text-white font-semibold'>Zero-Downtime</span>
										</div>
									)}

									{status === 'executing' && (
										<motion.div
											key='executing'
											initial={{ opacity: 0, y: 3 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -3 }}
											className='p-3.5 bg-[#15191E] border border-amber-500/30 flex items-center justify-between'
										>
											<div className='flex items-center gap-2.5'>
												<span className='w-2 h-2 rounded-full bg-amber-400 animate-ping' />
												<span className='text-white font-medium text-xs'>
													Deploy accepted → Creating release container...
												</span>
											</div>
											<span className='text-[#858C95] text-[11px]'>1.4s</span>
										</motion.div>
									)}

									{status === 'deployed' && (
										<motion.div
											key='deployed'
											initial={{ opacity: 0, y: 3 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -3 }}
											className='p-3.5 bg-[#15191E] border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
										>
											<div className='space-y-1'>
												<div className='flex items-center gap-2'>
													<Check size={14} className='text-emerald-400' />
													<span className='text-white font-bold text-xs'>
														Deploy accepted → Release created → Health confirmed
													</span>
												</div>
												<div className='text-emerald-400 text-[11px] pl-5'>
													100% traffic shifted • Synthetic HTTP probe 200 OK
												</div>
											</div>
											<div className='flex items-center gap-2 self-start sm:self-auto'>
												<span className='text-[#858C95] text-[11px]'>latency 24ms</span>
												<span className='px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold'>
													LIVE
												</span>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
					</div>

					{/* Small Release Marker and Hairline Link to Next Section */}
					<div
						data-kr0n-command='CommandReleaseLink'
						className='flex flex-col items-center mt-6 space-y-2'
					>
						<div className='w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]' />
						<div className='w-px h-12 bg-gradient-to-b from-white via-white/20 to-transparent' />
					</div>
				</div>
			</div>
		</section>
	);
}
