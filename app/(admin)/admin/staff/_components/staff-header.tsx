// app/admin/staff/_components/staff-header.tsx

"use client";

import { useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { StaffModal } from "./staff-modal";

interface StaffHeaderProps {
  currentUserRole?: string;
}

export function StaffHeader({ currentUserRole }: StaffHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Staff & Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage admin users and assign permissions.</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2 shadow-sm transition active:scale-95"
        >
           <Plus size={16}/> Add New Staff
        </button>
      </div>

      <StaffModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        currentUserRole={currentUserRole} // [UPDATE]
      />
    </>
  );
}