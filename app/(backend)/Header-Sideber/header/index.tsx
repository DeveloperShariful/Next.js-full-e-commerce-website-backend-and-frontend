// File: app/(backend)/admin/Header-Sideber/header/index.tsx

"use client";

import Link from "next/link";
import { Home, ExternalLink, LayoutDashboard } from "lucide-react"; // 🚀 Home আইকন ইম্পোর্ট করা হলো
import { Search } from "./search";
import { Notifications } from "./notification";
import { MobileSidebar } from "./mobile-sidebar";
import { UserNav } from "../sidebar/user-nav"; 

interface AdminHeaderProps {
  user: any;
  storeName?: string; // 🚀 নতুন প্রপস রিসিভ করা হলো
}

export default function AdminHeader({ user, storeName = "Store" }: AdminHeaderProps) {

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1d2327] text-[#c3c4c7] h-[46px] flex items-center justify-between px-3 sm:px-4 shrink-0">
      
      <div className="flex items-center gap-0 h-full">
        <MobileSidebar user={user} />
        
        {/* 🚀 WP Style Site Title & Dropdown */}
        <div className="relative group h-full flex items-center ml-1 sm:ml-2">
          <Link href="/" className="flex items-center gap-2 h-full px-3 hover:bg-[#2c3338] hover:text-[#72aee6] transition-colors cursor-pointer text-white">
            <Home size={16} />
            <span className="text-[13px] font-medium hidden sm:block">{storeName}</span>
          </Link>

          {/* 🚀 DROPDOWN MENU (Visit Site / Dashboard) */}
          <div className="absolute top-[46px] left-0 w-48 bg-[#1d2327] border-t border-[#2c3338] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col">
            <Link href="/" target="_blank" className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] transition-colors">
              <ExternalLink size={14} />
              Visit Site
            </Link>
            <Link href="/admin" className="flex items-center gap-2 px-4 py-3 text-[13px] text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] transition-colors">
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Right Area: Search, Notifications, Profile */}
      <div className="flex items-center justify-end h-full">
        <div className="flex items-center h-full">
           <Search />
        </div>
        
        <div className="h-[20px] w-px bg-[#2c3338] mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-1 h-full">
            <Notifications />
            <UserNav />
        </div>
      </div>
    </header>
  );
}