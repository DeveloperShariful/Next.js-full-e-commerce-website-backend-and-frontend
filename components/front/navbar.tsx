// components/front/navbar.tsx

"use client";

import Link from "next/link";
import { ShoppingCart, Search, Menu } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import useCart from "@/hooks/use-cart"; 

const Navbar = () => {
  const cart = useCart();

  return (
    <div className="border-b sticky top-0 z-50 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-slate-600">
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">GB</div>
            <span className="font-bold text-xl text-slate-900 hidden sm:block">GoBike</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <Link href="/shop" className="hover:text-blue-600 transition">Shop</Link>
          <Link href="/categories" className="hover:text-blue-600 transition">Categories</Link>
          <Link href="/about" className="hover:text-blue-600 transition">About</Link>
          <Link href="/contact" className="hover:text-blue-600 transition">Contact</Link>
        </nav>

        {/* Actions & Auth */}
        <div className="flex items-center gap-4">
          
          {/* Search Icon */}
          <button className="text-slate-600 hover:text-blue-600 transition">
            <Search size={20} />
          </button>

          {/* Cart Icon */}
          <Link href="/cart" className="relative text-slate-600 hover:text-blue-600 transition">
            <ShoppingCart size={20} />
            {cart.items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                {cart.items.length}
              </span>
            )}
          </Link>

          {/* Clerk Authentication */}
          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200">
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-bold px-4 py-2 border border-slate-300 rounded-full hover:bg-slate-50 transition text-slate-700">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-bold px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition shadow-sm hidden sm:block">
                  Register
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-blue-600 mr-2 hidden md:block">
                Dashboard
              </Link>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-slate-200"
                  }
                }}
              />
            </SignedIn>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Navbar;