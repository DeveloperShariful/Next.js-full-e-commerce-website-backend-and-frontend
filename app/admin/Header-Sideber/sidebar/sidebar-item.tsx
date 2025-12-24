"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItem as SidebarItemType } from "./menu-config";
import { cn } from "@/lib/utils"; // যদি আপনার cn ফাংশন না থাকে, তবে সাধারণ টেম্পলেট লিটারাল ব্যবহার করা যাবে

interface SidebarItemProps {
  item: SidebarItemType;
}

export function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  
  // Active Check Logic (Improved)
  const isActive = 
    pathname === item.href || 
    (item.href !== "/admin" && pathname.startsWith(item.href));

  return (
    <Link 
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
        isActive 
          ? "bg-blue-600 text-white shadow-md" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <item.icon 
        size={18} 
        strokeWidth={isActive ? 2.5 : 2} 
        className={cn("transition-transform group-hover:scale-105", isActive && "animate-pulse-once")}
      />
      <span>{item.name}</span>
    </Link>
  );
}