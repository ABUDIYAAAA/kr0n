'use client';

import { useState, useEffect } from 'react';
import SiteHeader from './components/SiteHeader';
import HeroSection from './components/HeroSection';
import ManifestoScene from './components/ManifestoScene';
import ReleaseRailSection from './components/ReleaseRailSection';
import CodeToRelease from './components/CodeToRelease';
import CapabilityTypographyScene from './components/CapabilityTypographyScene';
import OperationalSurface from './components/OperationalSurface';
import BrandMarkScene from './components/BrandMarkScene';
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
				{/* Section 00: Hero — Editorial + Technical Intro */}
				<HeroSection onOpenCommand={() => setCommandOpen(true)} />

				{/* Section 01: KR0N Brand / Logo Animation Stage */}
				<BrandMarkScene />

				{/* Section 02: Manifesto / Typographic Interruption (Principle 1) */}
				<ManifestoScene />

				{/* Section 03: The Release Rail (Railway-inspired Graphic Instrument with live iteration) */}
				<ReleaseRailSection />

				{/* Section 04: Code into Motion (Resend-inspired Editorial Code) */}
				<CodeToRelease />

				{/* Section 05: KR0N Takes the Weight (Asymmetric Typographic Highway) */}
				<CapabilityTypographyScene />

				{/* Section 06: The Quiet Operating State (Floating Operational Surface) */}
				<OperationalSurface />

				{/* Section 07: Final CTA / Cinematic Ending */}
				<FinalCTA onOpenCommand={() => setCommandOpen(true)} />
			</main>

			{/* Minimal Site Footer */}
			<SiteFooter onOpenCommand={() => setCommandOpen(true)} />
		</div>
	);
}
