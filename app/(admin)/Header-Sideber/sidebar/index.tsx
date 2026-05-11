// File: app/(admin)/admin/Header-Sideber/sidebar/index.tsx

"use client";

// 🚀 Imports from same directory
import { sidebarConfig } from "./menu-config";
import { SidebarItem } from "./sidebar-item";

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
    <aside className="hidden md:flex flex-col w-56 h-[calc(100vh-46px)] sticky top-[46px] bg-[#1d2327] text-[#c3c4c7] transition-all duration-300 z-40 relative">
        
        {/* 🚀 Navigation items start directly from the top (like WP) */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-none space-y-1">
          {filteredMenu.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-2">
              <h3 className="px-4 py-2 text-[11px] font-semibold text-[#8c8f94] uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0">
                {group.items.map((item) => (
                  <SidebarItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

      </aside>
  );
}