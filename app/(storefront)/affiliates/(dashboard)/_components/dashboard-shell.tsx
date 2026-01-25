//app/(storefront)/affiliates/(dashboard)/_components/dashboard-shell.tsx

"use client";

import { useState } from "react";
import AffiliateSidebar from "./affiliate-sidebar";
import { Menu } from "lucide-react";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar Component handles both Mobile & Desktop */}
      <AffiliateSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 min-w-0 transition-all duration-300 flex flex-col">
        {/* Mobile Header Trigger */}
        <div className="lg:hidden bg-white border-b p-4 flex items-center gap-3 sticky top-16 z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-900">Dashboard</span>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}