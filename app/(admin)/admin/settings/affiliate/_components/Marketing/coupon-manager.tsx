// File: app/(admin)/admin/settings/affiliate/_components/Marketing/coupon-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { Ticket, Plus, Trash2, Loader2, X, User, Save, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { createAndLinkCouponAction, unlinkCouponAction } from "@/app/actions/admin/settings/affiliates/_services/coupon-service";

interface Coupon {
  id: string;
  code: string;
  value: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | string; // Adjusted to match Prisma enum roughly
  affiliate?: {
    id: string;
    user: { name: string | null };
  } | null;
  usedCount: number;
}

export default function CouponManager({ initialCoupons }: { initialCoupons: any[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formatPrice } = useGlobalStore();

  const handleUnlink = (id: string) => {
    if(!confirm("Delete/Unlink this coupon?")) return;
    startTransition(async () => {
        const res = await unlinkCouponAction(id);
        if(res.success) {
            toast.success("Coupon removed");
            setCoupons(prev => prev.filter(c => c.id !== id));
        } else {
            toast.error(res.message);
        }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
            <h3 className="font-bold text-gray-900">Affiliate Coupons</h3>
            <p className="text-xs text-gray-500">Manage generic and affiliate-specific coupons.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
            <Plus className="w-4 h-4"/> Create / Assign Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-500">
                <tr>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Usage</th>
                    <th className="px-6 py-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {coupons.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No active coupons found.</td></tr>
                ) : (
                    coupons.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600">{c.code}</td>
                            <td className="px-6 py-4">
                                {c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value)}
                            </td>
                            <td className="px-6 py-4">
                                {c.affiliate ? (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                        <User className="w-3 h-3"/> {c.affiliate.user.name}
                                    </span>
                                ) : <span className="text-gray-400 italic text-xs">General / Unassigned</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{c.usedCount} times</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleUnlink(c.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <CouponModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => window.location.reload()} 
        />
      )}
    </div>
  );
}

// --- Sub Component: Coupon Modal ---
function CouponModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit, watch } = useForm({
        defaultValues: {
            code: "",
            value: 10,
            type: "PERCENTAGE",
            affiliateId: ""
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            // Note: affiliateId can be empty string, createAndLinkCouponAction should handle empty as null
            const res = await createAndLinkCouponAction(
                data.affiliateId || undefined, 
                data.code, 
                Number(data.value), 
                data.type
            );
            
            if(res.success) {
                toast.success("Coupon created successfully");
                onSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Create New Coupon</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Coupon Code</label>
                        <div className="relative">
                            <Ticket className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register("code", { required: true, minLength: 3 })} 
                                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-black/5 outline-none" 
                                placeholder="e.g. SUMMER2025" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Discount Type</label>
                            <select {...register("type")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Value</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                {...register("value", { required: true, min: 0 })} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Assign to Affiliate (Optional)</label>
                        <input 
                            {...register("affiliateId")} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder:text-gray-400" 
                            placeholder="Enter Affiliate UUID (Leave empty for global)" 
                        />
                        <p className="text-[10px] text-gray-400">
                            Paste an Affiliate ID to make this coupon exclusive to them.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isPending} 
                            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            Create Coupon
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}