// app/admin/staff/page.tsx

// app/admin/staff/page.tsx

import { getStaffs } from "@/app/actions/admin/staff-role/staff";
import { StaffHeader } from "./_components/staff-header";
import { StaffList } from "./_components/staff-list";
import { auth } from "@/auth"; // <-- NextAuth
import { db } from "@/lib/prisma";

export default async function StaffPage() {
  const { data: staffs } = await getStaffs();

  const session = await auth(); // <-- NextAuth
  let currentUser = null;
  
  if (session?.user?.email) {
    currentUser = await db.user.findUnique({
      where: { email: session.user.email },
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