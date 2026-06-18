// File: app/(backend)/admin/settings/_components/email/branding-preview.tsx

"use client";

import { useState, useRef } from "react";
import { EmailTemplate } from "@prisma/client";
import { previewEmailTemplate } from "@/app/actions/backend/settings/email/preview-template";
import { Loader2, Monitor, Smartphone, Maximize2, X, RefreshCw } from "lucide-react";

interface LiveEmailPreviewProps {
  logo?: string;
  baseColor: string;
  bgColor: string;
  bodyColor: string;
  footerText: string;
  templates: EmailTemplate[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
}

export const BrandingPreview = ({
  logo,
  baseColor,
  bgColor,
  bodyColor,
  footerText,
  templates,
  selectedTemplateId,
  onTemplateChange,
}: LiveEmailPreviewProps) => {
  const selectedId = selectedTemplateId;
  const [previewHtml, setPreviewHtml]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [viewMode, setViewMode]         = useState<"desktop" | "mobile">("desktop");
  const [fullscreen, setFullscreen]     = useState(false);

  const sidebarIframeRef  = useRef<HTMLIFrameElement>(null);
  const fullscreenDeskRef = useRef<HTMLIFrameElement>(null);
  const fullscreenMobRef  = useRef<HTMLIFrameElement>(null);

  const autoHeight = (ref: React.RefObject<HTMLIFrameElement | null>) => {
    try {
      const el = ref.current;
      if (el?.contentDocument?.body) {
        el.style.height = el.contentDocument.body.scrollHeight + "px";
      }
    } catch {}
  };

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    const res = await previewEmailTemplate(selectedId);
    setPreviewHtml(res.html);
    setLoading(false);
  };

  const selectedTemplate = templates.find(t => t.id === selectedId);

  return (
    <>
      {/* ── Sidebar Preview Card ── */}
      <div className="w-full overflow-hidden bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">

        {/* Card header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#c3c4c7]">
          <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">
            Live Email Preview
          </h2>
          {previewHtml && (
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1 text-[11px] text-[#2271b1] hover:text-[#135e96] bg-transparent border-none cursor-pointer px-1"
            >
              <Maximize2 size={13} />
              Fullscreen
            </button>
          )}
        </div>

        <div className="p-3 space-y-3">

          {/* ── Branding colour swatches ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5 items-center">
              <div className="w-5 h-5 rounded border border-[#c3c4c7]" style={{ backgroundColor: baseColor }} title="Base colour" />
              <div className="w-5 h-5 rounded border border-[#c3c4c7]" style={{ backgroundColor: bgColor }} title="BG colour" />
              <div className="w-5 h-5 rounded border border-[#c3c4c7]" style={{ backgroundColor: bodyColor }} title="Body colour" />
            </div>
            {logo
              ? <img src={logo} alt="logo" className="h-5 object-contain max-w-[80px]" />
              : <span className="text-[11px] text-[#c3c4c7] font-medium">NO LOGO</span>
            }
            <span className="text-[10px] text-[#646970] truncate max-w-[140px]" title={footerText}>
              {footerText}
            </span>
          </div>

          {/* ── Template dropdown ── */}
          <select
            value={selectedId}
            onChange={e => { onTemplateChange(e.target.value); setPreviewHtml(""); }}
            className="w-full border border-[#8c8f94] rounded-[3px] px-2 py-[6px] text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none focus:shadow-[0_0_0_1px_#2271b1] bg-white"
          >
            <option value="">— একটি template বেছে নিন —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* ── Controls row ── */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded-[3px] cursor-pointer transition-colors ${
                viewMode === "desktop"
                  ? "bg-[#2271b1] text-white border-[#2271b1]"
                  : "bg-[#f6f7f7] text-[#2271b1] border-[#c3c4c7] hover:border-[#2271b1]"
              }`}
            >
              <Monitor size={11} /> Desktop
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded-[3px] cursor-pointer transition-colors ${
                viewMode === "mobile"
                  ? "bg-[#2271b1] text-white border-[#2271b1]"
                  : "bg-[#f6f7f7] text-[#2271b1] border-[#c3c4c7] hover:border-[#2271b1]"
              }`}
            >
              <Smartphone size={11} /> Mobile
            </button>

