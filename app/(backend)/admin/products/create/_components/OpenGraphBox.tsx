// app/admin/products/create/_components/OpenGraphBox.tsx
// 🚀 Open Graph (Facebook / LinkedIn / WhatsApp) — SeoBox.tsx থেকে আলাদা করা,
// নিজস্ব collapsible header সহ। Effective-value pattern SeoBox-এর মতোই: খালি
// রাখলে auto (Meta Title/Description থেকে) দেখায়, এডিট করলে সেটাই সেভ হয়।
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Image as ImageIcon, RefreshCw, X, ImagePlus, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { ProductFormData } from "../types";
import MediaPickerModal from "@/app/(backend)/admin/media/_components/MediaPickerModal";

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

export default function OpenGraphBox() {
  const { watch, setValue } = useFormContext<ProductFormData>();

  const [isExpanded, setIsExpanded] = useState(false);
  const [openOgMedia, setOpenOgMedia] = useState(false);

  const name = watch("name") || "";
  const shortDescription = watch("shortDescription") || "";
  const description = watch("description") || "";
  const featuredImage = watch("featuredImage") || "";

  const metaTitleRaw = watch("metaTitle") || "";
  const metaDescRaw = watch("metaDesc") || "";
  const ogTitleRaw = watch("seoSchema.ogTitle") || "";
  const ogDescRaw = watch("seoSchema.ogDescription") || "";
  const ogImageRaw = watch("seoSchema.ogImage") || "";

  // ── SeoBox.tsx-এর সাথে হুবহু একই auto-title/desc সূত্র (fallback chain মেলানোর জন্য) ──
  const autoTitle = name ? `${name} | GoBike Australia` : "Product Name | GoBike Australia";
  const plainAutoDesc = stripHtml(shortDescription || description).slice(0, 155);
  const autoDesc = plainAutoDesc
    ? `${plainAutoDesc} Backed by GoBike's Australia-wide shipping and 1-year local warranty.`
    : "Product description will appear here…";
  const effTitle = metaTitleRaw || autoTitle;
  const effDesc = metaDescRaw || autoDesc;

  const effOgTitle = ogTitleRaw || effTitle;
  const effOgDesc = ogDescRaw || effDesc;
  const effOgImage = ogImageRaw || featuredImage || "";

  const handleOgImageSelect = (items: { url: string }[]) => {
    if (!items.length) return;
    setValue("seoSchema.ogImage", items[0].url, { shouldDirty: true });
  };

  const labelClass = "flex items-center justify-between text-[13px] font-semibold text-[#1d2327] mb-1";
  const inputClass = "w-full px-3 py-2 text-[13px] border border-[#8c8f94] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]";
  const autoTag = (isAuto: boolean) =>
    isAuto ? (
      <span className="text-[10px] font-normal normal-case text-[#8c8f94] bg-[#f0f0f1] px-1.5 py-0.5 rounded">auto — edit to override</span>
    ) : (
      <span className="text-[10px] font-normal normal-case text-[#2271b1] bg-[#eaf3fb] px-1.5 py-0.5 rounded">custom</span>
    );

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px] mt-5">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
      >
        <ImageIcon size={15} className="text-[#8c8f94]" />
        <span className="font-semibold text-[#1d2327] text-[14px]">Open Graph (Facebook / LinkedIn / WhatsApp)</span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94] ml-auto" /> : <ChevronDown size={16} className="text-[#8c8f94] ml-auto" />}
      </div>

      {isExpanded && (
      <div className="p-4 space-y-4">
        <div>
          <label className={labelClass}>
            <span>OG Image</span>
            {autoTag(!ogImageRaw)}
          </label>
          {effOgImage ? (
            <div className="flex flex-col gap-2">
              <div className="relative w-[150px] h-[150px] bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden shrink-0">
                <Image src={effOgImage} alt="OG Preview" fill className="object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setOpenOgMedia(true)} className="text-[12px] text-[#2271b1] hover:underline flex items-center gap-1">
                  <RefreshCw size={12} /> {ogImageRaw ? "Change image" : "Use a different image"}
                </button>
                {ogImageRaw && (
                  <>
                    <span className="text-[#c3c4c7]">|</span>
                    <button type="button" onClick={() => setValue("seoSchema.ogImage", "", { shouldDirty: true })} className="text-[12px] text-[#d63638] hover:underline flex items-center gap-1">
                      <X size={12} /> Remove (revert to featured image)
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setOpenOgMedia(true)} className="text-[13px] text-[#2271b1] hover:underline flex items-center gap-1.5">
              <ImagePlus size={16} /> Set OpenGraph Image (no image yet — Featured Image is also empty)
            </button>
          )}
          <p className="text-[11px] text-[#646970] mt-2">Recommended size: 1200 × 630 pixels.</p>
        </div>

        <div>
          <label className={labelClass}>
            <span>OG Title</span>
            {autoTag(!ogTitleRaw)}
          </label>
          <input
            type="text"
            value={effOgTitle}
            onChange={(e) => setValue("seoSchema.ogTitle", e.target.value, { shouldDirty: true })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span>OG Description</span>
            {autoTag(!ogDescRaw)}
          </label>
          <textarea
            value={effOgDesc}
            onChange={(e) => setValue("seoSchema.ogDescription", e.target.value, { shouldDirty: true })}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
      )}

      <MediaPickerModal
        open={openOgMedia}
        onClose={() => setOpenOgMedia(false)}
        onSelect={handleOgImageSelect}
        title="Select SEO OG Image"
      />
    </div>
  );
}
