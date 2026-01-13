// app/admin/staff/_components/staff-modal.tsx

"use client";

import { useTransition } from "react";
import { createStaff, updateStaff } from "@/app/actions/admin/staff-role/staff"; 
import { X, Loader2, Save, User, Mail, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: any;
  currentUserRole?: string;
}

export function StaffModal({ isOpen, onClose, staffToEdit, currentUserRole }: StaffModalProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let res;
      if (staffToEdit) {
        formData.append("id", staffToEdit.id);
        res = await updateStaff(null, formData);
      } else {
        res = await createStaff(null, formData);
      }
      
      if (res.success) {
        toast.success(res.message || "Success");
        router.refresh(); 
        onClose();
      } else {
        toast.error(res.error || "Failed");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            {staffToEdit ? "Edit Staff" : "Add New Staff"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                  name="name" 
                  defaultValue={staffToEdit?.name || ""}
                  required 
                  placeholder="John Doe" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
            <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={staffToEdit?.email || ""}
                  required 
                  placeholder="staff@example.com" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                />
            </div>
            {!staffToEdit && (
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    * The user must Sign Up with this email to access the panel.
                </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Role</label>
            <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <select 
                  name="role" 
                  defaultValue={staffToEdit?.role || "EDITOR"}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                >
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">Super Admin</option>
                    )}
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EDITOR">Editor</option>
                    <option value="SUPPORT">Support</option>
                </select>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
            >
              {isPending ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
              {staffToEdit ? "Update Staff" : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}