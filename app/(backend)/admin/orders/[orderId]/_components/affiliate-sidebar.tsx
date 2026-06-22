// File Location: app/admin/orders/[orderId]/_components/affiliate-sidebar.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, CheckCircle, AlertTriangle } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";

export const AffiliateSidebar = ({ order }: { order: any }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { formatPrice } = useGlobalStore();

  const isAffiliateOrder = !!order.affiliate;
  // If your schema has specific referral tracking records, you'd map them here. 
  // For now, we display the core affiliate info linked to the order.
  
  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      
      <div 
        className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-1.5">
            {/* Custom SVG Icon like Solid Affiliate */}
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-[#d63638]">
                <polygon points="12 2 2 22 22 22"></polygon>
            </svg>
            Affiliate Tracking
        </h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className={`p-3 text-[13px] ${isAffiliateOrder ? 'bg-[#f6f7f7]' : 'bg-[#f0c36d]/10'}`}>
            
            {isAffiliateOrder ? (
                <div className="space-y-3 text-[#3c434a]">
                    <p className="m-0 flex items-center gap-1.5 font-medium text-[#5b841b]">
                        <CheckCircle size={14} /> Referral recorded successfully.
                    </p>
                    
                    <div className="bg-white border border-[#c3c4c7] p-2 rounded-[3px] shadow-sm">
                        <div className="mb-1">
                            <span className="font-semibold text-[#646970]">Partner:</span>{" "}
                            <a href={`/admin/affiliates/${order.affiliate.id}`} className="text-[#2271b1] hover:underline">
                                {order.affiliate.user?.name || "Unknown"}
                            </a>
                        </div>
                        {order.discount?.affiliateId === order.affiliate.id && (
                            <div className="mb-1">
                                <span className="font-semibold text-[#646970]">Coupon Used:</span>{" "}
                                <span className="font-mono text-[#1d2327]">{order.couponCode}</span>
                            </div>
                        )}
                        <div>
                            <span className="font-semibold text-[#646970]">Rate:</span>{" "}
                            {(() => {
                                const ref = order.referrals?.[0];
                                const type = ref?.commissionType ?? order.affiliate.commissionType;
                                const rate = ref?.commissionRate ?? order.affiliate.commissionRate;
                                if (!rate && rate !== 0) return "—";
                                return type === "PERCENTAGE" ? `${rate}%` : formatPrice(rate);
                            })()}
                        </div>
                        {order.referrals?.[0]?.commissionAmount != null && (
                            <div className="mt-1">
                                <span className="font-semibold text-[#646970]">Commission:</span>{" "}
                                <span className="text-[#5b841b] font-medium">{formatPrice(order.referrals[0].commissionAmount)}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-[#646970] m-0 leading-relaxed italic">
                        Commission logic is processed automatically when the order status is marked as Completed.
                    </p>
                </div>
            ) : (
                <div className="text-[#3c434a] space-y-2">
                    <p className="m-0 font-medium text-[#1d2327]">
                        No referral was created for this order.
                    </p>
                    <div className="text-[12px] text-[#646970] leading-relaxed">
                        These notes were returned:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                            <li>No auto referrals were created for this order.</li>
                            <li>No linked lifetime commissions affiliate found for this customer.</li>
                            <li>No affiliate coupon was associated with this order.</li>
                            <li>No valid tracking cookie was found.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};