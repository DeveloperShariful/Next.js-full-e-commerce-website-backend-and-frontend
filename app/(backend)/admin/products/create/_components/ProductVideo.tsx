// File: app/admin/products/create/_components/ProductVideo.tsx
// 🚀 আগে এই video/thumbnail picker "General" ট্যাবে অন্যান্য ফিল্ডের সাথে মিশে
// ছিল — এখন ডান sidebar-এ Product Image/Gallery Images-এর পাশেই একটা আলাদা
// widget, blog-form.tsx-এর Video সেকশনের মতো একই collapsible প্যাটার্নে।
//
// 🚀 নতুন: Video Title/Description — খালি রাখলে product.name/description থেকে
// auto-generate করা টেক্সট দেখায় (VideoObject schema-তে যা ব্যবহার হয়, ঠিক
// product/[slug]/page.tsx-এর mainVideoSchema-র সাথে মিলিয়ে), এডিট করলে সেটাই
// সেভ হয় — SeoBox.tsx-এর effective-value প্যাটার্নের সাথে সামঞ্জস্যপূর্ণ।
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { X, ChevronUp, ChevronDown, Video as VideoIcon } from "lucide-react";
import { ProductFormData } from "../types";
import MediaPickerModal, { PickedMedia } from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

export default function ProductVideo() {
  const { watch, setValue } = useFormContext<ProductFormData>();

  const [isExpanded, setIsExpanded] = useState(true);
  const [openVideoModal, setOpenVideoModal] = useState(false);
  const [openThumbModal, setOpenThumbModal] = useState(false);

  const videoUrl = watch("videoUrl") || "";
  const videoThumbnail = watch("videoThumbnail") || "";
  const name = watch("name") || "";
  const shortDescription = watch("shortDescription") || "";
  const description = watch("description") || "";

  const videoTitleRaw = watch("videoTitle") || "";
  const videoDescRaw = watch("videoDescription") || "";

  // ── mainVideoSchema (product/[slug]/page.tsx)-এর সাথে হুবহু একই auto সূত্র ──
  const autoTitle = name ? `${name} — Product Video` : "Product Name — Product Video";
  const autoDesc = stripHtml(shortDescription || description || name).slice(0, 500) || "Product description will appear here…";
  const effTitle = videoTitleRaw || autoTitle;
  const effDesc = videoDescRaw || autoDesc;

  const labelClass = "flex items-center justify-between text-[13px] font-semibold text-[#1d2327] mb-1";
  const inputClass = "w-full px-3 py-2 text-[13px] border border-[#8c8f94] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]";
  const autoTag = (isAuto: boolean) =>
    isAuto ? (
      <span className="text-[10px] font-normal normal-case text-[#8c8f94] bg-[#f0f0f1] px-1.5 py-0.5 rounded">auto — edit to override</span>
    ) : (
      <span className="text-[10px] font-normal normal-case text-[#2271b1] bg-[#eaf3fb] px-1.5 py-0.5 rounded">custom</span>
    );

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
      >
        <span className="font-semibold text-[14px] text-[#1d2327] flex items-center gap-1.5">
          <VideoIcon size={14} className="text-[#8c8f94]" /> Product Video
        </span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
      </div>

      {isExpanded && (
        <div className="p-3 space-y-4">
          {/* Video file */}
          <div>
            <label className="block text-[12px] font-semibold text-[#646970] mb-2">Video File</label>
            {videoUrl ? (
              <div className="space-y-2">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  className="w-full rounded-[3px] border border-[#c3c4c7] bg-black"
                  style={{ maxHeight: 180 }}
                />
                <div className="flex items-center gap-2">
                  <span className="truncate text-[11px] text-[#646970] flex-1">
                    {videoUrl.split("/").pop()?.split("?")[0] || videoUrl}
                  </span>
                  <button type="button" onClick={() => setOpenVideoModal(true)} className="text-[12px] text-[#2271b1] hover:underline shrink-0">
                    Change
                  </button>
                  <button type="button" onClick={() => setValue("videoUrl", "", { shouldDirty: true })} className="text-[#646970] hover:text-red-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenVideoModal(true)}
                className="w-full border-2 border-dashed border-[#c3c4c7] rounded-[3px] p-3 flex items-center justify-center gap-2 text-[13px] text-[#646970] hover:border-[#2271b1] hover:text-[#2271b1] transition-colors"
              >
                Select Video from Library
              </button>
            )}
          </div>

          {/* Video thumbnail */}
          <div>
            <label className="block text-[12px] font-semibold text-[#646970] mb-2">Video Thumbnail</label>
            {videoThumbnail ? (
              <div className="relative w-32 h-20 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoThumbnail} alt="Video thumbnail" className="w-full h-full object-cover rounded-[3px] border border-[#c3c4c7]" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3px] flex items-center justify-center gap-1.5">
                  <button type="button" onClick={() => setOpenThumbModal(true)} className="text-white text-[11px] bg-black/60 rounded px-1.5 py-0.5 hover:bg-black/80">
                    Change
                  </button>
                  <button type="button" onClick={() => setValue("videoThumbnail", "", { shouldDirty: true })} className="text-white bg-black/60 rounded p-0.5 hover:bg-black/80">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenThumbModal(true)}
                className="w-full border-2 border-dashed border-[#c3c4c7] rounded-[3px] p-3 flex items-center justify-center gap-2 text-[13px] text-[#646970] hover:border-[#2271b1] hover:text-[#2271b1] transition-colors"
              >
                Select Thumbnail from Library
              </button>
            )}
          </div>

          {/* SEO — Video Title / Description (VideoObject schema) */}
          <div className="border-t border-[#f0f0f1] pt-3 space-y-3">
            <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">Video SEO</p>

            <div>
              <label className={labelClass}>
                <span>Video Title</span>
                {autoTag(!videoTitleRaw)}
              </label>
              <input
                type="text"
                value={effTitle}
                onChange={(e) => setValue("videoTitle", e.target.value, { shouldDirty: true })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span>Video Description</span>
                {autoTag(!videoDescRaw)}
              </label>
              <textarea
                value={effDesc}
                onChange={(e) => setValue("videoDescription", e.target.value, { shouldDirty: true })}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={openVideoModal}
        onClose={() => setOpenVideoModal(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          setValue("videoUrl", items[0].url, { shouldDirty: true });
          setOpenVideoModal(false);
        }}
        title="Select Video"
        source={MediaSource.PRODUCT}
        restrictType="VIDEO"
      />

      <MediaPickerModal
        open={openThumbModal}
        onClose={() => setOpenThumbModal(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          setValue("videoThumbnail", items[0].url, { shouldDirty: true });
          setOpenThumbModal(false);
        }}
        title="Select Thumbnail Image"
        source={MediaSource.PRODUCT}
        restrictType="IMAGE"
      />
    </div>
  );
}
