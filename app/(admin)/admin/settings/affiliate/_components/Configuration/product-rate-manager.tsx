// File: app/(admin)/admin/settings/affiliate/_components/Configuration/product-rate-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AffiliateProductRate, CommissionType } from "@prisma/client";
import { Plus, Search, Edit, Trash2, X, Loader2, Package, User, Users, CheckCircle, Ban, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

// ✅ Correct Import Path
// ✅ Use Named Imports
import { deleteRateAction, upsertRateAction } from "@/app/actions/admin/settings/affiliate/_services/product-rate-service";

// Types
interface ProductRateWithRelations extends AffiliateProductRate {
  product: { id: string; name: string; price: number };
  affiliate?: { id: string; slug: string; user: { name: string | null } } | null;
  group?: { id: string; name: string } | null;
}

interface Props {
  initialRates: ProductRateWithRelations[];
}

export default function ProductRateManager({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ProductRateWithRelations | null>(null);
  const [search, setSearch] = useState("");
  
  const { formatPrice, symbol } = useGlobalStore();

  const filteredRates = rates.filter(r => 
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    r.affiliate?.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.group?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingRate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rate: ProductRateWithRelations) => {
    setEditingRate(rate);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this commission override?")) return;
    
    // ✅ Call Service Method Directly
    const res = await deleteRateAction(id);
    if(res.success) {
        setRates(prev => prev.filter(r => r.id !== id));
        toast.success(res.message);
    } else {
        toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search product, affiliate..." 
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
         >
            <Plus className="w-4 h-4" /> Add New Rate
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
             <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">Commission Override</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredRates.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Package className="w-10 h-10 text-gray-300 mb-2"/>
                        <p>No product overrides defined.</p>
                    </td>
                </tr>
             ) : (
                filteredRates.map(rate => (
                   <tr key={rate.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg border">
                                <Package className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <span className="font-medium text-gray-900 block">{rate.product.name}</span>
                                <span className="text-xs text-gray-400">Price: {formatPrice(rate.product.price)}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         {rate.affiliate ? (
                            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded-md w-fit text-xs font-bold border border-blue-100">
                                <User className="w-3 h-3" /> {rate.affiliate.user.name}
                            </div>
                         ) : rate.group ? (
                            <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-1 rounded-md w-fit text-xs font-bold border border-purple-100">
                                <Users className="w-3 h-3" /> {rate.group.name}
                            </div>
                         ) : (
                            <span className="text-gray-500 italic text-xs bg-gray-100 px-2 py-1 rounded">Global Override</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {rate.isDisabled ? (
                            <span className="text-gray-400 line-through text-xs">Commission Disabled</span>
                         ) : (
                             <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border">
                                {rate.type === "FIXED" ? symbol : ""}{Number(rate.rate)}{rate.type === "PERCENTAGE" ? "%" : ""}
                             </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {rate.isDisabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                <Ban className="w-3 h-3" /> Disabled
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                <CheckCircle className="w-3 h-3" /> Active
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(rate)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(rate.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </td>
                   </tr>
                ))
             )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
         <RateModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            initialData={editingRate}
            onSuccess={() => {
                setIsModalOpen(false);
                window.location.reload(); 
            }}
         />
      )}
    </div>
  );
}

// --- SUB COMPONENT: MODAL ---

function RateModal({ isOpen, onClose, initialData, onSuccess }: any) {
    const [isPending, startTransition] = useTransition();
    
    const { register, handleSubmit, watch } = useForm({
        defaultValues: {
            productId: initialData?.productId || "",
            targetType: initialData?.affiliateId ? "AFFILIATE" : initialData?.groupId ? "GROUP" : "GLOBAL",
            targetId: initialData?.affiliateId || initialData?.groupId || "",
            rate: initialData?.rate ? Number(initialData.rate) : "",
            type: initialData?.type || "PERCENTAGE",
            isDisabled: initialData?.isDisabled || false
        }
    });

    const targetType = watch("targetType");

    const onSubmit = (data: any) => {
        const payload = {
            id: initialData?.id,
            productId: data.productId,
            rate: Number(data.rate),
            type: data.type,
            isDisabled: data.isDisabled,
            affiliateId: data.targetType === "AFFILIATE" ? data.targetId : null,
            groupId: data.targetType === "GROUP" ? data.targetId : null,
        };

        startTransition(async () => {
            // ✅ Call Service Method Directly
            const res = await upsertRateAction(payload);
            if(res.success) {
                toast.success(res.message);
                onSuccess();
            } else {
                toast.error(res.message);
            }
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{initialData ? "Edit Rate" : "Add Product Rule"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Product ID</label>
                        <div className="relative">
                            <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input {...register("productId", { required: true })} className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" placeholder="Enter Product UUID" />
                        </div>
                        <p className="text-[10px] text-gray-400">In production, this would be an async search dropdown.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Apply Rule To</label>
                        <select {...register("targetType")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none">
                            <option value="GLOBAL">Everyone (Global Product Override)</option>
                            <option value="AFFILIATE">Specific Affiliate</option>
                            <option value="GROUP">Affiliate Group</option>
                        </select>
                    </div>

                    {targetType !== "GLOBAL" && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-xs font-bold text-gray-700 uppercase">
                                {targetType === "AFFILIATE" ? "Affiliate ID" : "Group ID"}
                            </label>
                            <input {...register("targetId", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" placeholder="UUID" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Rate</label>
                            <input type="number" step="0.01" {...register("rate")} disabled={watch("isDisabled")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none disabled:bg-gray-100" placeholder="10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Type</label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-1 cursor-pointer border px-2 py-2 rounded-lg w-full justify-center has-[:checked]:bg-black has-[:checked]:text-white transition-colors">
                                    <input type="radio" value="PERCENTAGE" {...register("type")} className="sr-only"/>
                                    <Percent className="w-3 h-3"/> %
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer border px-2 py-2 rounded-lg w-full justify-center has-[:checked]:bg-black has-[:checked]:text-white transition-colors">
                                    <input type="radio" value="FIXED" {...register("type")} className="sr-only"/>
                                    <DollarSign className="w-3 h-3"/> $
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-center gap-3">
                        <input type="checkbox" id="isDisabled" {...register("isDisabled")} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <label htmlFor="isDisabled" className="text-sm font-bold text-red-800 cursor-pointer select-none">Disable Commissions for this item</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Rule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}