// File Location: app/admin/coupons/_components/coupons-table.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { deleteCoupons, restoreCoupons, hardDeleteCoupons } from "@/app/actions/backend/coupon/coupon";
import { useGlobalStore } from "@/app/providers/global-store-provider";

// ✅ STRICT TYPES IMPORT
import { CouponType } from "../types";

interface CouponsTableProps {
  coupons: CouponType[];
  isTrashMode: boolean; // ✅ NEW: Identifies if current view is Trash
}

export const CouponsTable = ({ coupons, isTrashMode }: CouponsTableProps) => {
  const router = useRouter();
  const { formatPrice } = useGlobalStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bulkAction, setBulkAction] = useState<string>("");

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(cid => cid !== id));
    else setSelectedIds(prev => [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === coupons.length) setSelectedIds([]);
    else setSelectedIds(coupons.map(c => c.id));
  };

  // --- HANDLER: BULK ACTIONS ---
  const handleApplyBulkAction = () => {
    if (!bulkAction) return toast.error("Please select a bulk action.");
    if (selectedIds.length === 0) return toast.error("Please select at least one coupon.");

    startTransition(async () => {
        try {
            let res;
            if (bulkAction === "trash") {
                if (!confirm("Move selected coupons to trash?")) return;
                res = await deleteCoupons(selectedIds);
            } 
            else if (bulkAction === "restore") {
                res = await restoreCoupons(selectedIds);
            } 
            else if (bulkAction === "delete_permanently") {
                if (!confirm("Permanently delete selected coupons? This cannot be undone.")) return;
                res = await hardDeleteCoupons(selectedIds);
            }

            if (res?.success) {
                toast.success(res.message);
                setSelectedIds([]);
                setBulkAction("");
                router.refresh();
            } else {
                toast.error(res?.error || "Action failed.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        }
    });
  };

  // --- HANDLER: SINGLE ROW ACTIONS ---
  const handleSingleAction = (id: string, action: 'trash' | 'restore' | 'delete') => {
      startTransition(async () => {
          try {
              let res;
              if (action === 'trash') {
                  res = await deleteCoupons([id]);
              } else if (action === 'restore') {
                  res = await restoreCoupons([id]);
              } else if (action === 'delete') {
                  if (!confirm("Permanently delete this coupon?")) return;
                  res = await hardDeleteCoupons([id]);
              }

              if (res?.success) {
                  toast.success(res.message);
                  router.refresh();
              } else {
                  toast.error(res?.error || "Action failed.");
              }
          } catch (error) {
              toast.error("Something went wrong.");
          }
      });
  };

  // --- Formatting Helpers ---
  const formatType = (type: string) => {
      switch (type) {
          case 'PERCENTAGE': return 'Percentage discount';
          case 'FIXED_CART': return 'Fixed cart discount';
          case 'FIXED_PRODUCT': return 'Fixed product discount';
          case 'FREE_SHIPPING': return 'Free shipping';
          default: return type.replace(/_/g, ' ').toLowerCase();
      }
  };

  const formatAmount = (type: string, value: number) => {
      if (type === 'PERCENTAGE') return `${value}%`;
      if (type === 'FREE_SHIPPING') return 'N/A';
      return formatPrice(value);
  };

  return (
    <div className={`transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        
        {/* Top Bulk Actions Bar */}
        <div className="flex items-center gap-1 mb-2">
            <select 
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm min-w-[150px]"
            >
                <option value="">Bulk actions</option>
                {isTrashMode ? (
                    <>
                        <option value="restore">Restore</option>
                        <option value="delete_permanently">Delete permanently</option>
                    </>
                ) : (
                    <option value="trash">Move to Trash</option>
                )}
            </select>
            <button 
                onClick={handleApplyBulkAction}
                disabled={isPending}
                className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
                {isPending && bulkAction ? <Loader2 size={14} className="animate-spin"/> : null}
                Apply
            </button>
        </div>

        {/* The Classic WP Table */}
        <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr className="border-b border-[#c3c4c7]">
                        <th className="w-[2.2em] py-2 px-2 text-center font-normal">
                            <input 
                                type="checkbox" 
                                className="border-[#8c8f94] mt-1"
                                checked={selectedIds.length === coupons.length && coupons.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Code</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Coupon type</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Coupon amount</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] min-w-[200px]">Description</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Product IDs</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Usage / Limit</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Expiry date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                    {coupons.length === 0 ? (
                        <tr><td colSpan={8} className="py-4 px-3 text-center text-[#646970]">No coupons found.</td></tr>
                    ) : (
                        coupons.map((coupon) => (
                            <tr key={coupon.id} className={`hover:bg-[#f6f7f7] group ${selectedIds.includes(coupon.id) ? 'bg-[#ffffea]' : ''}`}>
                                <td className="py-3 px-2 text-center align-top">
                                    <input 
                                        type="checkbox" 
                                        className="border-[#8c8f94] mt-1"
                                        checked={selectedIds.includes(coupon.id)}
                                        onChange={() => toggleSelect(coupon.id)}
                                    />
                                </td>
                                
                                <td className="py-3 px-3 align-top min-w-[150px]">
                                    {isTrashMode ? (
                                        <span className="font-bold text-[#646970] font-mono">
                                            {coupon.code}
                                        </span>
                                    ) : (
                                        <Link href={`/admin/coupons/${coupon.id}`} className="font-bold text-[#2271b1] hover:text-[#135e96] hover:underline font-mono">
                                            {coupon.code}
                                        </Link>
                                    )}
                                    
                                    {!coupon.isActive && !isTrashMode && (
                                        <span className="ml-2 text-[10px] text-[#646970] font-bold">— Draft</span>
                                    )}
                                    
                                    {/* WP Style Row Actions (Visible on Hover) */}
                                    <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2">
                                        {isTrashMode ? (
                                            <>
                                                <button onClick={() => handleSingleAction(coupon.id, 'restore')} className="text-[#2271b1] hover:underline">Restore</button>
                                                <span className="text-[#c3c4c7]">|</span>
                                                <button onClick={() => handleSingleAction(coupon.id, 'delete')} className="text-[#d63638] hover:underline">Delete permanently</button>
                                            </>
                                        ) : (
                                            <>
                                                <Link href={`/admin/coupons/${coupon.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                                                <span className="text-[#c3c4c7]">|</span>
                                                <button onClick={() => handleSingleAction(coupon.id, 'trash')} className="text-[#d63638] hover:underline">Trash</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                                
                                <td className="py-3 px-3 align-top text-[#3c434a] capitalize">
                                    {formatType(coupon.type)}
                                </td>
                                
                                <td className="py-3 px-3 align-top text-[#3c434a]">
                                    {formatAmount(coupon.type, Number(coupon.value))}
                                </td>

                                <td className="py-3 px-3 align-top text-[#646970] whitespace-normal">
                                    {coupon.description || "—"}
                                    {coupon.affiliateId && (
                                        <span className="block mt-1 text-[11px] text-[#2271b1]">Generated by Affiliate</span>
                                    )}
                                </td>

                                <td className="py-3 px-3 align-top text-[#646970]">
                                    {coupon.productIds?.length > 0 ? coupon.productIds.join(", ") : "—"}
                                </td>
                                
                                <td className="py-3 px-3 align-top text-[#646970]">
                                    {coupon.usedCount} / {coupon.usageLimit || "∞"}
                                </td>

                                <td className="py-3 px-3 align-top text-[#646970]">
                                    {coupon.endDate ? format(new Date(coupon.endDate), "MMM d, yyyy") : "—"}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};