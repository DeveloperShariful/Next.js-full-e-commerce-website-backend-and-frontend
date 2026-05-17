// File: app/(backend)/admin/Header-Sideber/sidebar/sidebar-item.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarItem as SidebarItemType } from "./menu-config";
import { cn } from "@/lib/utils"; 
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Dot } from "lucide-react";

interface SidebarItemProps {
  item: SidebarItemType;
}

export function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Check if any child is active to auto-expand
  const isChildActive = item.submenu?.some(sub => pathname === sub.href);
  const isMainActive = pathname === item.href;

  const [isOpen, setIsOpen] = useState(isChildActive);

  // Auto expand if route changes and child is active
  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [pathname, isChildActive]);

  const hasSubmenu = item.submenu && item.submenu.length > 0;

  // 🚀 LOGIC: Single Click to Toggle, Double Click to Navigate
  const handleClick = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault(); // Prevent default link behavior if it's a parent
      setIsOpen(!isOpen); // Toggle Menu
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      router.push(item.href); // Navigate on Double Click
    }
  };

  // WP Active Logic
  const isParentActive = isMainActive || (hasSubmenu && isOpen);

  return (
    <div className="select-none"> {/* Prevent text selection on double click */}
      
      {/* Main Item */}
      <Link 
        href={hasSubmenu ? "#" : item.href} 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "flex items-center justify-between px-3 py-[8px] text-[13px] font-normal transition-colors group cursor-pointer relative",
          isParentActive
            ? "bg-[#2c3338] text-white" // WP Active State
            : "text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]" // WP Hover State
        )}
      >
        {/* 🚀 WP Blue left border indicator for active items */}
        {isParentActive && (
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2271b1]"></div>
        )}

        <div className="flex items-center gap-2">
           {item.icon && (
             <item.icon 
               size={16} 
               strokeWidth={1.5} 
               className={cn(
                 "transition-colors", 
                 isParentActive ? "text-[#72aee6]" : "text-[#a7aaad] group-hover:text-[#72aee6]"
               )}
             />
           )}
           <span>{item.name}</span>
        </div>

        {/* Arrow Icon for Submenu */}
        {hasSubmenu && (
           <div className="text-[#a7aaad]">
              {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
           </div>
        )}
      </Link>

      {/* Submenu Items */}
      {hasSubmenu && isOpen && (
        // 🚀 WP Style: Submenu bg is slightly darker
        <div className="bg-[#191e23] py-1 animate-in slide-in-from-top-1 fade-in duration-200">
           {item.submenu!.map((sub) => {
             const isSubActive = pathname === sub.href;
             return (
               <Link 
                 key={sub.href}
                 href={sub.href}
                 className={cn(
                   "flex items-center gap-2 pl-8 pr-3 py-1.5 text-[13px] font-normal transition-colors relative",
                   isSubActive 
                     ? "text-white font-medium" 
                     : "text-[#c3c4c7] hover:text-[#72aee6]"
                 )}
               >
                 {/* WP Minimal Indicator instead of big Dot */}
                 <span className={cn("w-1 h-1 rounded-full", isSubActive ? "bg-[#72aee6]" : "bg-transparent")}></span>
                 {sub.name}
               </Link>
             )
           })}
        </div>
      )}
    </div>
  );
}