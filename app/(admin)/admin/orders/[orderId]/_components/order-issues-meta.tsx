// File Location: app/admin/orders/[orderId]/_components/order-issues-meta.tsx

"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCcw, Settings, CheckCircle } from "lucide-react";
import { ReturnModal } from "./return-modal"; 
import { DisputeModal } from "./dispute-modal"; 
import { useGlobalStore } from "@/app/providers/global-store-provider";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType, OrderDispute, OrderReturn } from "../types";

interface OrderIssuesMetaProps {
  order: OrderDetailsType;
}

export const OrderIssuesMeta = ({ order }: OrderIssuesMetaProps) => {
  const { formatPrice } = useGlobalStore();
  const [selectedReturn, setSelectedReturn] = useState<OrderReturn | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null);

  const disputes: OrderDispute[] = order.disputes || [];
  const returns: OrderReturn[] = order.returns || [];

  return (
    <div className="mb-5 space-y-4">
      
      {/* NO ISSUES STATE */}
      {disputes.length === 0 && returns.length === 0 && (
          <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] px-4 py-3 text-[13px] text-[#5b841b] flex items-center gap-2">
              <CheckCircle size={16} className="text-[#5b841b]" />
              No active return requests or payment disputes for this order.
          </div>
      )}

      {/* DISPUTES SECTION */}
      {disputes.length > 0 && (
        <div className="bg-[#fcf0f1] border-l-4 border-[#d63638] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-4">
            <h3 className="text-[14px] font-bold text-[#d63638] m-0 flex items-center gap-1.5 mb-2">
                <AlertTriangle size={16} /> Payment Dispute Detected
            </h3>
            <p className="text-[12px] text-[#3c434a] mb-3">
                This order has an active chargeback or dispute from the payment gateway. Please review immediately.
            </p>
            
            <div className="space-y-2">
                {disputes.map((dispute: OrderDispute) => (
                    <div key={dispute.id} className="bg-white border border-[#d63638] p-3 rounded-[3px] flex justify-between items-center shadow-sm">
                        <div className="text-[13px] text-[#3c434a]">
                            <span className="font-semibold">Status: </span> 
                            <span className="uppercase font-bold text-[#d63638]">{dispute.status.replace(/_/g, ' ')}</span>
                            <span className="mx-2 text-[#c3c4c7]">|</span>
                            <span className="font-semibold">Amount: </span> 
                            {formatPrice(Number(dispute.amount))}
                        </div>
                        <button 
                            onClick={() => setSelectedDispute(dispute)}
                            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors"
                        >
                            Manage
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* RETURNS SECTION */}
      {returns.length > 0 && (
        <div className="bg-[#fff8e5] border-l-4 border-[#dba617] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-4">
            <h3 className="text-[14px] font-bold text-[#b38511] m-0 flex items-center gap-1.5 mb-2">
                <RefreshCcw size={16} /> Return Requests
            </h3>
            
            <div className="space-y-2">
                {returns.map((ret: OrderReturn) => (
                    <div key={ret.id} className="bg-white border border-[#dba617] p-3 rounded-[3px] flex justify-between items-center shadow-sm">
                        <div className="text-[13px] text-[#3c434a]">
                            <span className="font-semibold">Status: </span> 
                            <span className="uppercase font-bold text-[#b38511]">{ret.status}</span>
                            <span className="mx-2 text-[#c3c4c7]">|</span>
                            <span className="font-semibold">Reason: </span> 
                            {ret.reason}
                        </div>
                        <button 
                            onClick={() => setSelectedReturn(ret)}
                            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors flex items-center gap-1"
                        >
                            <Settings size={12}/> Manage
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {selectedReturn && <ReturnModal isOpen={!!selectedReturn} onClose={() => setSelectedReturn(null)} returnReq={selectedReturn} />}
      {selectedDispute && <DisputeModal isOpen={!!selectedDispute} onClose={() => setSelectedDispute(null)} dispute={selectedDispute} />}

    </div>
  );
};