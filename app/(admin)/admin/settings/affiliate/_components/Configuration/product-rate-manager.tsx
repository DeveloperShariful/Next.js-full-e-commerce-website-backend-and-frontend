// File: app/(admin)/admin/settings/affiliate/_components/Configuration/product-rate-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AffiliateProductRate, CommissionType } from "@prisma/client";
import { Plus, Search, Edit, Trash2, X, Loader2, Package, User, Users, CheckCircle, Ban, DollarSign, Percent, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteRateAction, upsertRateAction, searchProducts } from "@/app/actions/admin/settings/affiliate/_services/product-rate-service";
import { searchAffiliatesForDropdown } from "@/app/actions/admin/settings/affiliate/_services/coupon-tag-service";
import { getAllGroups } from "@/app/actions/admin/settings/affiliate/_services/group-service";

interface ProductRateWithRelations extends AffiliateProductRate {
  product: { 
      id: string; 
      name: string; 
      price: any; 
      affiliateCommissionRate: any; 
      affiliateCommissionType: any; 
  };
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
                <th className="px-6 py-3">Override Rate</th>
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
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    Price: {formatPrice(rate.product.price)} • Default: 
                                    {rate.product.affiliateCommissionRate 
                                        ? `${Number(rate.product.affiliateCommissionRate)}${rate.product.affiliateCommissionType === 'PERCENTAGE' ? '%' : symbol}` 
                                        : 'Global'}
                                </span>
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
                            <span className="text-gray-500 italic text-xs bg-gray-100 px-2 py-1 rounded border">Global Override</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {rate.isDisabled ? (
                            <span className="text-gray-400 line-through text-xs">Commission Disabled</span>
                         ) : (
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border">
                                    {rate.type === "FIXED" ? symbol : ""}{Number(rate.rate)}{rate.type === "PERCENTAGE" ? "%" : ""}
                                </span>
                            </div>
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
                         <div className="flex justify-end gap-2 transition-opacity">
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
// model
function RateModal({ isOpen, onClose, initialData, onSuccess }: any) {
    const [isPending, startTransition] = useTransition();
    
    // Form Setup
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

    const { symbol } = useGlobalStore();
    const currency = symbol || "$";
    const targetType = watch("targetType");
    const [prodSearchTerm, setProdSearchTerm] = useState("");
    const [prodResults, setProdResults] = useState<any[]>([]);
    const [isSearchingProd, setIsSearchingProd] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(initialData?.product || null);
    const [targetSearchTerm, setTargetSearchTerm] = useState("");
    const [targetResults, setTargetResults] = useState<any[]>([]);
    const [isSearchingTarget, setIsSearchingTarget] = useState(false);
    const initialTargetName = initialData?.affiliate 
        ? initialData.affiliate.user.name 
        : initialData?.group 
            ? initialData.group.name 
            : null;
    const [selectedTarget, setSelectedTarget] = useState<{id: string, name: string, sub?: string} | null>(
        initialTargetName ? { id: initialData?.affiliateId || initialData?.groupId, name: initialTargetName } : null
    );
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (prodSearchTerm && prodSearchTerm.length > 1) {
                setIsSearchingProd(true);
                const results = await searchProducts(prodSearchTerm);
                setProdResults(results);
                setIsSearchingProd(false);
            } else {
                setProdResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [prodSearchTerm]);

    useEffect(() => {
        if (targetType === "GLOBAL") {
            setSelectedTarget(null);
            setValue("targetId", "");
        }
    }, [targetType, setValue]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (targetSearchTerm && targetSearchTerm.length > 0) { 
                setIsSearchingTarget(true);
                
                if (targetType === "AFFILIATE") {
                    const results = await searchAffiliatesForDropdown(targetSearchTerm);
                    setTargetResults(results.map(r => ({
                        id: r.id,
                        name: r.user.name || "Unknown",
                        sub: r.user.email
                    })));
                } else if (targetType === "GROUP") {
                    const results = await getAllGroups(); 
                    const filtered = results.filter(g => g.name.toLowerCase().includes(targetSearchTerm.toLowerCase()));
                    setTargetResults(filtered.map(g => ({
                        id: g.id,
                        name: g.name,
                        sub: `${g._count?.affiliates || 0} members`
                    })));
                }
                
                setIsSearchingTarget(false);
            } else {
                setTargetResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [targetSearchTerm, targetType]);
    const selectProduct = (product: any) => {
        setValue("productId", product.id);
        setSelectedProduct(product);
        setProdSearchTerm("");
        setProdResults([]);
    };
    const selectTarget = (item: any) => {setValue("targetId", item.id); setSelectedTarget(item);setTargetSearchTerm(""); setTargetResults([]);
    };
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{initialData ? "Edit Commission Rule" : "Add Product Rule"}</h3>
                        <p className="text-xs text-gray-500 mt-1">Set custom commission rates for specific products.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. PRODUCT SEARCH SECTION */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase flex justify-between">
                            Target Product
                            {selectedProduct && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Selected</span>}
                        </label>
                        
                        {!selectedProduct ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    value={prodSearchTerm}
                                    onChange={(e) => setProdSearchTerm(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" 
                                    placeholder="Type product name..." 
                                    autoFocus
                                />
                                {isSearchingProd && <div className="absolute right-3 top-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}

                                {prodResults.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-60 overflow-y-auto divide-y divide-gray-50">
                                        {prodResults.map((prod) => (
                                            <button key={prod.id} type="button" onClick={() => selectProduct(prod)} className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900 block">{prod.name}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">Price: {currency}{prod.price}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded border border-blue-100"><Package className="w-5 h-5 text-blue-600" /></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{selectedProduct.name}</h4>
                                        <p className="text-[11px] text-gray-500 font-mono">ID: {selectedProduct.id}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setValue("productId", ""); setSelectedProduct(null); }} className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline px-2">Change</button>
                            </div>
                        )}
                        <input type="hidden" {...register("productId", { required: true })} />
                        {!selectedProduct && <p className="text-[10px] text-red-500 animate-pulse">* Product selection is required.</p>}
                    </div>

                    <div className="h-px bg-gray-100 w-full" />

                    {/* 2. RULE CONFIGURATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Left Column: Target Selection */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Apply Rule To</label>
                                <select {...register("targetType")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all">
                                    <option value="GLOBAL">Everyone (Global Override)</option>
                                    <option value="AFFILIATE">Specific Affiliate Only</option>
                                    <option value="GROUP">Specific Group Only</option>
                                </select>
                            </div>

                            {/* DYNAMIC TARGET SEARCH */}
                            {targetType !== "GLOBAL" && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">
                                        Search {targetType === "AFFILIATE" ? "Affiliate" : "Group"}
                                    </label>
                                    
                                    {!selectedTarget ? (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text"
                                                value={targetSearchTerm}
                                                onChange={(e) => setTargetSearchTerm(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none" 
                                                placeholder={`Type ${targetType.toLowerCase()} name...`}
                                            />
                                            {isSearchingTarget && <div className="absolute right-3 top-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}

                                            {targetResults.length > 0 && (
                                                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-48 overflow-y-auto divide-y divide-gray-50">
                                                    {targetResults.map((item) => (
                                                        <button key={item.id} type="button" onClick={() => selectTarget(item)} className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors">
                                                            <span className="text-sm font-medium text-gray-900 block">{item.name}</span>
                                                            <span className="text-[10px] text-gray-500">{item.sub}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-100 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {targetType === "AFFILIATE" ? <User className="w-4 h-4 text-purple-600"/> : <Users className="w-4 h-4 text-purple-600"/>}
                                                <span className="text-sm font-bold text-purple-900">{selectedTarget.name}</span>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedTarget(null); setValue("targetId", ""); }} className="text-xs text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                                        </div>
                                    )}
                                    <input type="hidden" {...register("targetId", { required: targetType !== "GLOBAL" })} />
                                    {!selectedTarget && <p className="text-[10px] text-red-500">* Selection required.</p>}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Rate & Logic */}
                        <div className="space-y-4">
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Commission Rate</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">
                                            {watch("type") === "FIXED" ? currency : <Percent className="w-3.5 h-3.5" />}
                                        </span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            {...register("rate")} 
                                            disabled={watch("isDisabled")}
                                            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none font-bold disabled:bg-gray-50 disabled:text-gray-400" 
                                            placeholder="10" 
                                        />
                                    </div>
                                    <select 
                                        {...register("type")} 
                                        className="w-28 border border-gray-300 rounded-lg px-2 py-2.5 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none font-medium"
                                    >
                                        <option value="PERCENTAGE">% Percent</option>
                                        <option value="FIXED">$ Fixed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3 mt-2">
                                <input type="checkbox" id="isDisabled" {...register("isDisabled")} className="w-4 h-4 rounded border-gray-400 text-red-600 focus:ring-red-500 cursor-pointer" />
                                <label htmlFor="isDisabled" className="text-xs font-bold text-gray-700 cursor-pointer select-none flex-1">
                                    Disable Commission
                                    <span className="block text-[10px] text-gray-400 font-normal">Affiliates earn 0 commission on this item.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-8 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Rule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}