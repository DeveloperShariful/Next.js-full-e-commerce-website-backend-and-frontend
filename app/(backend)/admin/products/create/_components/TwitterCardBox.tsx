// app/admin/products/create/_components/TwitterCardBox.tsx
// 🚀 Twitter / X Card — SeoBox.tsx থেকে আলাদা করা, নিজস্ব collapsible header
// সহ। Fallback chain: Twitter field খালি → OG field → Meta Title/Description
// → auto-generated (SeoBox.tsx-এর মতোই)।
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Twitter, Link as LinkIcon, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { ProductFormData } from "../types";

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

export default function TwitterCardBox() {
  const { watch, setValue } = useFormContext<ProductFormData>();

  const [isExpanded, setIsExpanded] = useState(false);

  const name = watch("name") || "";
  const shortDescription = watch("shortDescription") || "";
  const description = watch("description") || "";
  const featuredImage = watch("featuredImage") || "";

  const metaTitleRaw = watch("metaTitle") || "";
  const metaDescRaw = watch("metaDesc") || "";
  const ogTitleRaw = watch("seoSchema.ogTitle") || "";
  const ogDescRaw = watch("seoSchema.ogDescription") || "";
  const ogImageRaw = watch("seoSchema.ogImage") || "";
  const twitterTitleRaw = watch("twitterTitle") || "";
  const twitterDescRaw = watch("twitterDescription") || "";

  // ── SeoBox.tsx / OpenGraphBox.tsx-এর সাথে হুবহু একই fallback chain ──
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

  const effTwitterTitle = twitterTitleRaw || effOgTitle;
  const effTwitterDesc = twitterDescRaw || effOgDesc;

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
        <Twitter size={15} className="text-[#8c8f94]" />
        <span className="font-semibold text-[#1d2327] text-[14px]">Twitter / X Card</span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94] ml-auto" /> : <ChevronDown size={16} className="text-[#8c8f94] ml-auto" />}
      </div>

      {isExpanded && (
      <div className="p-4 space-y-4">
        <div>
          <label className={labelClass}>
            <span>Twitter Title</span>
            {autoTag(!twitterTitleRaw)}
          </label>
          <input
            type="text"
            value={effTwitterTitle}
            onChange={(e) => setValue("twitterTitle", e.target.value, { shouldDirty: true })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span>Twitter Description</span>
            {autoTag(!twitterDescRaw)}
          </label>
          <textarea
            value={effTwitterDesc}
            onChange={(e) => setValue("twitterDescription", e.target.value, { shouldDirty: true })}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[11px] text-[#646970] flex items-center gap-1.5">
            <LinkIcon size={12} /> Twitter Image — uses the OG Image above, no separate upload needed.
          </p>
          {effOgImage && (
            <div className="relative w-8 h-8 bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden shrink-0">
              <Image src={effOgImage} alt="Twitter image preview" fill className="object-cover" />
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
