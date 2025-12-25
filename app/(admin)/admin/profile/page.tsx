// app/admin/profile/page.tsx

"use client";

import { UserProfile } from "@clerk/nextjs";

export default function AdminProfilePage() {
  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your account settings, security, and preferences.</p>
      </div>

      <div className="flex justify-center pb-10">
        <UserProfile 
          path="/admin/profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full max-w-5xl",
              card: "shadow-sm border border-slate-200 rounded-xl w-full bg-white",
              navbar: "border-r border-slate-100",
              navbarButton: "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium",
              headerTitle: "text-xl font-bold text-slate-800",
              headerSubtitle: "text-slate-500",
            }
          }}
        />
      </div>
    </div>
  );
}