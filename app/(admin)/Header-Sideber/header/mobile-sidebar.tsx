// File: app/(admin)/admin/Header-Sideber/header/mobile-sidebar.tsx

"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
// 🚀 Correct Import Path based on your image
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
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-slate-100 transition text-slate-600"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-full w-72 bg-[#1e293b] z-50 shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="absolute right-4 top-4 z-50">
           <button 
             onClick={() => setIsOpen(false)} 
             className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
           >
             <X size={20} />
           </button>
        </div>

        <div className="h-full sidebar-mobile-override">
            <AdminSidebar user={user} /> 
        </div>
      </div>

      <style jsx global>{`
        .sidebar-mobile-override aside {
          display: flex !important;
          width: 100% !important;
          border-right: none !important;
        }
      `}</style>
    </>
  );
}