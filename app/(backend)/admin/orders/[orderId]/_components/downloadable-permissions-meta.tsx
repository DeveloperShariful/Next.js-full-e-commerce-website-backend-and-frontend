// File Location: app/admin/orders/[orderId]/_components/downloadable-permissions-meta.tsx

"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Loader2, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { searchDownloadableProducts } from "@/app/actions/backend/order/search-downloadable";
import { updateOrderMetadata } from "@/app/actions/backend/order/order-meta-actions";

import { OrderMetaBase } from "../types";

interface DownloadablePermissionsMetaProps {
  order: OrderMetaBase;
}

export const DownloadablePermissionsMeta = ({ order }: DownloadablePermissionsMetaProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);

  interface DownloadablePermission { id: string; name: string; grantedAt: string; }

  const metadataObj = typeof order.metadata === 'object' && order.metadata !== null
    ? (order.metadata as Record<string, unknown>)
    : {};

  const rawPerms = metadataObj.downloadable_permissions;
  const currentPermissions: DownloadablePermission[] = Array.isArray(rawPerms)
    ? (rawPerms as DownloadablePermission[])
    : [];

  // --- Search Handler ---
  const handleSearch = async (val: string) => {
    setQuery(val);
    setSelectedProduct(null); 

    if (val.length > 2) {
      setSearching(true);
      try {
          const results = await searchDownloadableProducts(val);
          setSuggestions(results);
      } catch(err) {
          console.error(err);
      } finally {
          setSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  // --- Grant Access Handler ---
  const handleGrantAccess = () => {
    if (!selectedProduct) return toast.error("Please select a product first.");

    const alreadyExists = currentPermissions.find((p) => p.id === selectedProduct.id);
    if (alreadyExists) return toast.error("Access already granted for this product.");

    const newPermissions = [...currentPermissions, { id: selectedProduct.id, name: selectedProduct.name, grantedAt: new Date().toISOString() }];

    startTransition(async () => {
      const res = await updateOrderMetadata(order.id, "downloadable_permissions", newPermissions);
      if (res.success) {
        toast.success("Access granted.");
        setQuery("");
        setSelectedProduct(null);
        setSuggestions([]);
      } else {
        toast.error(res.error || "Failed to grant access.");
      }
    });
  };

  // --- Revoke Access Handler ---
  const handleRevokeAccess = (productId: string) => {
    if (!confirm("Are you sure you want to revoke access?")) return;

    const newPermissions = currentPermissions.filter((p) => p.id !== productId);

    startTransition(async () => {
      const res = await updateOrderMetadata(order.id, "downloadable_permissions", newPermissions);
      if (res.success) toast.success("Access revoked.");
      else toast.error(res.error || "Failed to revoke access.");
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5">
      
      {/* Meta Box Header */}
      <div 
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Downloadable product permissions</h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Meta Box Content */}
      {isOpen && (
        <div className="p-4 bg-white">
            
            {/* List of Granted Products */}
            {currentPermissions.length > 0 && (
                <div className="mb-4 bg-[#f6f7f7] border border-[#e2e4e7] rounded-[3px]">
                    {currentPermissions.map((perm) => (
                        <div key={perm.id} className="p-3 border-b border-[#e2e4e7] last:border-0 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[13px] text-[#2271b1] font-medium">
                                <Package size={14} className="text-[#646970]"/>
                                {perm.name}
                            </div>
                            <button 
                                onClick={() => handleRevokeAccess(perm.id)}
                                disabled={isPending}
                                className="text-[#d63638] hover:underline text-[12px] disabled:opacity-50 flex items-center gap-1"
                            >
                                <Trash2 size={12}/> Revoke Access
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Grant Access Form */}
            <div className="flex items-start gap-2 relative">
                <div className="relative w-full md:w-[60%]">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search for a downloadable product..."
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                    />
                    {searching && <Loader2 size={14} className="absolute right-2 top-2 animate-spin text-[#2271b1]" />}
                    
                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-[#2271b1] shadow-lg max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                            {suggestions.map((s, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => { setSelectedProduct(s); setQuery(s.name); setSuggestions([]); }}
                                    className="px-3 py-2 text-[13px] text-[#3c434a] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0"
                                >
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleGrantAccess}
                    disabled={isPending || !selectedProduct}
                    className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center shrink-0"
                >
                    {isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Grant access
                </button>
            </div>
            
        </div>
      )}
    </div>
  );
};