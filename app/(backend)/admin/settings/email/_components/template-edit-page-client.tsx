// app/(backend)/admin/settings/_components/email/template-edit-page-client.tsx

"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmailTemplate } from "@prisma/client";
import { toast } from "sonner";
import {
  Loader2, Monitor, Smartphone, RefreshCw,
  ArrowLeft, Save, Copy, Check, Eye
} from "lucide-react";
import RichTextEditor from "./rich-text-editor";
import { updateEmailTemplate } from "@/app/actions/backend/settings/email/email-templates";
import { previewEmailTemplateWithOverrides } from "@/app/actions/backend/settings/email/preview-template";

interface Props {
  template: EmailTemplate;
}

const AVAILABLE_VARIABLES = [
  { key: "{customer_name}",    desc: "Customer's full name" },
  { key: "{order_number}",     desc: "Order ID (e.g. #1001)" },
  { key: "{total_amount}",     desc: "Order total with currency" },
  { key: "{payment_method}",   desc: "Payment gateway name" },
  { key: "{tracking_number}",  desc: "Shipping tracking code" },
  { key: "{courier}",          desc: "Shipping carrier name" },
  { key: "{shipping_address}", desc: "Full shipping address" },
  { key: "{billing_address}",  desc: "Full billing address" },
  { key: "{order_date}",       desc: "Date of purchase" },
];

const wpInput = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[5px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white min-h-[30px]";

const MetaBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-4">
    <h2 className="m-0 px-3 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] cursor-pointer select-none">
      {title}
    </h2>
    <div className="p-3">
      {children}
    </div>
  </div>
);

