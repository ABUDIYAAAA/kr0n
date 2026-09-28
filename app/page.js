export default function HomePage() {
	return (
		<main className='flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0c10] text-slate-100 min-h-screen'>
			<div className='max-w-xl w-full text-center space-y-6'>
				<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium'>
					<span className='w-1.5 h-1.5 rounded-full bg-indigo-400'></span>
					Developer Workspace Theme
				</div>

				<h1 className='text-3xl font-bold tracking-tight text-white'>
					kr0n Developer Platform
				</h1>

				<p className='text-sm text-slate-400 leading-relaxed max-w-md mx-auto'>
					Self-owned application deployment and orchestration
					platform. Refer to{' '}
					<code className='px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs text-slate-200'>
						DESIGN.md
					</code>{' '}
					for visual guidelines, spacing, and component patterns.
				</p>
			</div>
		</main>
	);
}
