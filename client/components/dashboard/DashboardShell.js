import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardShell({ children }) {
  return (
    <div className="flex h-svh max-h-svh min-h-0 overflow-hidden bg-[#0d0e0f] text-[#e3e2e2] antialiased">
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
