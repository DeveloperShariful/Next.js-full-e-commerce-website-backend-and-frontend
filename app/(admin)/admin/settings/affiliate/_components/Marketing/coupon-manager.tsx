// File: app/(admin)/admin/settings/affiliate/_components/Marketing/coupon-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { Ticket, Plus, Trash2, Loader2, X, User, Save, DollarSign, Percent, Edit, Search, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { 
  createAndLinkCouponAction, 
  unlinkCouponAction, 
  updateCouponAction,
  searchAffiliatesForDropdown 
} from "@/app/actions/admin/settings/affiliate/_services/coupon-tag-service";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  value: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | string;
  affiliateCommissionRate?: number | null; // NEW FIELD
  affiliate?: {
    id: string;
    user: { name: string | null; email?: string };
    slug?: string;
  } | null;
  usedCount: number;
}

export default function CouponManager({ initialCoupons }: { initialCoupons: any[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(!confirm("Delete/Unlink this coupon?")) return;
    startTransition(async () => {
        const res = await unlinkCouponAction(id);
        if(res.success) {
            toast.success(res.message);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } else {
            toast.error(res.message);
        }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
            <h3 className="font-bold text-gray-900 text-sm">Affiliate Coupons</h3>
            <p className="text-[11px] text-gray-500">Manage exclusive discount codes for partners.</p>
        </div>
        <button 
            onClick={handleCreate}
            className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
        >
            <Plus className="w-3.5 h-3.5"/> New Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500">
                    <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Discount</th>
                        <th className="px-6 py-3">Commission Override</th>
                        <th className="px-6 py-3">Assigned To</th>
                        <th className="px-6 py-3">Usage</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {coupons.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-gray-400 text-xs">No active coupons found.</td></tr>
                    ) : (
                        coupons.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-xs">
                                        {c.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700">
                                    {c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value)}
                                </td>
                                <td className="px-6 py-4">
                                    {c.affiliateCommissionRate ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                            {c.affiliateCommissionRate}% / Fixed
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-gray-400">Default Rate</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {c.affiliate ? (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px]">
                                                {c.affiliate.user.name?.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{c.affiliate.user.name}</span>
                                        </div>
                                    ) : <span className="text-gray-400 italic text-xs">General / Unassigned</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">{c.usedCount} times</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 transition-opacity">
                                        <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-black rounded transition-colors border border-transparent hover:border-gray-200">
                                            <Edit className="w-3.5 h-3.5"/>
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors border border-transparent hover:border-red-100">
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CouponModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => window.location.reload()} 
            initialData={editingCoupon}
        />
      )}
    </div>
  );
}

// --- SUB COMPONENT: SEARCHABLE MODAL ---

function CouponModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: Coupon | null }) {
    const [isPending, startTransition] = useTransition();
    const { symbol } = useGlobalStore();
    const currency = symbol || "$";

    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            code: initialData?.code || "",
            value: initialData?.value || 10,
            type: initialData?.type || "PERCENTAGE",
            affiliateId: initialData?.affiliate?.id || "",
            // NEW: Default Commission Rate
            affiliateCommissionRate: initialData?.affiliateCommissionRate || ""
        }
    });

    // Affiliate Search Logic
    const [searchTerm, setSearchTerm] = useState(initialData?.affiliate?.user.name || "");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAffiliateName, setSelectedAffiliateName] = useState(initialData?.affiliate?.user.name || "");

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm && searchTerm !== selectedAffiliateName && searchTerm.length > 1) {
                setIsSearching(true);
                const results = await searchAffiliatesForDropdown(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else if (!searchTerm) {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedAffiliateName]);

    const selectAffiliate = (affiliate: any) => {
        setValue("affiliateId", affiliate.id);
        setSelectedAffiliateName(affiliate.user.name);
        setSearchTerm(affiliate.user.name);
        setSearchResults([]);
    };

    const clearAffiliate = () => {
        setValue("affiliateId", "");
        setSelectedAffiliateName("");
        setSearchTerm("");
    };

    const onSubmit = (data: any) => {
        startTransition(async () => {
            let res;
            if (initialData?.id) {
                // Update Mode
                res = await updateCouponAction(
                    initialData.id,
                    data.code,
                    Number(data.value),
                    data.type,
                    data.affiliateId || undefined,
                    data.affiliateCommissionRate ? Number(data.affiliateCommissionRate) : undefined // NEW
                );
            } else {
                // Create Mode
                res = await createAndLinkCouponAction(
                    data.affiliateId || undefined, 
                    data.code, 
                    Number(data.value), 
                    data.type,
                    data.affiliateCommissionRate ? Number(data.affiliateCommissionRate) : undefined // NEW
                );
            }
            
            if(res.success) {
                toast.success(initialData ? "Coupon updated successfully" : "Coupon created successfully");
                onSuccess();
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm">{initialData ? "Edit Coupon" : "Create New Coupon"}</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-black" /></button>
                </div>
                
                <div className="overflow-y-auto p-5">
                    <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Coupon Code</label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    {...register("code", { required: true, minLength: 3 })} 
                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-black/5 outline-none" 
                                    placeholder="e.g. SUMMER2025" 
                                />
                            </div>
                        </div>

                        {/* Value & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Discount Type</label>
                                <div className="relative">
                                    <select {...register("type")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white appearance-none focus:ring-2 focus:ring-black/5 outline-none">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED_AMOUNT">Fixed ({currency})</option>
                                    </select>
                                    <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                        {watch("type") === "PERCENTAGE" ? <Percent className="w-3.5 h-3.5"/> : <DollarSign className="w-3.5 h-3.5"/>}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Value</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    {...register("value", { required: true, min: 0 })} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" 
                                />
                            </div>
                        </div>

                        {/* NEW: Affiliate Commission Rate Override */}
                        <div className="space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                Affiliate Commission (Optional)
                                <span title="Overrides Global/Tier/Group rules when this coupon is used."> <AlertCircle className="w-3 h-3 text-gray-400 cursor-help" /></span>
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                {...register("affiliateCommissionRate")} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none" 
                                placeholder="Leave empty to use default rules"
                            />
                            <p className="text-[10px] text-gray-400">If set, this rate applies instead of standard commission.</p>
                        </div>

                        {/* Affiliate Search Dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Assign to Affiliate</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                                />
                                {searchTerm && (
                                    <button 
                                        type="button"
                                        onClick={clearAffiliate}
                                        className="absolute right-2 top-2 p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            
                            <input type="hidden" {...register("affiliateId")} />

                            {/* Dropdown Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto divide-y divide-gray-50">
                                    {searchResults.map((aff) => (
                                        <button
                                            key={aff.id}
                                            type="button"
                                            onClick={() => selectAffiliate(aff)}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex flex-col"
                                        >
                                            <span className="text-sm font-medium text-gray-900">{aff.user.name}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">/{aff.slug} • {aff.user.email}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {isSearching && (
                                <div className="absolute right-3 top-9">
                                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                </div>
                            )}
                            
                            {!watch("affiliateId") && (
                                <p className="text-[10px] text-gray-400 mt-1">Leave empty to create a generic coupon accessible by anyone.</p>
                            )}
                            
                            {watch("affiliateId") && (
                                <div className="flex items-center gap-1.5 mt-2 bg-green-50 px-2 py-1.5 rounded-lg border border-green-100 text-green-800 text-xs font-medium">
                                    <Check className="w-3 h-3" /> Assigned to: {selectedAffiliateName}
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button 
                        type="submit" 
                        form="coupon-form" 
                        disabled={isPending} 
                        className="bg-black text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
                        {initialData ? "Update Coupon" : "Create Coupon"}
                    </button>
                </div>
            </div>
        </div>
    );
}