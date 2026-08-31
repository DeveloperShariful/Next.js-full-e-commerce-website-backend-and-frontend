// app/admin/products/create/_components/SeoBox.tsx
// 🚀 Basic SEO — Focus Keyword + live analysis, Meta Title/Description,
// Canonical URL, Robots & Indexing, Google Search Preview. Open Graph,
// Twitter/X Card, and the Structured Data preview are separate boxes
// (OpenGraphBox.tsx / TwitterCardBox.tsx / StructuredDataPreview.tsx) —
// each independently collapsible, stacked below this one.
//
// 🚀 প্রতিটা ফিল্ড "effective value" দেখায় — খালি রাখলে placeholder-এ শুধু হিন্ট
// না দেখিয়ে, আসল যে auto-generated মান লাইভ সাইটে ব্যবহার হবে সেটাই বক্সের ভেতরে
// সাধারণ (non-grey) টেক্সট হিসেবে বসানো থাকে। এডিট করলে সেই টাইপ করা মানটাই
// DB-তে সেভ হয়, পুরো ফাঁকা করে দিলে আবার auto মানে ফিরে যায়। কোনো কিছুই
// না-টাইপ করা অবস্থায় DB-তে জোর করে লিখে ফেলা হয় না (ফাঁকা-ই থাকে)।
"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { ProductFormData } from "../types";
import SeoPreview from "@/app/(backend)/admin/_components/SeoPreview";

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

