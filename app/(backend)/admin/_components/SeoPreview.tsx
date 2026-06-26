"use client";

interface SeoPreviewProps {
  title: string;
  description: string;
  slug?: string;
  baseUrl?: string;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

export default function SeoPreview({ title, description, slug, baseUrl = "https://yourstore.com" }: SeoPreviewProps) {
  const titleLen = title.length;
  const descLen = description.length;

  const titleColor =
    titleLen === 0 ? "text-[#8c8f94]" :
    titleLen <= TITLE_MAX ? "text-[#2a7a2a]" : "text-[#d63638]";

  const descColor =
    descLen === 0 ? "text-[#8c8f94]" :
    descLen <= DESC_MAX ? "text-[#2a7a2a]" : "text-[#d63638]";

  const displayUrl = slug ? `${baseUrl}/${slug}` : baseUrl;
  const truncated = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "…" : str;

  return (
    <div className="mt-3 border border-[#e2e4e7] rounded-[3px] bg-[#f9f9f9] overflow-hidden">
      <div className="px-3 py-1.5 bg-[#f0f0f1] border-b border-[#e2e4e7] flex items-center justify-between">
        <span className="text-[11px] text-[#646970] font-medium uppercase tracking-wide">Google Preview</span>
      </div>

      <div className="p-3 font-sans">
        {/* URL breadcrumb */}
        <p className="text-[12px] text-[#006621] truncate mb-0.5">{displayUrl}</p>

        {/* Title */}
        <p className={`text-[17px] leading-snug truncate ${title ? "text-[#1a0dab]" : "text-[#8c8f94] italic"}`}>
          {title || "Page title will appear here"}
        </p>

        {/* Description */}
        <p className="text-[13px] text-[#545454] leading-relaxed mt-0.5 line-clamp-2">
          {description
            ? truncated(description, DESC_MAX)
            : <span className="text-[#8c8f94] italic">Meta description will appear here…</span>}
        </p>
      </div>

      {/* Character counters */}
      <div className="px-3 pb-2 flex gap-4 text-[12px]">
        <span>
          Title: <span className={titleColor}>{titleLen}/{TITLE_MAX}</span>
        </span>
        <span>
          Description: <span className={descColor}>{descLen}/{DESC_MAX}</span>
        </span>
      </div>
    </div>
  );
}
