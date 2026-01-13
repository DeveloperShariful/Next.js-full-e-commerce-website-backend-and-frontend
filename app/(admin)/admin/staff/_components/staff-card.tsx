// app/admin/staff/_components/staff-card.tsx

"use client";

import { useState } from "react";
import { deleteStaff } from "@/app/actions/admin/staff-role/staff"; 
import { Trash2, Mail, Shield, Loader2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { StaffModal } from "./staff-modal"; 

interface StaffCardProps {
  staff: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  currentUser: {
    id: string;
    role: string;
  } | null;
}

export function StaffCard({ staff, currentUser }: StaffCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${staff.name}?`)) return;
    
    setIsDeleting(true);
    const res = await deleteStaff(staff.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success(res.message || "Removed");
      router.refresh();
    } else {
      toast.error(res.error || "Failed");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MANAGER': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const isSelf = currentUser?.id === staff.id;
  const amISuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isTargetSuperAdmin = staff.role === 'SUPER_ADMIN';

  const canDelete = !isSelf && (amISuperAdmin || (!isTargetSuperAdmin && currentUser?.role === 'ADMIN'));
  const canEdit = amISuperAdmin || (!isTargetSuperAdmin && currentUser?.role === 'ADMIN');

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group">
        
        <div className="absolute top-4 right-4 flex gap-2">
          {canEdit && (
            <button 
              onClick={() => setIsEditOpen(true)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition shadow-sm"
              title="Edit Staff"
            >
              <Pencil size={14} />
            </button>
          )}

          {canDelete && (
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition shadow-sm disabled:opacity-50"
              title="Remove Staff"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 mb-4 pr-20">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200 shrink-0">
              {staff.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base" title={staff.name || ""}>
                {staff.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 truncate" title={staff.email || ""}>
                <Mail size={10}/> {staff.email}
              </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleColor(staff.role)}`}>
              <Shield size={12}/> {staff.role.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <StaffModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        staffToEdit={staff} 
        currentUserRole={currentUser?.role}
      />
    </>
  );
}