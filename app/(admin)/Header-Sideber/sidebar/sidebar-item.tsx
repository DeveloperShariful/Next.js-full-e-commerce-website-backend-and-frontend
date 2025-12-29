// File: app/(admin)/admin/Header-Sideber/sidebar/sidebar-item.tsx

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

  return (
    <div className="select-none"> {/* Prevent text selection on double click */}
      
      {/* Main Item */}
      <Link 
        href={hasSubmenu ? "#" : item.href} // If submenu, href is dummy, handled by click
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group cursor-pointer",
          isMainActive || (hasSubmenu && isOpen) // Highlight if active or open
            ? "bg-blue-600 text-white shadow-md" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
           {item.icon && (
             <item.icon 
               size={18} 
               strokeWidth={(isMainActive || isOpen) ? 2.5 : 2} 
               className={cn("transition-transform group-hover:scale-105")}
             />
           )}
           <span>{item.name}</span>
        </div>

        {/* Arrow Icon for Submenu */}
        {hasSubmenu && (
           <div className="text-white/70">
              {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
           </div>
        )}
      </Link>

      {/* Submenu Items */}
      {hasSubmenu && isOpen && (
        <div className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1 animate-in slide-in-from-left-2 fade-in duration-200">
           {item.submenu!.map((sub) => {
             const isSubActive = pathname === sub.href;
             return (
               <Link 
                 key={sub.href}
                 href={sub.href}
                 className={cn(
                   "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                   isSubActive 
                     ? "text-blue-400 bg-blue-400/10" 
                     : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 <Dot size={18} className={cn(isSubActive ? "opacity-100" : "opacity-0")} />
                 {sub.name}
               </Link>
             )
           })}
        </div>
      )}
    </div>
  );
}