// File: app/(backend)/admin/coupons/[id]/_components/edit-coupon-page.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { saveCoupon, deleteCoupons, CouponData } from "@/app/actions/backend/coupon/coupon";
import { CouponPublishSidebar } from "../../create/_components/coupon-publish-sidebar";
import { CouponDataMeta } from "../../create/_components/coupon-data-meta";
import { CouponFormType, DiscountTypeEnum } from "../../types";

interface EditCouponPageProps {
  coupon: CouponData;
  affiliateEnabled: boolean;
}

function mapCouponToForm(coupon: CouponData): CouponFormType {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? "",
    type: coupon.type as DiscountTypeEnum,
    value: coupon.value,
    allowFreeShipping: false,
    endDate: coupon.endDate
      ? new Date(coupon.endDate).toISOString().split("T")[0]
      : "",
    minSpend: coupon.minSpend ?? "",
    maxSpend: coupon.maxSpend ?? "",
    individualUse: false,
    excludeSaleItems: coupon.excludeSaleItems,
    productIds: coupon.productIds ?? [],
    excludeProductIds: [],
    categoryIds: coupon.categoryIds ?? [],
    excludeCategoryIds: [],
    allowedEmails: "",
    usageLimit: coupon.usageLimit ?? "",
    usagePerUser: coupon.usagePerUser ?? "",
    affiliateId: coupon.affiliateId ?? null,
    affiliateCommissionRate: coupon.affiliateCommissionRate ?? "",
    isActive: coupon.isActive,
  };
}

export default function EditCouponPage({ coupon, affiliateEnabled }: EditCouponPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CouponFormType>(mapCouponToForm(coupon));

  const handleSave = () => {
    if (!formData.code || formData.code.trim() === "") {
      return toast.error("Coupon code is required.");
    }
    const numericValue = Number(formData.value);
    if (isNaN(numericValue) || formData.value === "") {
      return toast.error("Valid coupon amount is required.");
    }

    const payload = new FormData();
    payload.append("id", coupon.id);
    payload.append("code", formData.code.trim());
    payload.append("type", formData.type);
    payload.append("value", String(numericValue));
    payload.append("description", formData.description);
    payload.append("isActive", String(formData.isActive));
    if (formData.endDate) payload.append("endDate", formData.endDate);
    if (formData.minSpend !== "") payload.append("minSpend", String(formData.minSpend));
    if (formData.usageLimit !== "") payload.append("usageLimit", String(formData.usageLimit));
    if (formData.affiliateId) payload.append("affiliateId", formData.affiliateId);
    if (formData.affiliateCommissionRate !== "")
      payload.append("affiliateCommissionRate", String(formData.affiliateCommissionRate));

    startTransition(async () => {
      try {
        const res = await saveCoupon(payload);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update coupon.");
        }
      } catch {
        toast.error("Critical error while updating coupon.");
      }
    });
  };

  const handleTrash = () => {
    if (!confirm("Move this coupon to trash?")) return;

    startTransition(async () => {
      try {
        const res = await deleteCoupons([coupon.id]);
        if (res.success) {
          toast.success(res.message);
          router.push("/admin/coupons");
        } else {
          toast.error(res.error || "Failed to trash coupon.");
        }
      } catch {
        toast.error("An error occurred.");
      }
    });
  };

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">

      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/admin/coupons"
          className="border border-[#8c8f94] bg-white hover:bg-[#f6f7f7] text-[#3c434a] transition-colors p-1.5 rounded-[3px] shadow-sm"
          title="Back to Coupons"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-none">Edit coupon</h1>
        <span className="text-[13px] text-[#646970] font-mono bg-white border border-[#c3c4c7] px-2 py-0.5 rounded-[3px]">
          {coupon.code}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">

        <div className="w-full lg:w-[70%] xl:w-[75%] space-y-5">

          <div className="bg-transparent border-0 space-y-3">
            <div className="flex flex-col items-start gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })
                }
                placeholder="Coupon code"
                disabled={isPending}
                className="w-full max-w-[500px] h-[40px] px-3 border border-[#8c8f94] bg-white text-[#32373c] text-[16px] font-mono outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px] shadow-sm uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description (optional)"
              disabled={isPending}
              className="w-full h-[80px] p-3 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px] shadow-sm resize-y"
            />
          </div>

          {/* Usage stats bar */}
          <div className="bg-white border border-[#c3c4c7] px-4 py-3 rounded-[3px] shadow-sm text-[13px] text-[#3c434a] flex flex-wrap gap-6">
            <span>
              <span className="font-semibold text-[#646970]">Used:</span>{" "}
              <span className="font-bold text-[#1d2327]">{coupon.usedCount}</span> times
            </span>
            {coupon.usageLimit && (
              <span>
                <span className="font-semibold text-[#646970]">Limit:</span>{" "}
                <span className="font-bold text-[#1d2327]">{coupon.usageLimit}</span>
              </span>
            )}
            <span>
              <span className="font-semibold text-[#646970]">Created:</span>{" "}
              {new Date(coupon.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <CouponDataMeta
            formData={formData}
            setFormData={setFormData}
            affiliateEnabled={affiliateEnabled}
          />
        </div>

        <div className="w-full lg:w-[30%] xl:w-[25%] space-y-5">
          <CouponPublishSidebar
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            onTrash={handleTrash}
            isPending={isPending}
            isEditMode={true}
          />
        </div>

      </div>
    </div>
  );
}
