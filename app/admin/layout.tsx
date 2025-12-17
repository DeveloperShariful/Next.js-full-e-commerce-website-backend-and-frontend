// app/admin/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Get Clerk User (Authentication)
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // 2. Get Database User (Authorization/Role Check)
  // We identify user by email since Clerk ID might not be synced yet if webhook fails, 
  // but email is reliable for linking.
  const dbUser = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress }
  });

  // 3. Security: If user not in DB or is a CUSTOMER, redirect to home
  if (!dbUser || dbUser.role === Role.CUSTOMER) {
    redirect("/"); 
  }

  // 4. Construct User Object for UI
  // Merging Clerk Image with Database Role
  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: clerkUser.imageUrl, // Clerk provides the best avatar
  };

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
      
      {/* 1. Sidebar (Desktop Only) */}
      <AdminSidebar user={adminUser} />

      {/* 2. Main Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* 3. Header */}
        <AdminHeader user={adminUser} />

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