//File: app/(admin)/admin/settings/affiliate/product-rates/_components/product-rate-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AffiliateProductRate, CommissionType } from "@prisma/client";
import { Plus, Search, Edit, Trash2, X, Loader2, Package, User, Users, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface ProductRateWithRelations extends AffiliateProductRate {
  product: { id: string; name: string; price: any };
  affiliate?: { id: string; slug: string; user: { name: string | null } } | null;
  group?: { id: string; name: string } | null;
}

// Mock actions (Replace with real server actions)
const upsertRateAction = async (data: any) => ({ success: true, message: "Rate saved" });
const deleteRateAction = async (id: string) => ({ success: true, message: "Rate deleted" });

interface Props {
  initialRates: ProductRateWithRelations[];
}

export default function ProductRateManager({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ProductRateWithRelations | null>(null);
  const [search, setSearch] = useState("");

  const filteredRates = rates.filter(r => 
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    r.affiliate?.user.name?.toLowerCase().includes(search.toLowerCase())
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
    const res = await deleteRateAction(id);
    if(res.success) {
        setRates(prev => prev.filter(r => r.id !== id));
        toast.success(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search product, affiliate..." 
              className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Bulk Actions
            </button>
            <button 
                onClick={handleCreate}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
            >
                <Plus className="w-4 h-4" /> Add New Rate
            </button>
         </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
             <tr>
                <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Applied To</th>
                <th className="px-6 py-3">Commission Rate</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredRates.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-500">No product overrides defined.</td></tr>
             ) : (
                filteredRates.map(rate => (
                   <tr key={rate.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{rate.product.name}</span>
                         </div>
                         <div className="text-xs text-gray-400 pl-6 mt-0.5">Price: ${Number(rate.product.price).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                         {rate.affiliate ? (
                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit text-xs font-medium">
                                <User className="w-3 h-3" /> {rate.affiliate.user.name}
                            </div>
                         ) : rate.group ? (
                            <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit text-xs font-medium">
                                <Users className="w-3 h-3" /> {rate.group.name}
                            </div>
                         ) : (
                            <span className="text-gray-500 italic">Global Override</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {rate.isDisabled ? (
                            <span className="text-gray-400 line-through">Commission Disabled</span>
                         ) : (
                             <span className="font-mono font-medium">
                                {Number(rate.rate)}
                                {rate.type === "PERCENTAGE" ? "%" : " Fixed"}
                             </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {rate.isDisabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <Ban className="w-3 h-3" /> Disabled
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Active
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(rate)} className="p-2 text-gray-500 hover:bg-gray-100 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(rate.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
                toast.success("Rate saved");
            }}
         />
      )}
    </div>
  );
}

// --- MODAL ---

function RateModal({ isOpen, onClose, initialData, onSuccess }: any) {
    const [isPending, startTransition] = useTransition();
    
    const { register, handleSubmit, watch, setValue } = useForm({
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
            await upsertRateAction(payload);
            onSuccess();
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-lg">{initialData ? "Edit Rate" : "Add Product Rule"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Product ID</label>
                        <input {...register("productId", { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none" placeholder="Enter Product UUID" />
                        <p className="text-[10px] text-gray-400">In real app, use an async search dropdown here.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Apply Rule To</label>
                        <select {...register("targetType")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white">
                            <option value="AFFILIATE">Specific Affiliate</option>
                            <option value="GROUP">Affiliate Group</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {targetType === "AFFILIATE" ? "Affiliate ID" : "Group ID"}
                        </label>
                        <input {...register("targetId", { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none" placeholder={targetType === "AFFILIATE" ? "User UUID" : "Group UUID"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Commission Rate</label>
                            <input type="number" step="0.01" {...register("rate")} disabled={watch("isDisabled")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select {...register("type")} disabled={watch("isDisabled")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white disabled:bg-gray-100">
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed ($)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isDisabled" {...register("isDisabled")} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                            <label htmlFor="isDisabled" className="text-sm font-medium text-red-700 cursor-pointer">Disable Commissions entirely for this product</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2">
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Rule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}