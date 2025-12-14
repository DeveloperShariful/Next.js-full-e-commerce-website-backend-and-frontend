// app/admin/staff/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getStaffs, createStaff, deleteStaff } from "@/actions/staff";
import { toast } from "react-hot-toast";
import { 
  ShieldCheck, Plus, Trash2, User, Mail, Lock, 
  Loader2, CheckCircle2, Shield 
} from "lucide-react";

export default function StaffPage() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getStaffs();
    if (res.success) setStaffs(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createStaff(formData);
    
    if (res.success) {
      toast.success(res.message as string);
      setIsModalOpen(false);
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this staff member?")) return;
    const res = await deleteStaff(id);
    if(res.success) {
      toast.success(res.message as string);
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Staff & Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage admin users and permissions.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
           <Plus size={16}/> Add New Staff
        </button>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
             <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600"/></div>
         ) : staffs.map((staff) => (
             <div key={staff.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                    {staff.role !== 'SUPER_ADMIN' && (
                        <button onClick={() => handleDelete(staff.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={16}/></button>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                        {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{staff.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {staff.email}</p>
                    </div>
                 </div>

                 <div className="border-t pt-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        staff.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        staff.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                        <Shield size={12}/> {staff.role.replace('_', ' ')}
                    </span>
                 </div>
             </div>
         ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6 text-slate-800">Add New Staff</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input name="name" required className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input name="email" type="email" required className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input name="password" type="password" required className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Role</label>
                    <select name="role" className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="EDITOR">Editor</option>
                        <option value="SUPPORT">Support</option>
                    </select>
                 </div>
                 <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg text-sm font-bold hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">Create Account</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}