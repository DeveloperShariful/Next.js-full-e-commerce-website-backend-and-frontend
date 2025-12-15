import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth"; // আপনার Auth পাথ অনুযায়ী
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

// রোলের উপর ভিত্তি করে অ্যাক্সেস কন্ট্রোল (প্রয়োজন হলে)
const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user;

  // 1. Security: যদি ইউজার না থাকে বা কাস্টমার হয়, তাহলে এক্সেস নেই
  if (!user || user.role === "CUSTOMER") {
    redirect("/"); // অথবা একটি Unauthorized পেজে পাঠাতে পারেন
  }

  // 2. Role Verification (Optional: আরও কড়া সিকিউরিটির জন্য)
  // if (!ALLOWED_ROLES.includes(user.role)) {
  //   redirect("/unauthorized");
  // }

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
      
      {/* 1. Sidebar (Desktop Only) */}
      {/* মোবাইলে এটি 'hidden' থাকবে (Sidebar কম্পোনেন্টের ভেতরেই লজিক করা আছে) */}
      <AdminSidebar user={user} />

      {/* 2. Main Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* 3. Header */}
        {/* এর ভেতরেই Mobile Sidebar Trigger, Search এবং Notifications আছে */}
        <AdminHeader user={user} />

        {/* 4. Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent p-4 sm:p-6 lg:p-8">
           <div className="max-w-[1600px] mx-auto space-y-6">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}