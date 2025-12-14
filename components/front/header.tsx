// components/front/header.tsx

import Link from "next/link";
import { auth } from "@/auth";
import UserMenu from "./user-menu";
import MiniCart from "./mini-cart"; // ✅ Import MiniCart
import { Search, Menu } from "lucide-react";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* 1. Logo & Mobile Menu */}
        <div className="flex items-center gap-2">
           <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
             <Menu size={24} />
           </button>
           <Link href="/" className="text-2xl font-bold text-slate-900 flex items-center gap-1">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">GB</div>
             <span className="hidden sm:block">GoBike</span>
           </Link>
        </div>

        {/* 2. Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
           <Link href="/" className="hover:text-blue-600 transition">Home</Link>
           <Link href="/shop" className="hover:text-blue-600 transition">Shop</Link>
           <Link href="/categories" className="hover:text-blue-600 transition">Categories</Link>
           <Link href="/about" className="hover:text-blue-600 transition">About</Link>
           <Link href="/contact" className="hover:text-blue-600 transition">Contact</Link>
        </nav>

        {/* 3. Actions (Search, Cart, User) */}
        <div className="flex items-center gap-2 sm:gap-4">
           
           {/* Search Icon */}
           <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition">
              <Search size={20} />
           </button>

           {/* ✅ Dynamic Mini Cart */}
           <MiniCart />

           {/* Divider */}
           <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

           {/* User Auth Logic */}
           {user ? (
             <UserMenu user={user} />
           ) : (
             <div className="flex items-center gap-2">
                <Link 
                  href="/auth/login" 
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition hidden sm:block"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-full hover:bg-slate-800 transition shadow-sm"
                >
                  Register
                </Link>
             </div>
           )}
        </div>

      </div>
    </header>
  );
}