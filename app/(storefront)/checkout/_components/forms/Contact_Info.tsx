"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const Contact_Info = () => {
  // ✅ FIX: Selecting state individually to prevent infinite loop
  const user = useCheckoutStore((state) => state.user);
  const guestEmail = useCheckoutStore((state) => state.guestEmail);
  const setGuestEmail = useCheckoutStore((state) => state.setGuestEmail);

  const [email, setEmail] = useState(guestEmail || "");

  // Sync local state to store with debounce
  useEffect(() => {
    if (!user) {
        const timer = setTimeout(() => {
            setGuestEmail(email);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [email, setGuestEmail, user]);

  // 1. Logged In View
  if (user) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-4">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Logged in as {user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <Link href="/api/auth/signout" className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
            Sign out
        </Link>
      </div>
    );
  }

  // 2. Guest View
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <Label htmlFor="guest-email" className="text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
        </Label>
        <Link href="/sign-in?redirect=/checkout" className="text-xs text-blue-600 hover:underline font-medium">
            Already have an account? Log in
        </Link>
      </div>
      
      <div className="relative">
        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input 
            id="guest-email" 
            type="email" 
            placeholder="you@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-start space-x-2 pt-1">
        <input 
            type="checkbox" 
            id="newsletter" 
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
        />
        <label htmlFor="newsletter" className="text-xs text-gray-500 leading-tight cursor-pointer">
            Keep me up to date on news and exclusive offers.
        </label>
      </div>
    </div>
  );
};