            <button
              onClick={handleGenerate}
              disabled={!selectedId || loading}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold border rounded-[3px] cursor-pointer bg-[#2271b1] text-white border-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : previewHtml ? <RefreshCw size={12} /> : null}
              {loading ? "Loading..." : previewHtml ? "Refresh" : "Preview করুন"}
            </button>
          </div>

          {/* ── Preview area ── */}
          {!previewHtml && !loading && (
            <div className="border border-dashed border-[#c3c4c7] rounded-[3px] h-[160px] flex flex-col items-center justify-center text-[#646970] gap-2">
              <Monitor size={24} className="text-[#c3c4c7]" />
              <span className="text-[12px] text-center px-4">Template select করে "Preview করুন" ক্লিক করুন</span>
            </div>
          )}

          {loading && (
            <div className="border border-[#c3c4c7] rounded-[3px] h-[160px] flex items-center justify-center gap-2 text-[#646970] text-[12px]">
              <Loader2 size={18} className="animate-spin text-[#2271b1]" />
              Preview তৈরি হচ্ছে...
            </div>
          )}

          {previewHtml && !loading && (
            <div className="border border-[#c3c4c7] rounded-[3px] overflow-hidden">
              {viewMode === "desktop" ? (
                <iframe
                  ref={sidebarIframeRef}
                  srcDoc={previewHtml}
                  onLoad={() => autoHeight(sidebarIframeRef)}
                  scrolling="no"
                  style={{ width: "100%", height: "400px", border: "none", display: "block", overflow: "hidden" }}
                  title="Email Preview — Desktop"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex justify-center p-2" style={{ backgroundColor: "#e5e7eb" }}>
                  <iframe
                    ref={sidebarIframeRef}
                    srcDoc={previewHtml}
                    onLoad={() => autoHeight(sidebarIframeRef)}
                    scrolling="no"
                    style={{
                      width: "375px",
                      height: "400px",
                      border: "none",
                      display: "block",
                      borderRadius: "16px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      overflow: "hidden",
                    }}
                    title="Email Preview — Mobile"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Fullscreen Modal ── */}
      {fullscreen && previewHtml && (
        <div className="fixed inset-0 z-[9999] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.88)" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between bg-[#1d2327] text-white px-4 py-2.5 shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[13px] font-semibold truncate">
                {selectedTemplate?.name || "Email Preview"}
              </span>
              <span className="text-[11px] text-[#8c8f94] hidden sm:inline truncate">
                {selectedTemplate?.triggerEvent}
              </span>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] border rounded cursor-pointer transition-colors ${
                  viewMode === "desktop"
                    ? "bg-white text-[#1d2327] border-white"
                    : "bg-transparent text-[#c3c4c7] border-[#3c434a] hover:border-white hover:text-white"
                }`}
              >
                <Monitor size={11} /> Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] border rounded cursor-pointer transition-colors ${
                  viewMode === "mobile"
                    ? "bg-white text-[#1d2327] border-white"
                    : "bg-transparent text-[#c3c4c7] border-[#3c434a] hover:border-white hover:text-white"
                }`}
              >
                <Smartphone size={11} /> Mobile
              </button>
            </div>

            <button
              onClick={() => setFullscreen(false)}
              className="shrink-0 text-[#c3c4c7] hover:text-white bg-transparent border-none cursor-pointer p-1 rounded hover:bg-[#3c434a] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto" style={{ backgroundColor: "#2c3338" }}>
            {viewMode === "desktop" ? (
              <div className="p-4" style={{ minHeight: "100%" }}>
                <iframe
                  ref={fullscreenDeskRef}
                  srcDoc={previewHtml}
                  onLoad={() => autoHeight(fullscreenDeskRef)}
                  scrolling="no"
                  className="w-full rounded-[4px] bg-white"
                  style={{ height: "600px", border: "none", display: "block", overflow: "hidden" }}
                  title="Email Preview Fullscreen — Desktop"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              /* Phone frame */
              <div className="flex justify-center items-start py-6 px-4">
                <div style={{
                  width: "390px",
                  background: "#111",
                  borderRadius: "44px",
                  padding: "10px",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 2px #333",
                }}>
                  {/* Dynamic Island */}
                  <div style={{ height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "90px", height: "22px", background: "#111", borderRadius: "11px", border: "1px solid #333" }} />
                  </div>
                  {/* Screen — auto height, no scrollbar */}
                  <div style={{ width: "370px", maxHeight: "760px", overflowY: "auto", overflowX: "hidden", borderRadius: "4px" }}>
                    <iframe
                      ref={fullscreenMobRef}
                      srcDoc={previewHtml}
                      onLoad={() => autoHeight(fullscreenMobRef)}
                      scrolling="no"
                      style={{ width: "370px", height: "700px", border: "none", display: "block", overflow: "hidden" }}
                      title="Email Preview Fullscreen — Mobile"
                      sandbox="allow-same-origin"
                    />
                  </div>
                  {/* Home indicator */}
                  <div style={{ height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "110px", height: "4px", background: "#333", borderRadius: "2px" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
