// File Location: app/admin/coupons/create/_components/tab-general.tsx

"use client";

import { HelpCircle } from "lucide-react";
import { CouponFormType, DiscountTypeEnum } from "../../types";

interface TabGeneralProps {
  formData: CouponFormType;
  updateField: (field: keyof CouponFormType, value: CouponFormType[keyof CouponFormType]) => void;
}

export const TabGeneral = ({ formData, updateField }: TabGeneralProps) => {
  
  const TooltipHelp = ({ text }: { text: string }) => (
    <span className="text-[#a7aaad] hover:text-[#3c434a] cursor-help shrink-0" title={text}>
        <HelpCircle size={14} />
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Discount type</label>
            <div className="flex-1 flex items-center gap-2">
                <select 
                    value={formData.type}
                    onChange={(e) => updateField("type", e.target.value as DiscountTypeEnum)}
                    className="w-full max-w-[400px] h-[30px] px-2 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1] cursor-pointer"
                >
                    <option value="PERCENTAGE">Percentage discount</option>
                    <option value="FIXED_CART">Fixed cart discount</option>
                    <option value="FIXED_PRODUCT">Fixed product discount</option>
                    <option value="FREE_SHIPPING">Free shipping</option>
                </select>
                <TooltipHelp text="Choose what type of discount this coupon applies." />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Coupon amount</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="number" 
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => updateField("value", parseFloat(e.target.value) || "")}
                    placeholder="0"
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="Value of the coupon. Example: 10.00" />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Allow free shipping</label>
            <div className="flex-1 flex items-start gap-2">
                <input 
                    type="checkbox" 
                    checked={formData.allowFreeShipping}
                    onChange={(e) => updateField("allowFreeShipping", e.target.checked)}
                    className="h-[16px] w-[16px] mt-0.5 border-[#8c8f94] rounded-[3px] cursor-pointer"
                />
                <span className="text-[#646970] leading-snug">
                    Check this box if the coupon grants free shipping. A free shipping method must be enabled in your shipping zone.
                </span>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Coupon expiry date</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1] text-[#646970]"
                />
                <TooltipHelp text="The date this coupon will expire at 11:59 PM." />
            </div>
        </div>

    </div>
  );
};