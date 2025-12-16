// components/front/user-menu.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth/logout";
import { User, LogOut, ShoppingBag, LayoutDashboard, ChevronDown } from "lucide-react";
import Image from "next/image";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Outside click handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check Role
  const isAdmin = user.role !== "CUSTOMER";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none hover:bg-slate-100 p-1.5 rounded-full transition"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300">
          {user.image ? (
            <Image src={user.image} alt={user.name || ""} width={32} height={32} className="object-cover w-full h-full"/>
          ) : (
            <span className="font-bold text-slate-600 text-sm">{user.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">My Account</p>
        </div>
        <ChevronDown size={14} className="text-slate-500 hidden md:block"/>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="px-4 py-3 border-b border-slate-100 mb-2">
             <p className="text-sm font-bold text-slate-800">{user.name}</p>
             <p className="text-xs text-slate-500 truncate">{user.email}</p>
             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block uppercase font-bold text-slate-600">{user.role?.replace('_', ' ')}</span>
          </div>

          {/* --- ADMIN VIEW --- */}
          {isAdmin ? (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard size={16} /> Admin Dashboard
            </Link>
          ) : (
            /* --- CUSTOMER VIEW --- */
            <>
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                <User size={16} /> My Profile
              </Link>
              
              <Link 
                href="/orders" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingBag size={16} /> My Orders
              </Link>
            </>
          )}

          <div className="border-t border-slate-100 my-2"></div>

          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}