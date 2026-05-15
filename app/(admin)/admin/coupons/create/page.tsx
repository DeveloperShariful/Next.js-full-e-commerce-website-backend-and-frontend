// File Location: app/admin/coupons/create/page.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

// --- Server Action ---
import { saveCoupon } from "@/app/actions/admin/coupon/coupon";

// --- Components & Types ---
import { CouponPublishSidebar } from "./_components/coupon-publish-sidebar";
import { CouponDataMeta } from "./_components/coupon-data-meta";
import { CouponFormType } from "../types"; 

export default function CreateCouponPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ==========================================
  // CENTRALIZED COUPON FORM STATE
  // ==========================================
  const [formData, setFormData] = useState<CouponFormType>({
    code: "",
    description: "",
    type: "FIXED_CART", 
    value: "",
    allowFreeShipping: false,
    endDate: "",
    
    // Usage Restriction
    minSpend: "",
    maxSpend: "",
    individualUse: false,
    excludeSaleItems: false,
    productIds: [],
    excludeProductIds: [],
    categoryIds: [],
    excludeCategoryIds: [],
    allowedEmails: "",
    
    // Usage Limits
    usageLimit: "",
    usagePerUser: "",
    
    // Status
    isActive: true, 
  });

  // ==========================================
  // HANDLERS
  // ==========================================
  
  // WooCommerce style Generate Random Code
  const generateCouponCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData(prev => ({ ...prev, code }));
  };

  // ✅ FIXED: Save / Publish Handler
  const handleSave = () => {
    // Basic Validations
    if (!formData.code || formData.code.trim() === "") {
        return toast.error("Coupon code is required.");
    }
    
    const numericValue = Number(formData.value);
    if (isNaN(numericValue) || formData.value === "") {
        return toast.error("Valid coupon amount is required.");
    }

    // ✅ Prepare Payload properly for Server Action
    const payload = new FormData();
    payload.append("code", formData.code.trim());
    payload.append("type", formData.type);
    payload.append("value", String(numericValue));
    payload.append("description", formData.description);
    payload.append("isActive", String(formData.isActive));
    
    if (formData.endDate) payload.append("endDate", formData.endDate);
    if (formData.minSpend !== "") payload.append("minSpend", String(formData.minSpend));
    if (formData.usageLimit !== "") payload.append("usageLimit", String(formData.usageLimit));

    // Note: To save complex arrays (productIds, categories) into your DB, 
    // your server action `saveCoupon` needs to be updated to parse JSON from FormData.
    // For now, we pass the basic fields to ensure creation works.

    startTransition(async () => {
        try {
            const res = await saveCoupon(payload);
            if (res.success) {
                toast.success(res.message);
                router.push("/admin/coupons");
            } else {
                toast.error(res.error || "Failed to save coupon.");
            }
        } catch (error) {
            toast.error("Critical error while saving coupon.");
        }
    });
  };

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link 
            href="/admin/coupons" 
            className="border border-[#8c8f94] bg-white hover:bg-[#f6f7f7] text-[#3c434a] transition-colors p-1.5 rounded-[3px] shadow-sm"
            title="Back to Coupons"
        >
            <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-none">
            Add new coupon
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        
        {/* === LEFT COLUMN === */}
        <div className="w-full lg:w-[70%] xl:w-[75%] space-y-5">
          
          <div className="bg-transparent border-0 space-y-3">
              <div className="flex flex-col items-start gap-2">
                  <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "")})}
                      placeholder="Coupon code"
                      disabled={isPending}
                      className="w-full max-w-[500px] h-[40px] px-3 border border-[#8c8f94] bg-white text-[#32373c] text-[16px] font-mono outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px] shadow-sm uppercase placeholder:normal-case placeholder:font-sans"
                  />
                  <button 
                      type="button" 
                      onClick={generateCouponCode}
                      disabled={isPending}
                      className="text-[#2271b1] hover:text-[#135e96] border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] h-[28px] px-3 text-[12px] rounded-[3px] font-medium transition-colors disabled:opacity-50 shadow-sm"
                  >
                      Generate coupon code
                  </button>
              </div>

              <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description (optional)"
                  disabled={isPending}
                  className="w-full h-[80px] p-3 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px] shadow-sm resize-y"
              ></textarea>
          </div>

          <CouponDataMeta formData={formData} setFormData={setFormData} />

        </div>

        {/* === RIGHT COLUMN === */}
        <div className="w-full lg:w-[30%] xl:w-[25%] space-y-5">
            
            <CouponPublishSidebar 
                formData={formData} 
                setFormData={setFormData} 
                handleSave={handleSave}
                isPending={isPending}
                isEditMode={false} 
            />

        </div>
      </div>
    </div>
  );
}