export function TemplateEditPageClient({ template }: Props) {
  const router = useRouter();

  const [saving, setSaving]       = useState(false);
  const [isEnabled, setIsEnabled] = useState(template.isEnabled);
  const [subject, setSubject]     = useState(template.subject ?? "");
  const [heading, setHeading]     = useState(template.heading ?? "");
  const [cc, setCc]               = useState((template.cc ?? []).join(", "));
  const [bcc, setBcc]             = useState((template.bcc ?? []).join(", "));
  const [content, setContent]     = useState(template.content ?? "");

  const [previewHtml, setPreviewHtml]       = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewMode, setViewMode]             = useState<"desktop" | "mobile">("desktop");
  const [copiedVar, setCopiedVar]           = useState<string | null>(null);

  const desktopIframeRef    = useRef<HTMLIFrameElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileIframeRef     = useRef<HTMLIFrameElement>(null);
  const mobileContainerRef  = useRef<HTMLDivElement>(null);

  const scaleIframe = (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    emailWidth: number
  ) => {
    try {
      const iframe    = iframeRef.current;
      const container = containerRef.current;
      if (!iframe?.contentDocument?.body || !container) return;
      const contentH   = iframe.contentDocument.body.scrollHeight;
      const wrapW      = container.clientWidth;
      const scale      = Math.min(1, wrapW / emailWidth);
      const scaledW    = emailWidth * scale;
      const leftMargin = Math.max(0, (wrapW - scaledW) / 2);

      iframe.style.width           = `${emailWidth}px`;
      iframe.style.height          = `${contentH}px`;
      iframe.style.transform       = `scale(${scale})`;
      iframe.style.transformOrigin = "top left";
      iframe.style.marginLeft      = `${leftMargin}px`;
      container.style.height       = `${Math.ceil(contentH * scale)}px`;
    } catch {}
  };

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    const res = await previewEmailTemplateWithOverrides(template.id, { content, heading, subject });
    setPreviewHtml(res.html);
    setPreviewLoading(false);
  }, [template.id, content, heading, subject]);

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("id", template.id);
    formData.set("subject", subject);
    formData.set("heading", heading);
    formData.set("content", content);
    formData.set("isEnabled", String(isEnabled));
    formData.set("cc", cc);
    formData.set("bcc", bcc);
    const res = await updateEmailTemplate(formData);
    if (res.success) {
      toast.success("Template saved successfully");
    } else {
      toast.error("Failed to save template");
    }
    setSaving(false);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedVar(key);
    toast.info(`Copied ${key}`);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const goBack = () => router.push("/admin/settings?tab=email&subtab=templates");

  return (
    <div
      className="min-h-screen bg-[#f0f0f1]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif' }}
    >
      <div className="w-full px-0 pb-8">

        {/* ── WordPress-style Page Title Row ── */}
        <div className="flex flex-wrap items-center gap-3 mb-5 pt-1">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-[13px] text-[#2271b1] hover:text-[#135e96] bg-transparent border-none cursor-pointer p-0 leading-none"
          >
            <ArrowLeft size={14} />
            Email Templates
          </button>

          <span className="text-[#dcdcde] text-[18px] leading-none">|</span>

          <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-tight">
            {template.name}
          </h1>

          <code className="text-[11px] font-mono bg-white border border-[#c3c4c7] px-2 py-0.5 text-[#646970] rounded-[2px]">
            {template.triggerEvent}
          </code>
        </div>

        {/* ── Two-column WordPress Layout ── */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">

          {/* ════════ LEFT — Main content ════════ */}
          <div className="flex-1 min-w-0">

            {/* Email Content */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-4">
              <h2 className="m-0 px-3 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327]">
                Email Content
              </h2>
              <div className="p-0">
                <RichTextEditor value={content} onChange={setContent} />
              </div>
              <p className="px-3 pb-2 m-0 text-[12px] text-[#646970]">
                Write the email body. Copy variables from the panel on the right and paste them here.
              </p>
            </div>

            {/* Dynamic Variables */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-4">
              <h2 className="m-0 px-3 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327]">
                Dynamic Variables
              </h2>
              <div className="p-3">
                <p className="text-[12px] text-[#646970] mt-0 mb-3">
                  Click a variable to copy it, then paste it into the editor above.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleCopy(v.key)}
                      className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-[#dcdcde] rounded-[3px] cursor-pointer hover:border-[#2271b1] hover:bg-[#f0f6fc] transition-colors group text-left"
                    >
                      <div className="min-w-0">
                        <code className="text-[11px] font-bold text-[#2271b1] block truncate">{v.key}</code>
                        <span className="text-[10px] text-[#646970]">{v.desc}</span>
                      </div>
                      {copiedVar === v.key
                        ? <Check size={13} className="text-[#007017] shrink-0 ml-1" />
                        : <Copy size={13} className="text-[#c3c4c7] group-hover:text-[#2271b1] shrink-0 ml-1" />
                      }
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ════════ RIGHT — Sidebar meta boxes ════════ */}
          <div className="w-full xl:w-[280px] shrink-0">

            {/* Publish / Status box */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-4">
              <h2 className="m-0 px-3 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327]">
                Status
              </h2>
              <div className="p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={e => setIsEnabled(e.target.checked)}
                    className="rounded-[3px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-[13px] text-[#3c434a]">
                    {isEnabled ? "Active — emails will be sent" : "Inactive — emails will NOT be sent"}
                  </span>
                </label>
              </div>
              <div className="px-3 py-2 bg-[#f6f7f7] border-t border-[#c3c4c7] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-[13px] text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-[5px] text-[13px] font-semibold bg-[#2271b1] text-white border border-[#2271b1] rounded-[3px] hover:bg-[#135e96] disabled:opacity-60 cursor-pointer transition-colors"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>

            {/* Email Details box */}
            <MetaBox title="Email Details">
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#1d2327] mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className={wpInput}
                    placeholder="e.g. Your order #{order_number} is confirmed"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1d2327] mb-1">
                    Email Heading
                  </label>
                  <input
                    type="text"
                    value={heading}
                    onChange={e => setHeading(e.target.value)}
                    className={wpInput}
                    placeholder="e.g. Order Confirmed"
                  />
                  <p className="text-[11px] text-[#646970] mt-1 mb-0">Displayed in the email header banner.</p>
                </div>
              </div>
            </MetaBox>

            {/* Recipients box */}
            <MetaBox title="Recipients (CC / BCC)">
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#1d2327] mb-1">CC</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={e => setCc(e.target.value)}
                    className={wpInput}
                    placeholder="e.g. admin@shop.com, team@shop.com"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1d2327] mb-1">BCC</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={e => setBcc(e.target.value)}
                    className={wpInput}
                    placeholder="Comma separated"
                  />
                </div>
                <p className="text-[11px] text-[#646970] m-0">
                  Separate multiple email addresses with a comma.
                </p>
              </div>
            </MetaBox>

          </div>
        </div>

        {/* ════════ FULL-WIDTH Preview Box ════════ */}
        <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">

          {/* Preview header */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#c3c4c7]">
            <Eye size={14} className="text-[#646970]" />
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex-1">
              Live Preview
            </h2>

            {/* Desktop / Mobile toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1 px-2 py-1 text-[12px] border rounded-[3px] cursor-pointer transition-colors ${
                  viewMode === "desktop"
                    ? "bg-[#2271b1] text-white border-[#2271b1]"
                    : "bg-[#f6f7f7] text-[#2271b1] border-[#c3c4c7] hover:border-[#2271b1]"
                }`}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1 px-2 py-1 text-[12px] border rounded-[3px] cursor-pointer transition-colors ${
                  viewMode === "mobile"
                    ? "bg-[#2271b1] text-white border-[#2271b1]"
                    : "bg-[#f6f7f7] text-[#2271b1] border-[#c3c4c7] hover:border-[#2271b1]"
                }`}
              >
                <Smartphone size={12} /> Mobile
              </button>
            </div>

            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="flex items-center gap-1 px-3 py-1 text-[12px] font-semibold bg-[#2271b1] text-white border border-[#2271b1] rounded-[3px] hover:bg-[#135e96] disabled:opacity-50 cursor-pointer transition-colors"
            >
              {previewLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <RefreshCw size={12} />
              }
              {previewHtml ? "Refresh Preview" : "Generate Preview"}
            </button>
          </div>

          <p className="px-3 py-2 m-0 text-[12px] text-[#646970] border-b border-[#f0f0f1] bg-[#fafafa]">
            After editing, click <strong>Generate Preview</strong> to see how the email will look. Changes are not required to be saved first.
          </p>

          {/* Preview content */}
          <div className="p-4">

            {/* Empty state */}
            {!previewHtml && !previewLoading && (
              <div className="border border-dashed border-[#c3c4c7] rounded-[3px] py-16 flex flex-col items-center justify-center text-[#646970] gap-3 bg-[#f9f9f9]">
                <Monitor size={36} className="text-[#dcdcde]" />
                <div className="text-center">
                  <p className="text-[13px] font-medium m-0">No preview yet</p>
                  <p className="text-[12px] m-0 mt-1">Click "Generate Preview" to see the email.</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {previewLoading && (
              <div className="border border-[#c3c4c7] rounded-[3px] py-16 flex items-center justify-center gap-2 text-[#646970] text-[13px] bg-[#f9f9f9]">
                <Loader2 size={20} className="animate-spin text-[#2271b1]" />
                Generating preview...
              </div>
            )}

            {/* Desktop preview — 600px email scaled to fit any container width */}
            {previewHtml && !previewLoading && viewMode === "desktop" && (
              <div
                ref={desktopContainerRef}
                className="border border-[#c3c4c7] rounded-[3px] overflow-hidden bg-[#f0f0f1]"
              >
                <iframe
                  ref={desktopIframeRef}
                  srcDoc={previewHtml}
                  onLoad={() => scaleIframe(desktopIframeRef, desktopContainerRef, 600)}
                  style={{ border: "none", display: "block", overflow: "hidden" }}
                  title="Email Preview — Desktop"
                  sandbox="allow-same-origin"
                />
              </div>
            )}

            {/* Mobile preview — 600px email shown in a 375px-wide box, scaled to container */}
            {previewHtml && !previewLoading && viewMode === "mobile" && (
              <div className="flex justify-center bg-[#e5e7eb] p-4 rounded-[3px]">
                <div
                  ref={mobileContainerRef}
                  className="overflow-hidden rounded-[8px] shadow-xl"
                  style={{ width: "min(375px, 100%)" }}
                >
                  <iframe
                    ref={mobileIframeRef}
                    srcDoc={previewHtml}
                    onLoad={() => scaleIframe(mobileIframeRef, mobileContainerRef, 600)}
                    style={{ border: "none", display: "block", overflow: "hidden" }}
                    title="Email Preview — Mobile"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
