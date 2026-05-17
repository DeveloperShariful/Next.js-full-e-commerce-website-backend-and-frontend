// File Location: app/admin/coupons/create/_components/tab-usage-limits.tsx

"use client";

import { HelpCircle } from "lucide-react";
import { CouponFormType } from "../../types";

interface TabUsageLimitsProps {
  formData: CouponFormType;
  updateField: (field: keyof CouponFormType, value: any) => void;
}

export const TabUsageLimits = ({ formData, updateField }: TabUsageLimitsProps) => {
  
  const TooltipHelp = ({ text }: { text: string }) => (
    <span className="text-[#a7aaad] hover:text-[#3c434a] cursor-help shrink-0" title={text}>
        <HelpCircle size={14} />
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Usage limit per coupon</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="number" 
                    value={formData.usageLimit}
                    onChange={(e) => updateField("usageLimit", parseInt(e.target.value) || "")}
                    placeholder="Unlimited usage"
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="How many times this coupon can be used before it is void." />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-t border-[#f0f0f1] pt-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Usage limit per user</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="number" 
                    value={formData.usagePerUser}
                    onChange={(e) => updateField("usagePerUser", parseInt(e.target.value) || "")}
                    placeholder="Unlimited usage"
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="How many times this coupon can be used by an individual user (calculated via billing email)." />
            </div>
        </div>

    </div>
  );
};