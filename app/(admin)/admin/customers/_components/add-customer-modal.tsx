// app/admin/customers/_components/add-customer-modal.tsx

"use client";

import { useState } from "react";
import { createCustomer } from "@/app/actions/admin/customer/customer";
import { X, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

interface AddCustomerModalProps {
  onClose: () => void;
}

export function AddCustomerModal({ onClose }: AddCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const res = await createCustomer(null, formData);

    setLoading(false);

    if (res.success) {
      // [FIXED] Added fallback string
      toast.success(res.message || "Customer created successfully");
      onClose();
    } else {
      if (res.errors) {
        setErrors(res.errors);
        toast.error("Please check the form for errors");
      } else {
        // [FIXED] Added fallback string
        toast.error(res.message || "Failed to create customer");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">New Customer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Full Name *</label>
            <input name="name" className="w-full border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="John Doe" />
            {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email *</label>
              <input name="email" type="email" className="w-full border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone</label>
              <input name="phone" className="w-full border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="017..." />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password *</label>
            <input name="password" type="password" className="w-full border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="******" />
            {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Address (Optional)</label>
            <textarea name="address" rows={2} className="w-full border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition" placeholder="Street address..." />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              Create Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}