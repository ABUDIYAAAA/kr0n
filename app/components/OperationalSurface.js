'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Check, Radio, Activity } from 'lucide-react';

const RELEASES = [
	{
		version: 'v1.8.4',
		status: 'LIVE',
		branch: 'main',
		commit: 'a83f2c1',
		message: 'feat(cart): instant optimistic checkout updates',
		time: '2m ago',
		duration: '31.9s',
		isLive: true,
	},
	{
		version: 'v1.8.3',
		status: 'ROLLED BACK',
		branch: 'main',
		commit: '19fe102',
		message: 'fix(session): token expiration in middleware',
		time: '18m ago',
		duration: '29.4s',
		isLive: false,
	},
	{
		version: 'v1.8.2',
		status: 'SUPERSEDED',
		branch: 'feat/search',
		commit: 'c41d8e0',
		message: 'perf(catalog): batch query filters for search indexing',
		time: '42m ago',
		duration: '35.1s',
		isLive: false,
	},
];

export default function OperationalSurface() {
	const [selectedVersion, setSelectedVersion] = useState('v1.8.4');
	const [pulseTick, setPulseTick] = useState(24);

	// Subtle live latency jitter to make telemetry feel alive
	useEffect(() => {
		const interval = setInterval(() => {
			setPulseTick((prev) => 22 + Math.floor(Math.random() * 5));
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section
			id='releases'
			className='relative py-20 sm:py-28 px-6 sm:px-12 bg-[#090B0E] border-b border-[#242930] overflow-hidden'
			data-kr0n-motion='OperationalScene'
		>
			<div className='max-w-7xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#242930]'>
					<div className='space-y-3 max-w-2xl'>
						<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#858C95]'>
							<span className='w-1.5 h-1.5 bg-white' />
							<span>PRODUCT SURFACE // 06</span>
							<span className='text-[#363D47] select-none'>|</span>
							<span className='text-white font-semibold'>CALM OPERATIONAL VISIBILITY</span>
						</div>

						<h2 className='text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F3F4F6] leading-[1.04]'>
							Calm operational <br />
							<span className='text-[#6C7480] font-extrabold'>visibility.</span>
						</h2>
					</div>

					<div className='text-xs font-mono text-[#858C95] text-left sm:text-right space-y-1'>
						<div>IMMUTABLE RELEASE AUDIT</div>
						<div className='text-white font-bold'>INSTANT ROLLBACK ARMED</div>
					</div>
				</div>

				{/* Cinematic Operational Surface */}
				<div
					data-kr0n-motion='OperationalSurface'
					className='bg-[#0D1014] border border-[#242930] p-6 sm:p-8 space-y-8 shadow-2xl'
				>
					{/* Top System Context Bar */}
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242930]'>
						<div className='space-y-1'>
							<div className='text-xl sm:text-2xl font-black font-mono uppercase text-white tracking-tight flex items-center gap-3'>
								<span>storefront</span>
								<span className='text-xs px-2 py-0.5 border border-[#363D47] bg-[#15191E] font-normal text-[#C4C8CE]'>
									production
								</span>
							</div>
							<div className='text-xs font-mono text-[#858C95]'>
								CANARY CUTOVER MESH ACTIVE // AUTOMATED ROLLBACK POINT PRESERVED
							</div>
						</div>

						<div
							data-kr0n-live='LiveIndicator'
							className='inline-flex items-center gap-2.5 border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-mono text-emerald-400 self-start sm:self-auto'
						>
							<span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
							<span className='font-bold tracking-wider'>● LIVE // 100% TRAFFIC</span>
						</div>
					</div>

					{/* Restrained Release Rows */}
					<div
						data-kr0n-motion='ReleaseRows'
						className='divide-y divide-[#242930] font-mono text-xs sm:text-sm overflow-x-auto'
					>
						{RELEASES.map((row) => {
							const isSelected = selectedVersion === row.version;
							return (
								<div
									key={row.version}
									onClick={() => setSelectedVersion(row.version)}
									className={`py-4 px-3 sm:px-4 flex items-center justify-between gap-6 cursor-pointer transition-colors min-w-[620px] ${
										isSelected
											? 'bg-[#15191E] text-white'
											: 'hover:bg-white/[0.03] text-[#C4C8CE]'
									}`}
								>
									{/* Version & Commit */}
									<div className='flex items-center gap-4 w-44 shrink-0'>
										<span className='font-bold text-white'>{row.version}</span>
										<span className='text-[#4E5560]'>/</span>
										<span className='text-[#858C95] text-xs'>{row.commit}</span>
									</div>

									{/* Status Indicator */}
									<div className='w-32 shrink-0 flex items-center gap-2'>
										<span
											className={`w-2 h-2 rounded-full ${
												row.status === 'LIVE'
													? 'bg-emerald-400 animate-pulse'
													: row.status === 'ROLLED BACK'
													? 'bg-amber-400'
													: 'bg-white/20'
											}`}
										/>
										<span
											className={`text-xs font-bold tracking-wider ${
												row.status === 'LIVE'
													? 'text-emerald-400'
													: row.status === 'ROLLED BACK'
													? 'text-amber-400'
													: 'text-[#858C95]'
											}`}
										>
											{row.status}
										</span>
									</div>

									{/* Commit Message */}
									<div className='flex-1 truncate text-xs font-sans text-[#C4C8CE] font-normal'>
										{row.message}
									</div>

									{/* Timestamp */}
									<div className='w-24 shrink-0 text-right text-xs text-[#858C95]'>
										{row.time}
									</div>
								</div>
							);
						})}
					</div>

					{/* Living Telemetry & Signal Wave Bar */}
					<div
						data-kr0n-motion='MetricCluster'
						className='pt-6 border-t border-[#242930] grid grid-cols-1 md:grid-cols-12 gap-6 items-center font-mono'
					>
						{/* Real-time Telemetry Metrics (col-span-8) */}
						<div className='md:col-span-8 grid grid-cols-3 gap-4'>
							<div className='p-3 bg-[#111419] border border-[#242930] space-y-1'>
								<div className='text-[10px] text-[#858C95] uppercase'>EDGE LATENCY (p99)</div>
								<div className='text-xl sm:text-2xl font-bold text-white flex items-center gap-2'>
									<span>{pulseTick}ms</span>
									<span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping' />
								</div>
								<div className='text-[10px] text-emerald-400'>Synthetic probe OK</div>
							</div>

							<div className='p-3 bg-[#111419] border border-[#242930] space-y-1'>
								<div className='text-[10px] text-[#858C95] uppercase'>SYSTEM HEALTH</div>
								<div className='text-xl sm:text-2xl font-bold text-white'>NOMINAL</div>
								<div className='text-[10px] text-[#858C95]'>0 errors detected</div>
							</div>

							<div className='p-3 bg-[#111419] border border-[#242930] space-y-1'>
								<div className='text-[10px] text-[#858C95] uppercase'>RESTORE SPEED</div>
								<div className='text-xl sm:text-2xl font-bold text-white'>&lt;1s</div>
								<div className='text-[10px] text-[#858C95]'>Instant state revert</div>
							</div>
						</div>

						{/* Real-time Sparkline Graph (col-span-4) */}
						<div className='md:col-span-4 p-3 bg-[#111419] border border-[#242930] space-y-2'>
							<div className='flex items-center justify-between text-[10px] text-[#858C95]'>
								<span>SIGNAL TIMELINE</span>
								<span className='text-emerald-400'>ACTIVE</span>
							</div>

							{/* SVG Live Latency Curve */}
							<div className='h-10 w-full overflow-hidden flex items-end'>
								<svg viewBox='0 0 100 30' className='w-full h-full stroke-emerald-400 fill-none' preserveAspectRatio='none'>
									<path
										d='M0,20 Q15,10 30,18 T60,12 T85,22 T100,15'
										strokeWidth='1.5'
										strokeLinecap='round'
									/>
								</svg>
							</div>

							<div className='text-[10px] text-[#858C95] text-right'>
								ILLUSTRATIVE TELEMETRY STREAM
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
