// app/actions/storefront/header-footer/header-client.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { Search, Menu, X, LayoutDashboard, User, Network } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Cart_Icon } from "./Cart_Icon"; // Ensure this path is correct based on your folder structure
import { cn } from "@/lib/utils";

interface HeaderClientProps {
  cartCount: number;
  isAffiliate: boolean; // ✅ Server থেকে আসা স্ট্যাটাস
}

export default function HeaderClient({ cartCount, isAffiliate }: HeaderClientProps) {
  const { storeName, logo, menus, primaryColor } = useGlobalStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();

  // Global Settings থেকে মেনু লোড করা
  const mainMenuItems = menus["main-menu"] || [];

  // Admin Role চেক করা (Clerk Metadata বা Pathname দিয়ে)
  const isAdmin = user?.publicMetadata?.role === "admin" || pathname.startsWith("/admin");

  return (
    <>
      <header className="border-b sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-all duration-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* -------------------- 1. LEFT: LOGO -------------------- */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={24} />
            </button>

            {/* Dynamic Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              {logo?.url ? (
                <div className="relative w-8 h-8 sm:w-auto">
                  <Image 
                    src={logo.url} 
                    alt={logo.altText || storeName} 
                    width={logo.width || 40} 
                    height={logo.height || 40}
                    className="object-contain max-h-10 w-auto"
                  />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: primaryColor || "#000" }}
                >
                  {storeName ? storeName.substring(0, 2).toUpperCase() : "ST"}
                </div>
              )}
              <span className="font-bold text-xl text-slate-900 hidden sm:block tracking-tight">
                {storeName}
              </span>
            </Link>
          </div>

          {/* -------------------- 2. CENTER: NAVIGATION (Desktop) -------------------- */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainMenuItems.length > 0 ? (
              mainMenuItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Link 
                    href={item.url} 
                    target={item.target}
                    className={cn(
                      "px-4 py-2 text-sm font-medium text-slate-600 hover:text-black hover:bg-slate-50 rounded-full transition-all flex items-center gap-1",
                      pathname === item.url && "text-black bg-slate-50"
                    )}
                  >
                    {item.label}
                    {/* Dropdown Icon if children exist */}
                    {item.children && item.children.length > 0 && (
                      <span className="opacity-50 text-[10px]">▼</span>
                    )}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {item.children && item.children.length > 0 && (
                     <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-100 shadow-lg rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                       {item.children.map((subItem) => (
                         <Link 
                           key={subItem.id} 
                           href={subItem.url}
                           target={subItem.target}
                           className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg"
                         >
                           {subItem.label}
                         </Link>
                       ))}
                     </div>
                  )}
                </div>
              ))
            ) : (
              // Fallback Menu
              <>
                <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-black hover:bg-slate-50 rounded-full">Home</Link>
                <Link href="/shop" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-black hover:bg-slate-50 rounded-full">Shop</Link>
              </>
            )}
          </nav>

          {/* -------------------- 3. RIGHT: ACTIONS -------------------- */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Cart Icon */}
            <Cart_Icon initialCount={cartCount} />

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold px-4 py-2 border border-slate-200 rounded-full hover:border-slate-400 transition text-slate-700 hidden sm:block">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm font-bold px-4 py-2 bg-black text-white rounded-full hover:bg-slate-800 transition shadow-sm hidden sm:block">
                    Register
                  </button>
                </SignUpButton>
                {/* Mobile only icon for login */}
                <SignInButton mode="modal">
                    <button className="sm:hidden p-2 text-slate-600"><User size={20} /></button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                {/* --- ROLE BASED DASHBOARD BUTTONS --- */}
                
                {/* 1. ADMIN BUTTON */}
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-700 transition"
                  >
                    <LayoutDashboard size={14} />
                    Admin
                  </Link>
                )}

                {/* 2. AFFILIATE BUTTON (Show if Affiliate AND Not Admin) */}
                {isAffiliate && !isAdmin && (
                  <Link 
                    href="/affiliates" 
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
                  >
                    <Network size={14} />
                    Partner Portal
                  </Link>
                )}

                {/* 3. REGULAR USER BUTTON (If neither) */}
                {!isAdmin && !isAffiliate && (
                  <Link 
                    href="/affiliates/register" 
                    className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition"
                  >
                    <User size={14} />
                    Join Affiliate
                  </Link>
                )}
                
                <div className="ml-1">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 border-2 border-slate-100 hover:border-slate-300 transition",
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* -------------------- 4. SEARCH OVERLAY -------------------- */}
        {isSearchOpen && (
          <div className="absolute top-16 left-0 w-full bg-white border-b shadow-sm p-4 animate-in slide-in-from-top-2 z-40">
            <div className="container mx-auto max-w-3xl relative">
              <Search className="absolute left-4 top-3.5 text-slate-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="Search products, categories..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all"
                autoFocus
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-4 top-3 text-xs font-bold text-slate-400 hover:text-black bg-slate-100 px-2 py-1 rounded"
              >
                ESC
              </button>
            </div>
          </div>
        )}
      </header>

      {/* -------------------- 5. MOBILE MENU -------------------- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-lg truncate">{storeName}</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mainMenuItems.length > 0 ? (
                mainMenuItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <Link 
                      href={item.url} 
                      className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.children?.map((child) => (
                      <Link 
                        key={child.id} 
                        href={child.url}
                        className="block px-4 py-2 ml-4 text-sm text-slate-500 hover:text-black border-l border-slate-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Home</Link>
                  <Link href="/shop" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Shop</Link>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 space-y-3">
              <SignedIn>
                {/* Mobile Role Links */}
                {isAdmin && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-lg shadow-sm">
                      <LayoutDashboard size={18} /> <span className="font-medium text-sm">Admin Dashboard</span>
                    </Link>
                )}
                {isAffiliate && (
                    <Link href="/affiliates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-sm">
                      <Network size={18} /> <span className="font-medium text-sm">Partner Portal</span>
                    </Link>
                )}
                <Link href="/affiliates/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-white border rounded-lg shadow-sm hover:bg-gray-50">
                  <User size={18} /> <span className="font-medium text-sm">join Affiliate</span>
                </Link>
              </SignedIn>

              <SignedOut>
                  <SignInButton>
                    <button className="w-full py-2.5 text-sm font-semibold border bg-white rounded-lg mb-2">Login</button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="w-full py-2.5 text-sm font-bold bg-black text-white rounded-lg">Register</button>
                  </SignUpButton>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </>
  );
}