// File: app/(admin)/admin/Header-Sideber/header/mobile-sidebar.tsx

"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import AdminSidebar from "../sidebar"; 

interface MobileSidebarProps {
  user: any;
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <>
      {/* 🚀 WP Style: Hamburger Menu in Admin Bar */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden h-full px-2 flex items-center justify-center hover:bg-[#2c3338] transition-colors text-[#c3c4c7] focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🚀 WP Style: Mobile Drawer */}
      <div className={`
        fixed top-0 left-0 h-full w-[240px] bg-[#1d2327] z-[60] shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Close Button */}
        <div className="absolute right-3 top-3 z-[70]">
           <button 
             onClick={() => setIsOpen(false)} 
             className="text-[#a7aaad] hover:text-white p-1 rounded-sm hover:bg-[#2c3338] transition focus:outline-none"
           >
             <X size={20} />
           </button>
        </div>

        {/* Sidebar Content */}
        <div className="h-full sidebar-mobile-override overflow-hidden">
            <AdminSidebar user={user} /> 
        </div>
      </div>

      <style jsx global>{`
        .sidebar-mobile-override aside {
          display: flex !important;
          width: 100% !important;
          border-right: none !important;
          height: 100vh !important;
          top: 0 !important;
        }
      `}</style>
    </>
  );
}