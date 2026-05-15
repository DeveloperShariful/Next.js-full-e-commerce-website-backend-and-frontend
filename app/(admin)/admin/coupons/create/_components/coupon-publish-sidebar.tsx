// File Location: app/admin/coupons/create/_components/coupon-publish-sidebar.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { CouponFormType } from "../../types"; // ✅ Correctly importing from the central types file

interface CouponPublishSidebarProps {
  formData: CouponFormType;
  setFormData: React.Dispatch<React.SetStateAction<CouponFormType>>;
  handleSave: (e?: React.FormEvent) => void;
  isPending: boolean;
  isEditMode?: boolean;
}

export const CouponPublishSidebar = ({ 
    formData, 
    setFormData, 
    handleSave, 
    isPending,
    isEditMode = false 
}: CouponPublishSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] rounded-[3px]">
        
        {/* Meta Box Header */}
        <div 
            className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Publish</h2>
            <button type="button" className="text-[#646970] hover:text-[#1d2327]">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        </div>

        {/* Content */}
        {isOpen && (
            <div className="p-3">
                <div className="space-y-4 mb-4">
                    
                    {/* Status Info */}
                    <div className="flex items-center gap-2 text-[13px] text-[#3c434a]">
                        <span className="font-semibold text-[#646970]">Status:</span>
                        <select
                            value={formData.isActive ? "active" : "draft"}
                            onChange={(e) => setFormData({...formData, isActive: e.target.value === "active"})}
                            disabled={isPending}
                            className="h-[26px] px-1 border border-[#8c8f94] bg-white text-[12px] rounded-[3px] outline-none focus:border-[#2271b1] shadow-sm cursor-pointer"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active (Published)</option>
                        </select>
                    </div>

                    {/* Expiry Info Display */}
                    <div className="flex items-center gap-2 text-[13px] text-[#3c434a]">
                        <span className="font-semibold text-[#646970]">Expires:</span>
                        <span className="font-medium text-[#2271b1]">
                            {formData.endDate ? formData.endDate : "Never expires"}
                        </span>
                    </div>

                </div>

                {/* Footer Actions (WooCommerce Publish Box Style) */}
                <div className="pt-3 border-t border-[#f0f0f1] flex justify-between items-center bg-[#f6f7f7] -mx-3 -mb-3 px-3 py-2">
                    
                    {/* Trash Button (Only visible in edit mode) */}
                    {isEditMode ? (
                        <button 
                            type="button" 
                            disabled={isPending}
                            className="text-[13px] text-[#d63638] hover:text-[#d63638] hover:underline disabled:opacity-50 font-medium transition-colors"
                        >
                            Move to Trash
                        </button>
                    ) : (
                        <div></div> // Empty div to push Publish button to the right
                    )}
                    
                    {/* Save / Update Button */}
                    <button 
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-[#2271b1] text-white hover:bg-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm min-w-[80px]"
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : (isEditMode ? "Update" : "Publish")}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};