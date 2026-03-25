import { Sidebar } from "@/components/dashboard/Sidebar";
import { AIChatPanel } from "@/components/dashboard/AIChatPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Main content area — offset dynamically for sidebar width */}
      <div className="pb-20 lg:pb-0 transition-all duration-300 lg:pl-64 [html.sidebar-collapsed_&]:lg:pl-[80px]">
        {children}
      </div>
      <AIChatPanel />
    </div>
  );
}