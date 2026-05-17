// File Location: app/admin/coupons/create/_components/coupon-data-meta.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Wrench, Ban, Minimize2, Link2 } from "lucide-react";
import { CouponFormType } from "../../types";

// Import Individual Tabs
import { TabGeneral } from "./tab-general";
import { TabUsageRestriction } from "./tab-usage-restriction";
import { TabUsageLimits } from "./tab-usage-limits";

interface CouponDataMetaProps {
  formData: CouponFormType;
  setFormData: React.Dispatch<React.SetStateAction<CouponFormType>>;
}

export const CouponDataMeta = ({ formData, setFormData }: CouponDataMetaProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "usage" | "limits" | "affiliate">("general");

  const updateField = (field: keyof CouponFormType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] rounded-[3px]">
      
      {/* WordPress Meta Box Header */}
      <div 
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Coupon data</h2>
        <button type="button" className="text-[#646970]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col md:flex-row min-h-[350px]">
            
            {/* === LEFT SIDEBAR (TABS) === */}
            <div className="w-full md:w-[180px] bg-[#f6f7f7] border-r border-[#c3c4c7] flex flex-col pt-2 shrink-0">
                <button 
                    type="button"
                    onClick={() => setActiveTab("general")}
                    className={`text-left px-4 py-2.5 text-[13px] font-medium border-l-4 transition-colors flex items-center gap-2 ${
                        activeTab === "general" ? "bg-white border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#2c3338] hover:bg-white"
                    }`}
                >
                    <Wrench size={14} className={activeTab === "general" ? "text-[#2271b1]" : "text-[#8c8f94]"}/> General
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("usage")}
                    className={`text-left px-4 py-2.5 text-[13px] font-medium border-l-4 transition-colors flex items-center gap-2 ${
                        activeTab === "usage" ? "bg-white border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#2c3338] hover:bg-white"
                    }`}
                >
                    <Ban size={14} className={activeTab === "usage" ? "text-[#2271b1]" : "text-[#8c8f94]"}/> Usage restriction
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("limits")}
                    className={`text-left px-4 py-2.5 text-[13px] font-medium border-l-4 transition-colors flex items-center gap-2 ${
                        activeTab === "limits" ? "bg-white border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#2c3338] hover:bg-white"
                    }`}
                >
                    <Minimize2 size={14} className={activeTab === "limits" ? "text-[#2271b1]" : "text-[#8c8f94]"}/> Usage limits
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("affiliate")}
                    className={`text-left px-4 py-2.5 text-[13px] font-medium border-l-4 transition-colors flex items-center gap-2 ${
                        activeTab === "affiliate" ? "bg-white border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#2c3338] hover:bg-white"
                    }`}
                >
                    <Link2 size={14} className={activeTab === "affiliate" ? "text-[#2271b1]" : "text-[#8c8f94]"}/> Solid Affiliate
                </button>
            </div>

            {/* === RIGHT PANEL (CONTENT) === */}
            <div className="flex-1 p-5 lg:p-8 bg-white text-[13px] text-[#3c434a]">
                {activeTab === "general" && <TabGeneral formData={formData} updateField={updateField} />}
                {activeTab === "usage" && <TabUsageRestriction formData={formData} updateField={updateField} />}
                {activeTab === "limits" && <TabUsageLimits formData={formData} updateField={updateField} />}
                
                {activeTab === "affiliate" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <p className="text-[#646970] m-0">Assign this coupon to an affiliate so they receive commissions when this code is used.</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                            <label className="sm:w-[160px] font-medium text-[#2c3338]">Affiliate Account</label>
                            <div className="flex-1">
                                <input type="text" placeholder="Search affiliate..." disabled className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] shadow-sm cursor-not-allowed"/>
                                <p className="text-[11px] text-[#a7aaad] mt-1 m-0 italic">Affiliate search logic will be enabled when affiliate module is ready.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};