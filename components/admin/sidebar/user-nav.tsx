// components/admin/sidebar/user-nav.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User, ChevronUp, Settings } from "lucide-react";
import { logout } from "@/app/actions/auth/logout";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  }
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = user.role?.replace(/_/g, " ") || "Staff";

  return (
    // [UPDATED] Added mb-safe class logic via style or tailwind padding
    <div className="p-4 border-t border-slate-700 bg-[#0f172a] relative pb-6 md:pb-4" ref={menuRef}>
      
      {/* Pop-up Menu */}
      <div className={`
        absolute bottom-full left-4 right-4 mb-2 
        bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50
        transition-all duration-200 origin-bottom
        ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"}
      `}>
        <div className="p-1 space-y-0.5">
          <div className="px-3 py-2 border-b border-slate-700 mb-1">
             <p className="text-xs font-medium text-slate-400">Signed in as</p>
             <p className="text-sm font-bold text-white truncate">{user.email}</p>
          </div>

          <Link 
            href="/admin/profile" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition"
          >
            <User size={16}/> Profile
          </Link>
          
          <Link 
            href="/admin/settings" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition"
          >
            <Settings size={16}/> Settings
          </Link>

          <button 
            onClick={async () => {
           await logout(); window.location.href = "/auth/login"; }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-md transition text-left"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full p-2 rounded-lg transition border border-transparent ${
          isOpen ? 'bg-slate-800 border-slate-600' : 'hover:bg-slate-800'
        }`}
      >
         <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border border-blue-400/30">
               {user.image ? (
                  <img src={user.image} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
               ) : (
                  user.name?.charAt(0).toUpperCase() || "A"
               )}
            </div>
            <div className="text-left overflow-hidden block w-full">
                <p className="text-sm font-bold text-white truncate">{user.name || "Admin"}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase font-semibold tracking-wider">{roleLabel}</p>
            </div>
         </div>
         <ChevronUp size={16} className={`text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}/>
      </button>
    </div>
  );
}