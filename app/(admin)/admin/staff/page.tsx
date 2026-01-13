// app/admin/staff/page.tsx

import { getStaffs } from "@/app/actions/admin/staff-role/staff";
import { StaffHeader } from "./_components/staff-header";
import { StaffList } from "./_components/staff-list";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export default async function StaffPage() {
  const { data: staffs } = await getStaffs();

  const { userId } = await auth();
  let currentUser = null;
  
  if (userId) {
    currentUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    });
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      <StaffHeader currentUserRole={currentUser?.role} />
      <StaffList data={staffs || []} currentUser={currentUser} />
    </div>
  );
}