export default function SeoBox() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();

  const [isExpanded, setIsExpanded] = useState(false);

  const name = watch("name") || "";
  const slug = watch("slug") || "";
  const shortDescription = watch("shortDescription") || "";
  const description = watch("description") || "";
  const galleryImages = watch("galleryImages") || [];

  const metaTitleRaw = watch("metaTitle") || "";
  const metaDescRaw = watch("metaDesc") || "";
  const canonicalRaw = watch("seoCanonicalUrl") || "";
  const focusKeyword = watch("focusKeyword") || "";
  const noIndex = watch("noIndex") || false;
  const robots = watch("seoSchema.robots") || "";

  // "No Follow" নিজস্ব কোনো DB column নয় — blog-এর মতোই robots স্ট্রিং-এ এনকোড হয়
  const [noFollow, setNoFollow] = useState(() => robots.includes("nofollow"));

  // ── Auto-generated ভ্যালু, ঠিক যেভাবে product/[slug]/page.tsx-এ কম্পিউট হয় ──
  const autoTitle = name ? `${name} | GoBike Australia` : "Product Name | GoBike Australia";
  const plainAutoDesc = stripHtml(shortDescription || description).slice(0, 155);
  const autoDesc = plainAutoDesc
    ? `${plainAutoDesc} Backed by GoBike's Australia-wide shipping and 1-year local warranty.`
    : "Product description will appear here…";
  const autoCanonical = `https://gobike.au/product/${slug || "product-slug"}`;

  const effTitle = metaTitleRaw || autoTitle;
  const effDesc = metaDescRaw || autoDesc;
  const effCanonical = canonicalRaw || autoCanonical;

  // ── Focus keyword SEO analysis ──
  const kwAnalysis = useMemo(() => {
    const kw = focusKeyword.toLowerCase().trim();
    if (!kw) return null;
    const plainContent = stripHtml(description).toLowerCase();
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const kwCount = (plainContent.match(new RegExp(safeKw, "gi")) || []).length;
    const density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
    const firstImg = galleryImages[0];
    const firstImgAlt = (typeof firstImg === "object" && firstImg?.altText ? firstImg.altText : "").toLowerCase();
    return {
      inTitle: effTitle.toLowerCase().includes(kw),
      inDesc: effDesc.toLowerCase().includes(kw),
      inSlug: slug.toLowerCase().includes(kw.replace(/\s+/g, "-")),
      inFirstPara: plainContent.substring(0, 500).includes(kw),
      inAlt: firstImgAlt.includes(kw),
      density: density.toFixed(1),
      densityGood: density >= 0.5 && density <= 2.5,
      kwCount,
    };
  }, [focusKeyword, effTitle, effDesc, description, slug, galleryImages]);

  const handleNoIndexChange = (checked: boolean) => {
    setValue("noIndex", checked, { shouldDirty: true });
    if (noFollow) {
      setValue("seoSchema.robots", checked ? "noindex, nofollow" : "index, nofollow", { shouldDirty: true });
    }
  };

  const handleNoFollowChange = (checked: boolean) => {
    setNoFollow(checked);
    if (checked) {
      setValue("seoSchema.robots", noIndex ? "noindex, nofollow" : "index, nofollow", { shouldDirty: true });
    } else if (robots === "noindex, nofollow" || robots === "index, nofollow") {
      setValue("seoSchema.robots", "", { shouldDirty: true });
    }
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
        <Search size={15} className="text-[#8c8f94]" />
        <span className="font-semibold text-[#1d2327] text-[14px]">SEO</span>
        <span className="ml-auto text-[11px] text-[#646970] bg-[#f0f0f1] px-2 py-0.5 rounded hidden sm:inline">
          Every field shows what&apos;s actually in use — edit to override
        </span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
      </div>

      {isExpanded && (
      <div className="p-4 space-y-5">
        {/* Focus Keyword */}
        <div>
          <label className={labelClass}><span>Focus Keyword</span></label>
          <input
            type="text"
            {...register("focusKeyword")}
            placeholder="e.g. kids electric dirt bike"
            className={inputClass}
          />
          <p className="text-[11px] text-[#646970] mt-1">
            The primary keyword this product targets — SEO analysis updates in real time below.
          </p>

          {kwAnalysis && (
            <div className="mt-3 p-3 bg-[#f6f7f7] rounded-[3px] border border-[#c3c4c7] space-y-1.5">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-2">SEO Analysis</p>
              {[
                { label: "Keyword in page title", ok: kwAnalysis.inTitle },
                { label: "Keyword in meta description", ok: kwAnalysis.inDesc },
                { label: "Keyword in URL / slug", ok: kwAnalysis.inSlug },
                { label: "Keyword in description (first paragraph)", ok: kwAnalysis.inFirstPara },
                { label: "Keyword in first gallery image alt text", ok: kwAnalysis.inAlt },
                {
                  label: `Keyword density: ${kwAnalysis.density}% — ideal 0.5–2.5% (found ${kwAnalysis.kwCount}×)`,
                  ok: kwAnalysis.densityGood,
                },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold ${ok ? "bg-green-500" : "bg-red-400"}`}>
                    {ok ? "✓" : "✗"}
                  </span>
                  <span className={`text-[12px] ${ok ? "text-[#1d2327]" : "text-[#646970]"}`}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic SEO */}
        <div className="border-t border-[#f0f0f1] pt-4 space-y-4">
          <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">Basic SEO</p>

          <div>
            <label className={labelClass}>
              <span>Meta Title</span>
              {autoTag(!metaTitleRaw)}
            </label>
            <input
              type="text"
              value={effTitle}
              onChange={(e) => setValue("metaTitle", e.target.value, { shouldDirty: true })}
              className={inputClass}
            />
            <div className="flex items-center justify-end mt-1">
              <p className={`text-[11px] font-medium ${effTitle.length > 70 ? "text-red-500" : effTitle.length > 60 ? "text-yellow-600" : "text-[#646970]"}`}>
                {effTitle.length}/60
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <span>Meta Description</span>
              {autoTag(!metaDescRaw)}
            </label>
            <textarea
              value={effDesc}
              onChange={(e) => setValue("metaDesc", e.target.value, { shouldDirty: true })}
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-[#646970]">Ideal: 120–160 characters</p>
              <p className={`text-[11px] font-medium ${effDesc.length > 200 ? "text-red-500" : effDesc.length > 160 ? "text-yellow-600" : "text-[#646970]"}`}>
                {effDesc.length}/160
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <span>Canonical URL</span>
              {autoTag(!canonicalRaw)}
            </label>
            <input
              type="text"
              value={effCanonical}
              onChange={(e) => setValue("seoCanonicalUrl", e.target.value, { shouldDirty: true })}
              className={inputClass}
            />
            {errors.seoCanonicalUrl && <p className="text-[#d63638] text-[11px] mt-1">{errors.seoCanonicalUrl.message}</p>}
          </div>
        </div>

        {/* Robots & Indexing */}
        <div className="border-t border-[#f0f0f1] pt-4 space-y-3">
          <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">Robots &amp; Indexing</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={noIndex}
                onChange={(e) => handleNoIndexChange(e.target.checked)}
                className="w-4 h-4 rounded border-[#c3c4c7]"
              />
              <span className="text-[13px] text-[#1d2327]">
                No Index <span className="text-[#646970] font-normal">(hide from search engine index)</span>
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={noFollow}
                onChange={(e) => handleNoFollowChange(e.target.checked)}
                className="w-4 h-4 rounded border-[#c3c4c7]"
              />
              <span className="text-[13px] text-[#1d2327]">
                No Follow <span className="text-[#646970] font-normal">(don&apos;t pass link authority to outbound links)</span>
              </span>
            </label>
          </div>
          <div>
            <label className={labelClass}>
              <span>Custom Robots</span>
              {autoTag(!robots)}
            </label>
            <input
              type="text"
              {...register("seoSchema.robots", {
                onChange: (e) => setNoFollow(String(e.target.value).includes("nofollow")),
              })}
              placeholder="Empty = inherits the site-wide default (index, follow, ...)"
              className={`${inputClass} font-mono`}
            />
            <p className="text-[11px] text-[#646970] mt-1">
              Advanced override — leave empty to follow the site&apos;s default robots policy (auto-filled when you toggle No Index/No Follow above).
            </p>
          </div>
        </div>

        {/* Google Search Preview */}
        <div className="border-t border-[#f0f0f1] pt-4">
          <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-1">Google Search Preview</p>
          <SeoPreview
            title={effTitle}
            description={effDesc}
            slug={slug}
            baseUrl="https://gobike.au/product"
          />
        </div>
      </div>
      )}
    </div>
  );
}
