'use client';

import { useState, useEffect } from 'react';
import SiteHeader from './components/SiteHeader';
import HeroSection from './components/HeroSection';
import ManifestoScene from './components/ManifestoScene';
import OperationalSurface from './components/OperationalSurface';
import FinalCTA from './components/FinalCTA';
import SiteFooter from './components/SiteFooter';
import CommandLayer from './components/CommandLayer';

export default function HomePage() {
	const [commandOpen, setCommandOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setCommandOpen((prev) => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<div className='min-h-screen bg-[#090B0E] text-[#F3F4F6] flex flex-col font-sans selection:bg-white/20 selection:text-white'>
			{/* Command Layer Modal (Triggered by ⌘K or buttons) */}
			<CommandLayer
				isOpen={commandOpen}
				onClose={() => setCommandOpen(false)}
			/>

			{/* Sparse, Low-profile Site Header */}
			<SiteHeader onOpenCommand={() => setCommandOpen(true)} />

			<main className='flex-1'>
				{/* Section 00: Hero — Editorial Message + Embedded KR0N Technical Visual */}
				<HeroSection onOpenCommand={() => setCommandOpen(true)} />

				{/* Section 01: Manifesto / Typographic Interruption (Principle 1) */}
				<ManifestoScene />

				{/* Section 02: The Quiet Operating State (Floating Operational Surface) */}
				<OperationalSurface />

				{/* Section 03: Final CTA / Cinematic Ending */}
				<FinalCTA onOpenCommand={() => setCommandOpen(true)} />
			</main>

			{/* Minimal Site Footer */}
			<SiteFooter onOpenCommand={() => setCommandOpen(true)} />
		</div>
	);
}
