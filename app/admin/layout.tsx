// app/admin/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }
  const dbUser = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress }
  });
  if (!dbUser || dbUser.role === Role.CUSTOMER) {
    redirect("/"); 
  }
  const adminUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: clerkUser.imageUrl,
  };
  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-800 overflow-hidden">
      <AdminSidebar user={adminUser} />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <AdminHeader user={adminUser} />
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">    
              {children}
        </main>
      </div>
    </div>
  );
}