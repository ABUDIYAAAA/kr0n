'use client';

import { useState, useEffect } from 'react';
import SiteHeader from './components/SiteHeader';
import HeroSection from './components/HeroSection';
import ReleaseRailSection from './components/ReleaseRailSection';
import CommandFlow from './components/CommandFlow';
import CodeToRelease from './components/CodeToRelease';
import CapabilityStory from './components/CapabilityStory';
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
		<div className='min-h-screen bg-[#090a0c] text-white flex flex-col font-sans selection:bg-white/20 selection:text-white'>
			{/* Command Layer Modal */}
			<CommandLayer
				isOpen={commandOpen}
				onClose={() => setCommandOpen(false)}
			/>

			{/* Low-profile Site Header */}
			<SiteHeader onOpenCommand={() => setCommandOpen(true)} />

			<main className='flex-1'>
				{/* Section 01: Hero */}
				<HeroSection onOpenCommand={() => setCommandOpen(true)} />

				{/* Section 02: Release Rail Storytelling Journey */}
				<ReleaseRailSection />

				{/* Section 04: Raycast-Inspired Command Flow */}
				<CommandFlow />

				{/* Section 05: Resend-Inspired Code -> Release Surface */}
				<CodeToRelease />

				{/* Section 06: What KR0N Takes Care Of (4 Operational Pillars) */}
				<CapabilityStory />

				{/* Section 07: Calm Operation / Release Audit Trail */}
				<OperationalSurface />

				{/* Section 08: Final Statement & CTA */}
				<FinalCTA onOpenCommand={() => setCommandOpen(true)} />
			</main>

			{/* Site Footer */}
			<SiteFooter onOpenCommand={() => setCommandOpen(true)} />
		</div>
	);
}
