// app/(backend)/admin/products/create/_components/Facebook.tsx

"use client";

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";

export default function Facebook() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();

  const facebookImageType = watch("facebookImageType") || "PRODUCT_IMAGE";
  const facebookSyncMode  = watch("facebookSyncMode")  || "SYNC_AND_SHOW";

  const labelClass    = "w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] py-2 md:py-0 shrink-0";
  const inputClass    = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] transition-shadow";
  const selectClass   = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none rounded-[3px] cursor-pointer";
  const formRowClass  = "flex flex-col md:flex-row md:items-start py-4 border-b border-[#f0f0f1] last:border-b-0";

  return (
    <div className="p-2 space-y-1 animate-in fade-in duration-300">

      {/* Header */}
      <div className="pb-3 border-b border-[#c3c4c7] mb-4">
        <h4 className="text-[14px] font-semibold text-[#1d2327] m-0">Facebook / Meta Catalog</h4>
        <p className="text-[11px] text-[#646970] m-0 mt-1">
          Configure product data for Facebook &amp; Instagram Shopping feed synchronization.
        </p>
      </div>

      {/* Facebook Sync */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Facebook Sync</label>
        <div className="w-full md:max-w-[400px]">
          <select
            value={facebookSyncMode}
            onChange={e => setValue("facebookSyncMode", e.target.value, { shouldDirty: true })}
            className={selectClass}
          >
            <option value="SYNC_AND_SHOW">Sync and show in catalog</option>
            <option value="SYNC_ONLY">Sync only (hidden in catalog)</option>
            <option value="EXCLUDED">Do not sync</option>
          </select>
          <p className="text-[11px] text-[#646970] mt-1">
            Controls whether this product appears in your Facebook &amp; Instagram Shopping catalog.
          </p>
        </div>
      </div>

      {/* Facebook Description */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Facebook Description</label>
        <div className="w-full md:max-w-[400px]">
          <textarea
            {...register("facebookDescription")}
            rows={4}
            placeholder="Override product description for Facebook catalog (optional)"
            className={`${inputClass} resize-y py-2`}
          />
          <p className="text-[11px] text-[#646970] mt-1">
            Leave blank to use the default product description.
          </p>
        </div>
      </div>

      {/* Facebook Product Image */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Facebook Product Image</label>
        <div className="w-full md:max-w-[400px] space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="PRODUCT_IMAGE"
              checked={facebookImageType === "PRODUCT_IMAGE"}
              onChange={() => setValue("facebookImageType", "PRODUCT_IMAGE", { shouldDirty: true })}
              className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]"
            />
            <span className="text-[13px] text-[#2c3338]">Use product image</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="CUSTOM"
              checked={facebookImageType === "CUSTOM"}
              onChange={() => setValue("facebookImageType", "CUSTOM", { shouldDirty: true })}
              className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]"
            />
            <span className="text-[13px] text-[#2c3338]">Use custom image</span>
          </label>
        </div>
      </div>

      {/* Facebook Price */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Facebook Price (A$)</label>
        <div className="w-full md:max-w-[400px]">
          <input
            type="number"
            step="0.01"
            min="0"
            {...register("facebookPrice")}
            placeholder="Leave blank to use product price"
            className={inputClass}
          />
          <p className="text-[11px] text-[#646970] mt-1">
            Optional price override for Facebook catalog only.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="py-2 border-b border-[#c3c4c7]">
        <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wider">Product Attributes for Feed</p>
        <p className="text-[11px] text-[#646970] mt-0.5">
          These fields improve ad performance. Updates here may be overwritten by WooCommerce attributes.
        </p>
      </div>

      {/* MPN */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Manufacturer Part Number (MPN)</label>
        <input type="text" placeholder="e.g. MPN-123456" {...register("mpn")} className={inputClass} />
      </div>

      {/* Brand */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Brand</label>
        <input type="text" placeholder="e.g. GoBike" {...register("vendor")} className={inputClass} />
      </div>

      {/* Condition */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Condition</label>
        <select {...register("condition")} className={selectClass}>
          <option value="NEW">New</option>
          <option value="REFURBISHED">Refurbished</option>
          <option value="USED">Used</option>
        </select>
      </div>

      {/* Size */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Size</label>
        <input type="text" placeholder="e.g. XL, 16 Inch, One Size" {...register("size")} className={inputClass} />
      </div>

      {/* Color */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Color</label>
        <input type="text" placeholder="e.g. Red, Matte Black" {...register("color")} className={inputClass} />
      </div>

      {/* Age Group */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Age Group</label>
        <select {...register("ageGroup")} className={selectClass}>
          <option value="">Default (Unspecified)</option>
          <option value="adult">Adult</option>
          <option value="teen">Teen</option>
          <option value="kids">Kids</option>
          <option value="toddler">Toddler</option>
          <option value="infant">Infant</option>
          <option value="newborn">Newborn</option>
        </select>
      </div>

      {/* Gender */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Gender</label>
        <select {...register("gender")} className={selectClass}>
          <option value="">Default (Unspecified)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>

      {/* Material */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Material</label>
        <input type="text" placeholder="e.g. Carbon Fiber, Aluminum" {...register("material")} className={inputClass} />
      </div>

      {/* Pattern */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Pattern</label>
        <input type="text" placeholder="e.g. Striped, Solid" {...register("pattern")} className={inputClass} />
      </div>

      {/* Google Product Category (shared) */}
      <div className={formRowClass}>
        <label className={labelClass + " md:pt-1.5"}>Google Product Category</label>
        <div className="w-full md:max-w-[400px]">
          <input
            type="text"
            {...register("googleProductCategory")}
            placeholder="e.g. 3618 - Sporting Goods > Cycling"
            className={inputClass}
          />
          <p className="text-[11px] text-[#646970] mt-1">
            Shared with Google Shopping. Use the <strong>Merchant Center</strong> tab for autocomplete search.
          </p>
        </div>
      </div>

    </div>
  );
}
