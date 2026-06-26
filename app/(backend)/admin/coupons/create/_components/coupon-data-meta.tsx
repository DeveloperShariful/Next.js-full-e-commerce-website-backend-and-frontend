// File Location: app/(backend)/admin/coupons/create/_components/coupon-data-meta.tsx

"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Wrench, Ban, Minimize2, Link2 } from "lucide-react";
import { CouponFormType } from "../../types";

import { TabGeneral } from "./tab-general";
import { TabUsageRestriction } from "./tab-usage-restriction";
import { TabUsageLimits } from "./tab-usage-limits";
import { TabAffiliate } from "./tab-affiliate";

type ActiveTab = "general" | "usage" | "limits" | "affiliate";

interface CouponDataMetaProps {
  formData: CouponFormType;
  setFormData: React.Dispatch<React.SetStateAction<CouponFormType>>;
  affiliateEnabled: boolean;
}

export const CouponDataMeta = ({ formData, setFormData, affiliateEnabled }: CouponDataMetaProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");

  // If affiliate module gets disabled while affiliate tab is active, go back to general
  useEffect(() => {
    if (!affiliateEnabled && activeTab === "affiliate") {
      setActiveTab("general");
    }
  }, [affiliateEnabled, activeTab]);

  const updateField = (field: keyof CouponFormType, value: CouponFormType[keyof CouponFormType]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const tabClass = (tab: ActiveTab) =>
    `text-left px-4 py-2.5 text-[13px] font-medium border-l-4 transition-colors flex items-center gap-2 ${
      activeTab === tab
        ? "bg-white border-[#2271b1] text-[#1d2327]"
        : "border-transparent text-[#2c3338] hover:bg-white"
    }`;

  const iconClass = (tab: ActiveTab) => (activeTab === tab ? "text-[#2271b1]" : "text-[#8c8f94]");

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] rounded-[3px]">

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
            <button type="button" onClick={() => setActiveTab("general")} className={tabClass("general")}>
              <Wrench size={14} className={iconClass("general")} /> General
            </button>
            <button type="button" onClick={() => setActiveTab("usage")} className={tabClass("usage")}>
              <Ban size={14} className={iconClass("usage")} /> Usage restriction
            </button>
            <button type="button" onClick={() => setActiveTab("limits")} className={tabClass("limits")}>
              <Minimize2 size={14} className={iconClass("limits")} /> Usage limits
            </button>
            {affiliateEnabled && (
              <button type="button" onClick={() => setActiveTab("affiliate")} className={tabClass("affiliate")}>
                <Link2 size={14} className={iconClass("affiliate")} /> Affiliate
              </button>
            )}
          </div>

          {/* === RIGHT PANEL (CONTENT) === */}
          <div className="flex-1 p-5 lg:p-8 bg-white text-[13px] text-[#3c434a]">
            {activeTab === "general" && <TabGeneral formData={formData} updateField={updateField} />}
            {activeTab === "usage" && <TabUsageRestriction formData={formData} updateField={updateField} />}
            {activeTab === "limits" && <TabUsageLimits formData={formData} updateField={updateField} />}
            {activeTab === "affiliate" && affiliateEnabled && (
              <TabAffiliate formData={formData} updateField={updateField} />
            )}
          </div>

        </div>
      )}
    </div>
  );
};
