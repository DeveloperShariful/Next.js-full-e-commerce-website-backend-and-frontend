// File Location: app/admin/orders/[orderId]/_components/security-risk.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ShieldAlert, ShieldCheck } from "lucide-react";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType } from "../types";

interface SecuritySidebarProps {
  order: OrderDetailsType;
}

export const SecuritySidebar = ({ order }: SecuritySidebarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Schema properties
  const riskLevel = order.riskLevel?.toLowerCase() || 'low';
  const riskScore = order.riskScore ? Number(order.riskScore) : 0;
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return "text-[#d63638] bg-[#fcf0f1]";
      case 'medium': return "text-[#dba617] bg-[#fcf9e8]";
      default: return "text-[#5b841b] bg-[#e5f5fa]";
    }
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      
      <div 
        className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-1.5">
            {riskLevel === 'high' ? <ShieldAlert size={14} className="text-[#d63638]"/> : <ShieldCheck size={14} className="text-[#5b841b]"/>}
            Fraud Analysis
        </h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-[13px] text-[#3c434a] space-y-3">
            
            <div className={`p-2 rounded-[3px] border ${getRiskColor(riskLevel)} flex justify-between items-center`}>
                <span className="font-semibold capitalize">{riskLevel} Risk</span>
                {riskScore > 0 && <span className="font-mono text-[11px] px-1.5 bg-white rounded border opacity-80">{riskScore}/100</span>}
            </div>

            <div className="space-y-1">
                <p className="m-0 text-[#646970] font-medium text-[12px]">IP Address:</p>
                <p className="m-0 font-mono text-[12px] bg-[#f6f7f7] p-1 border border-[#e2e4e7] rounded-[3px] break-all">
                    {order.ipAddress || "Not recorded"}
                </p>
            </div>

            {order.userAgent && (
                <div className="space-y-1">
                    <p className="m-0 text-[#646970] font-medium text-[12px]">User Agent:</p>
                    <p className="m-0 text-[11px] bg-[#f6f7f7] p-1 border border-[#e2e4e7] rounded-[3px] text-[#646970] break-words line-clamp-3" title={order.userAgent}>
                        {order.userAgent}
                    </p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};