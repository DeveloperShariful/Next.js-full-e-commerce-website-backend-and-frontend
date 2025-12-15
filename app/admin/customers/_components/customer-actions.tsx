// app/admin/customers/_components/customer-actions.tsx

"use client";

import { useState } from "react";
import { deleteCustomer, toggleCustomerStatus } from "@/app/actions/customer";
import { Trash2, Ban, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface CustomerActionsProps {
  id: string;
  isActive: boolean;
}

export function CustomerActions({ id, isActive }: CustomerActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const res = await toggleCustomerStatus(id, !isActive);
    setLoading(false);
    
    if (res.success) toast.success(res.message || "Updated");
    else toast.error(res.message || "Failed");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    setLoading(true);
    const res = await deleteCustomer(id);
    setLoading(false);

    if (res.success) toast.success(res.message || "Deleted");
    else toast.error(res.message || "Failed");
  };

  if (loading) return <Loader2 className="animate-spin text-slate-400" size={16} />;

  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <button 
         onClick={handleToggle}
         className={`p-2 rounded-md transition ${isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
         title={isActive ? "Block User" : "Activate User"}
       >
          {isActive ? <Ban size={16}/> : <CheckCircle size={16}/>}
       </button>

       <button 
         onClick={handleDelete}
         className="p-2 text-red-600 hover:bg-red-50 rounded-md transition" 
         title="Delete User"
       >
          <Trash2 size={16} />
       </button>
    </div>
  );
}