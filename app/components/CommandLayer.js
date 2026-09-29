'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const COMMANDS = [
	{
		id: 'deploy-prod',
		category: 'Action',
		label: 'Deploy storefront to production',
		detail: 'Trigger immutable release pipeline',
		badge: 'Deploy',
		action: (router) => {
			const el = document.getElementById('command-flow');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		},
	},
	{
		id: 'view-rail',
		category: 'Navigation',
		label: 'Inspect release timeline rail',
		detail: 'Review CODE → BUILD → VERIFY → RELEASE → LIVE journey',
		badge: 'Timeline',
		action: (router) => {
			const el = document.getElementById('rail');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		},
	},
	{
		id: 'view-audit',
		category: 'Navigation',
		label: 'Release audit history',
		detail: 'Auditable releases and instant rollback controls',
		badge: 'Releases',
		action: (router) => {
			const el = document.getElementById('releases');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		},
	},
	{
		id: 'docs-quickstart',
		category: 'Documentation',
		label: 'Read Quick Start guide',
		detail: 'Deploy your first service in under 2 minutes',
		badge: 'Guide',
		action: (router) => {
			router.push('/docs/quick-start');
		},
	},
	{
		id: 'docs-templates',
		category: 'Documentation',
		label: 'Browse framework templates',
		detail: 'Next.js, Go, Python, and Rust starters',
		badge: 'Templates',
		action: (router) => {
			router.push('/docs/templates');
		},
	},
	{
		id: 'docs-cli',
		category: 'Documentation',
		label: 'KR0N CLI manual',
		detail: 'Command-line deployment and secret management',
		badge: 'CLI',
		action: (router) => {
			router.push('/docs/cli');
		},
	},
	{
		id: 'rollback',
		category: 'Action',
		label: 'Rollback to release v1.8.3',
		detail: 'Instant zero-downtime traffic cutover (<1s)',
		badge: 'Rollback',
		action: (router) => {
			const el = document.getElementById('releases');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		},
	},
];

export default function CommandLayer({ isOpen, onClose }) {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef(null);

	const filteredCommands = COMMANDS.filter(
		(cmd) =>
			cmd.label.toLowerCase().includes(query.toLowerCase()) ||
			cmd.detail.toLowerCase().includes(query.toLowerCase()) ||
			cmd.category.toLowerCase().includes(query.toLowerCase())
	);

	const clampedIndex =
		selectedIndex >= filteredCommands.length ? 0 : selectedIndex;

	const handleClose = useCallback(() => {
		setQuery('');
		setSelectedIndex(0);
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!isOpen) return;

			if (e.key === 'Escape') {
				e.preventDefault();
				handleClose();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : 0
				);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCommands.length - 1
				);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const selected = filteredCommands[clampedIndex];
				if (selected) {
					if (selected.action) selected.action(router);
					handleClose();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, clampedIndex, filteredCommands, handleClose, router]);

	if (!isOpen) return null;

	return (
		<div
			className='fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 sm:px-6 bg-black/80 backdrop-blur-md transition-opacity'
			role='dialog'
			aria-modal='true'
			aria-label='Command palette'
			onClick={handleClose}
		>
			<div
				className='w-full max-w-2xl border border-white/20 bg-[#0d0e11] shadow-2xl overflow-hidden'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Search input header */}
				<div className='flex items-center px-5 sm:px-6 py-4 border-b border-white/10 bg-[#090a0c] gap-3'>
					<span className='text-white/60 font-mono text-sm'>&gt;</span>
					<input
						ref={inputRef}
						type='text'
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
						placeholder='Type a command, documentation guide, or action...'
						className='w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-base outline-none font-sans'
					/>

					{/* Interactive Esc / Close Button */}
					<button
						type='button'
						onClick={handleClose}
						className='group flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 rounded-none transition-all shrink-0 focus:outline-none'
						title='Close command palette (Escape)'
						aria-label='Close command palette'
					>
						<span className='text-[10px] font-mono uppercase tracking-wider text-white/70 group-hover:text-white'>
							ESC
						</span>
						<span className='text-white/40 group-hover:text-white'>×</span>
					</button>
				</div>

				{/* Results list */}
				<div
					className='max-h-96 overflow-y-auto p-3 sm:p-4 space-y-1.5 bg-[#0d0e11]'
					role='listbox'
				>
					{filteredCommands.length === 0 ? (
						<div className='py-12 text-center text-xs sm:text-sm text-white/40 font-mono'>
							No matching actions or guides found.
						</div>
					) : (
						filteredCommands.map((cmd, idx) => {
							const isSelected = idx === clampedIndex;
							return (
								<button
									key={cmd.id}
									type='button'
									role='option'
									aria-selected={isSelected}
									onClick={() => {
										if (cmd.action) cmd.action(router);
										handleClose();
									}}
									onMouseEnter={() => setSelectedIndex(idx)}
									className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between border ${
										isSelected
											? 'bg-[#16171b] border-white/20 text-white shadow-sm'
											: 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]'
									}`}
								>
									<div className='flex items-center gap-3.5 min-w-0'>
										<span
											className={`w-1.5 h-1.5 rounded-full shrink-0 ${
												isSelected ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-white/20'
											}`}
										/>
										<div className='min-w-0'>
											<div className='text-xs sm:text-sm font-medium text-white truncate'>
												{cmd.label}
											</div>
											<div className='text-[11px] sm:text-xs text-white/40 truncate mt-0.5 font-mono'>
												{cmd.detail}
											</div>
										</div>
									</div>
									<span className='font-mono text-[10px] sm:text-[11px] px-2.5 py-0.5 border border-white/10 bg-white/5 text-white/50 shrink-0 ml-3'>
										{cmd.badge}
									</span>
								</button>
							);
						})
					)}
				</div>

				{/* Footer helper */}
				<div className='px-5 sm:px-6 py-3 bg-[#090a0c] border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-mono'>
					<div className='flex items-center gap-4'>
						<span className='flex items-center gap-1.5'>
							<kbd className='px-1.5 py-0.5 bg-white/5 border border-white/10 text-[10px] text-white/60'>
								↑↓
							</kbd>
							Navigate
						</span>
						<span className='flex items-center gap-1.5'>
							<kbd className='px-1.5 py-0.5 bg-white/5 border border-white/10 text-[10px] text-white/60'>
								↵
							</kbd>
							Execute
						</span>
					</div>
					<span className='hidden sm:inline text-white/40'>
						KR0N WORKSPACE CONTROL
					</span>
				</div>
			</div>
		</div>
	);
}
