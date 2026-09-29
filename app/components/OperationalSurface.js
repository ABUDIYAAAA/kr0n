'use client';

import { useState } from 'react';
import { RotateCcw, Check, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

const AUDIT_ROWS = [
	{
		version: 'v1.8.4',
		branch: 'main',
		commit: 'a83f2c1',
		message: 'feat(cart): implement instant optimistic checkout updates',
		status: 'LIVE',
		time: '2m ago',
		duration: '31.9s',
		author: 'gurmehar',
		isLive: true,
	},
	{
		version: 'v1.8.3',
		branch: 'main',
		commit: '19fe102',
		message: 'fix(session): resolve intermittent token expiration in middleware',
		status: 'ROLLED BACK',
		time: '18m ago',
		duration: '29.4s',
		author: 'ci-bot',
		isLive: false,
	},
	{
		version: 'v1.8.2',
		branch: 'feat/search',
		commit: 'c41d8e0',
		message: 'perf(catalog): batch elasticsearch queries for product filters',
		status: 'SUPERSEDED',
		time: '42m ago',
		duration: '35.1s',
		author: 'alex',
		isLive: false,
	},
	{
		version: 'v1.8.1',
		branch: 'fix/auth',
		commit: '99b21a0',
		message: 'refactor(auth): migrate to Web Crypto API for zero-dep tokens',
		status: 'SUPERSEDED',
		time: '2h ago',
		duration: '28.0s',
		author: 'gurmehar',
		isLive: false,
	},
];

export default function OperationalSurface() {
	const [selected, setSelected] = useState(AUDIT_ROWS[0]);

	return (
		<section
			id='releases'
			className='relative py-28 px-6 sm:px-12 max-w-7xl mx-auto border-x border-white/5 bg-[#050607]'
		>
			<div className='max-w-5xl mx-auto space-y-12'>
				{/* Section Header */}
				<div className='max-w-2xl space-y-3'>
					<div className='inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50'>
						<span className='w-1.5 h-1.5 bg-white' />
						<span>CALM OPERATIONAL VISIBILITY</span>
					</div>
					<h2 className='text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight'>
						Immutable release history. <br />
						<span className='text-white/50'>Auditable and instantly reversible.</span>
					</h2>
					<p className='text-sm sm:text-base text-zinc-400 font-sans leading-relaxed'>
						Every release creates a versioned snapshot. If an unexpected runtime error
						occurs, revert to any previous state in under one second without rebuilding.
					</p>
				</div>

				{/* High-Density Linear-Style Audit Surface */}
				<div className='border border-white/15 bg-[#0d0e11] shadow-2xl overflow-hidden'>
					{/* Table Controls Strip */}
					<div className='px-5 py-3.5 bg-[#111215] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-white/50'>
						<div className='flex items-center gap-3'>
							<span className='w-2 h-2 rounded-full bg-emerald-400' />
							<span className='text-white font-bold'>storefront / production</span>
							<span className='text-white/20'>{'//'}</span>
							<span>4 releases preserved</span>
						</div>
						<div className='flex items-center gap-4 text-[11px]'>
							<span>Instant rollback armed</span>
							<span>•</span>
							<span>Traffic: Zero packet drop</span>
						</div>
					</div>

					{/* Dense Rows */}
					<div className='divide-y divide-white/5 overflow-x-auto'>
						{AUDIT_ROWS.map((row) => {
							const isSelected = selected.version === row.version;
							return (
								<div
									key={row.version}
									onClick={() => setSelected(row)}
									className={`px-5 sm:px-6 py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors text-xs font-mono min-w-[620px] ${
										isSelected
											? 'bg-[#16171b] text-white'
											: 'hover:bg-white/[0.03] text-white/60'
									}`}
								>
									{/* Version & Commit */}
									<div className='flex items-center gap-4 w-64 shrink-0'>
										<span
											className={`font-bold ${
												row.isLive ? 'text-white' : 'text-white/70'
											}`}
										>
											{row.version}
										</span>
										<div className='flex items-center gap-1.5 text-white/40'>
											<span>{row.branch}</span>
											<span>/</span>
											<span className='text-white/70'>{row.commit}</span>
										</div>
									</div>

									{/* Commit Message */}
									<div className='truncate flex-1 font-sans text-xs text-white/60 font-normal'>
										{row.message}
									</div>

									{/* Status Pill */}
									<div className='w-32 shrink-0 flex items-center gap-2'>
										<span
											className={`w-1.5 h-1.5 rounded-full ${
												row.status === 'LIVE'
													? 'bg-emerald-400'
													: row.status === 'ROLLED BACK'
													? 'bg-amber-400'
													: 'bg-white/20'
											}`}
										/>
										<span
											className={`text-[11px] font-bold tracking-wider ${
												row.status === 'LIVE'
													? 'text-emerald-400'
													: row.status === 'ROLLED BACK'
													? 'text-amber-400'
													: 'text-white/40'
											}`}
										>
											{row.status}
										</span>
									</div>

									{/* Duration & Age */}
									<div className='w-28 shrink-0 text-right text-white/40 text-[11px]'>
										<span>{row.time}</span>
									</div>
								</div>
							);
						})}
					</div>

					{/* Selected Row Drawer */}
					<div className='p-5 bg-[#090a0c] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono'>
						<div className='space-y-1'>
							<div className='flex items-center gap-2 text-white font-bold'>
								<span>{selected.version}</span>
								<span className='text-white/30'>•</span>
								<span className='text-white/80 font-normal font-sans'>
									{selected.message}
								</span>
							</div>
							<div className='text-[11px] text-white/40'>
								Author: {selected.author} • Compiled in {selected.duration} • Status:{' '}
								{selected.status}
							</div>
						</div>

						<div className='shrink-0'>
							{selected.isLive ? (
								<span className='border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-[11px] font-mono'>
									Currently Serving 100% Traffic
								</span>
							) : (
								<button
									type='button'
									onClick={() => alert(`Simulated rollback to ${selected.version}`)}
									className='flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-white text-[11px] font-mono transition-colors'
								>
									<RotateCcw size={12} />
									<span>Rollback to {selected.version}</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
