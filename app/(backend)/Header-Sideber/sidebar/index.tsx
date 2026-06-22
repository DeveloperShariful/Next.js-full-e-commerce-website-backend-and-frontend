// File: app/(backend)/admin/Header-Sideber/sidebar/index.tsx

"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      localStorage.setItem("admin-sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  const filteredMenu = sidebarConfig.map(group => ({
    ...group,
    items: group.items.filter(item =>
      !item.roles || (user.role && item.roles.includes(user.role as any))
    )
  })).filter(group => group.items.length > 0);

  return (
    <aside
      className="hidden md:flex flex-col h-[calc(100vh-46px)] sticky top-[46px] bg-[#1d2327] text-[#c3c4c7] z-40 relative transition-[width] duration-200"
      style={{ width: isCollapsed ? 46 : 224 }}
    >
      {/* Toggle button — TOP */}
      <button
        onClick={toggleCollapse}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center h-8 w-full border-b border-[#2c3338] text-[#8c8f94] hover:text-white hover:bg-[#2c3338] transition-colors shrink-0"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none space-y-1">
        {filteredMenu.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-2">
            {!isCollapsed && (
              <h3 className="px-4 py-2 text-[11px] font-semibold text-[#8c8f94] uppercase tracking-wider whitespace-nowrap">
                {group.title}
              </h3>
            )}
            {isCollapsed && groupIdx > 0 && (
              <div className="mx-2 my-2 border-t border-[#2c3338]" />
            )}
            <div className="space-y-0">
              {group.items.map((item) => (
                <SidebarItem key={item.href} item={item} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
