"use client";

import Sidebar from "../../sidebar/page";

export default function SettingsDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#0d0e0f] text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold uppercase">Settings Dashboard</h1>
        <p className="mt-4 text-white/50">
          Settings dashboard content goes here.
        </p>
      </main>
    </div>
  );
}
