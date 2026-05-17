// File Location: app/admin/orders/create/_components/create-attribution-sidebar.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export const CreateAttributionSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div 
        className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Order attribution</h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-[13px] text-[#3c434a] space-y-2">
            <div>
                <span className="block text-[12px] font-semibold text-[#646970]">Origin</span>
                <span className="text-[#1d2327]">Unknown (Manual Order)</span>
            </div>
            <div>
                <span className="block text-[12px] font-semibold text-[#646970]">Created via</span>
                <span className="text-[#1d2327]">Admin Dashboard</span>
            </div>
        </div>
      )}
    </div>
  );
};