"use client";

import Sidebar from "../page";

export default function DeploymentsPage() {
	return (
		<div className="flex bg-[#0d0e0f] text-white min-h-screen">
			<Sidebar />

			<main className="flex-1 p-8">
				<h1 className="text-2xl font-bold uppercase">Deployments</h1>
				<p className="mt-4 text-white/50">Deployment page content goes here.</p>
			</main>
		</div>
	);
}
