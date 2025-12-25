// app/admin/staff/page.tsx

import { getStaffs } from "@/app/actions/admin/staff"; // [FIXED Import]
import { StaffHeader } from "./_components/staff-header";
import { StaffList } from "./_components/staff-list";

export default async function StaffPage() {
  const { data: staffs } = await getStaffs();

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      <StaffHeader />
      <StaffList data={staffs || []} />
    </div>
  );
}