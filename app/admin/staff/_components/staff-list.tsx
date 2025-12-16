// app/admin/staff/_components/staff-list.tsx

import { StaffCard } from "./staff-card";

interface StaffListProps {
  data: any[];
}

export function StaffList({ data }: StaffListProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>No staff members found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((staff) => (
        <StaffCard key={staff.id} staff={staff} />
      ))}
    </div>
  );
}