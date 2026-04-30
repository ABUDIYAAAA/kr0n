"use client";

import Sidebar from "../sidebar/page";

export default function LogsPage() {
	return (
		<div className="flex min-h-screen bg-[#0d0e0f] text-white">
			<Sidebar />

			<main className="flex-1 p-8">
				<h1 className="text-2xl font-bold uppercase">Logs</h1>
				<p className="mt-4 text-white/50">Log viewer content goes here.</p>
			</main>
		</div>
	);
}
