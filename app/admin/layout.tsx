// app/admin/layout.tsx

import { auth } from "@/auth";
import AdminSidebar from "@/app/admin/admin/sidebar"; // New Component
import { 
  Search, Bell, Settings, Menu 
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user || { name: "Guest", email: "", role: "GUEST" };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR (Now handles Dynamic User) */}
      <AdminSidebar user={user} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-gray-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0 z-10">
           <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                 <Menu size={20} />
              </button>
              {/* Breadcrumb style text */}
              <h2 className="text-sm font-medium text-slate-500 hidden sm:block">
                 Welcome back, <span className="text-slate-800 font-bold">{user.name}</span>
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="pl-9 pr-4 py-2 w-64 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all outline-none"
                 />
              </div>

              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                 <Bell size={20} />
                 <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                 <Settings size={20} />
              </button>
           </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
           {children}
        </div>
      </main>
    </div>
  );
}