// File: app/(admin)/admin/Header-Sideber/sidebar/index.tsx

"use client";

import Link from "next/link";
import { ExternalLink, LayoutDashboard, ChevronDown } from "lucide-react"; // 🚀 নতুন আইকন ইম্পোর্ট করা হলো
// 🚀 Imports from same directory
import { sidebarConfig } from "./menu-config";
import { SidebarItem } from "./sidebar-item";
import { UserNav } from "./user-nav";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const filteredMenu = sidebarConfig.map(group => ({
    ...group,
    items: group.items.filter(item => 
      !item.roles || (user.role && item.roles.includes(user.role as any))
    )
  })).filter(group => group.items.length > 0); 

  return (
    <aside className="hidden md:flex flex-col w-64 h-[100dvh] sticky top-0 bg-[#1e293b] text-slate-300 border-r border-slate-800 transition-all duration-300 shadow-2xl z-40">
        
        {/* 🚀 LOGO & DROPDOWN SECTION */}
        <div className="relative group h-16 flex items-center px-6 border-b border-slate-700 bg-[#0f172a] shrink-0 cursor-pointer">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 font-bold text-white text-xl tracking-wide">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm text-white shadow-blue-900/20 shadow-lg transition-transform duration-300 group-hover:rotate-12">
                GB
              </div>
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">GoBike</span>
            </div>
            <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-transform duration-300 group-hover:rotate-180" />
          </div>

          {/* 🚀 DROPDOWN MENU */}
          <div className="absolute top-14 left-4 right-4 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden py-2 translate-y-2 group-hover:translate-y-0">
            <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-600/20 transition-colors">
              <ExternalLink size={16} className="text-blue-400" />
              Visit Site
            </Link>
            <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-600/20 transition-colors">
              <LayoutDashboard size={16} className="text-blue-400" />
              Admin Dashboard
            </Link>
          </div>
        </div>
        {/* 🚀 END LOGO & DROPDOWN SECTION */}

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {filteredMenu.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 opacity-80">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="pb-4 md:pb-0 bg-[#0f172a]"> 
           <UserNav />
        </div>
      </aside>
  );
}