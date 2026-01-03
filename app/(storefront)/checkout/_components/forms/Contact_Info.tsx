// File: app/(storefront)/checkout/_components/forms/Contact_Info.tsx

"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck } from "lucide-react";
import Link from "next/link";

export const Contact_Info = () => {
  const { user, initialize } = useCheckoutStore();

  // যদি ইউজার লগইন করা থাকে
  if (user) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-full">
            <UserCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Logged in as {user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <Link href="/sign-out" className="text-xs text-blue-600 font-medium hover:underline">
            Sign out
        </Link>
      </div>
    );
  }

  // যদি গেস্ট হয়
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="guest-email">Email Address</Label>
        <Link href="/sign-in" className="text-xs text-blue-600 hover:underline">
            Already have an account? Log in
        </Link>
      </div>
      <Input 
        id="guest-email" 
        type="email" 
        placeholder="you@example.com" 
        required 
        className="bg-white"
        // Note: For production, create a local state or bind to store specific 'guestEmail' field
        // For simplicity, we assume guestCheckout handles this via form submission later or store update
      />
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="newsletter" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <label htmlFor="newsletter" className="text-sm text-gray-500">
            Email me with news and offers
        </label>
      </div>
    </div>
  );
};