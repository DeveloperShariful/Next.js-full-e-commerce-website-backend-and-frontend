// components/admin/sidebar/index.tsx

"use client";

import Link from "next/link";
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
    <aside className="
      hidden md:flex flex-col w-64 
      h-[100dvh] sticky top-0  // [UPDATED] h-screen -> h-[100dvh]
      bg-[#1e293b] text-slate-300 border-r border-slate-800 
      transition-all duration-300 shadow-2xl z-40
    ">
        
        {/* 1. Header / Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-[#0f172a] shrink-0">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-white text-xl tracking-wide group">
            <div className="
              w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm text-white shadow-blue-900/20 shadow-lg
              transition-transform duration-300 group-hover:rotate-12
            ">
              GB
            </div>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              GoBike
            </span>
          </Link>
        </div>
        
        {/* 2. Scrollable Navigation Menu */}
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

        {/* 3. User Profile Footer */}
        {/* [UPDATED] Added padding-bottom to lift it up on mobile */}
        <div className="pb-4 md:pb-0 bg-[#0f172a]"> 
           <UserNav user={user} />
        </div>
      </aside>
  );
}