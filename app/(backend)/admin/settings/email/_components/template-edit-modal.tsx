// File: app/(backend)/admin/settings/_components/email/template-edit-modal.tsx
"use client";

import { useState } from "react";
import { EmailTemplate } from "@prisma/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { updateEmailTemplate } from "@/app/actions/backend/settings/email/email-templates";
import { toast } from "sonner";
import { Loader2, Copy, Check, X } from "lucide-react";
import RichTextEditor from "./rich-text-editor";

interface Props {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

const AVAILABLE_VARIABLES = [
    { key: "{customer_name}", desc: "Customer's full name" },
    { key: "{order_number}", desc: "Order ID (e.g. #1001)" },
    { key: "{total_amount}", desc: "Order total with currency" },
    { key: "{payment_method}", desc: "Payment gateway name" },
    { key: "{tracking_number}", desc: "Shipping tracking code" },
    { key: "{courier}", desc: "Shipping carrier name" },
    { key: "{shipping_address}", desc: "Full shipping address" },
    { key: "{billing_address}", desc: "Full billing address" },
    { key: "{order_date}", desc: "Date of purchase" },
];

export const TemplateEditModal = ({ template, open, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(template.content || "");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    formData.set("content", content);

    const form = e.target as HTMLFormElement;
    const isEnabledInput = form.querySelector('input[name="isEnabled"]') as HTMLInputElement;
    formData.set("isEnabled", String(isEnabledInput?.checked || false));

    const res = await updateEmailTemplate(formData);
    if (res.success) {
        toast.success("Template updated successfully");
        onClose();
    } else {
        toast.error("Failed to update template");
    }
    setLoading(false);
  };

  const handleCopy = (key: string) => {
      navigator.clipboard.writeText(key);
      setCopiedVar(key);
      toast.info(`Copied ${key}`);
      setTimeout(() => setCopiedVar(null), 1500);
  };

  // WP Responsive Form Classes
  const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border";
  const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
  const thResponsiveClass = "block md:table-cell w-full md:w-[200px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0";
  const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px]";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-[1000px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden bg-[#f0f0f1] font-sans text-[13px]">
        
        {/* === HEADER === */}
        <div className="px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white flex justify-between items-center shrink-0">
            <div>
                <DialogTitle className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">Edit Template: {template.name}</DialogTitle>
                <DialogDescription className="text-[12px] text-[#646970] mt-1">
                    Trigger Event: <span className="font-mono bg-[#f0f0f1] px-1">{template.triggerEvent}</span>
                </DialogDescription>
            </div>
            <button onClick={onClose} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                <X size={20}/>
            </button>
        </div>
        
        {/* === BODY === */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            
            {/* --- LEFT: FORM EDITOR --- */}
            <div className="flex-1 overflow-y-auto p-[20px] bg-white">
                <form id="template-form" onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={template.id} />
                    
                    <table className="w-full text-left border-collapse block md:table">
                        <tbody className="block md:table-row-group">
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>Enable/Disable</th>
                                <td className={tdResponsiveClass}>
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input type="checkbox" name="isEnabled" id="isEnabled" defaultChecked={template.isEnabled} className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1]"/>
                                        <span className="text-[#3c434a]">Enable this email notification</span>
                                    </label>
                                </td>
                            </tr>
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>Email Subject</th>
                                <td className={tdResponsiveClass}>
                                    <input type="text" name="subject" defaultValue={template.subject} className={wpInputClass} />
                                </td>
                            </tr>
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>Email Heading</th>
                                <td className={tdResponsiveClass}>
                                    <input type="text" name="heading" defaultValue={template.heading || ""} className={wpInputClass} />
                                </td>
                            </tr>
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>CC Emails</th>
                                <td className={tdResponsiveClass}>
                                    <input type="text" name="cc" defaultValue={template.cc?.join(", ") || ""} className={wpInputClass} placeholder="Comma separated" />
                                </td>
                            </tr>
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>BCC Emails</th>
                                <td className={tdResponsiveClass}>
                                    <input type="text" name="bcc" defaultValue={template.bcc?.join(", ") || ""} className={wpInputClass} placeholder="Comma separated" />
                                </td>
                            </tr>
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>Email Content</th>
                                <td className={tdResponsiveClass}>
                                    <div className="border border-[#c3c4c7] rounded-[3px] min-h-[300px]">
                                        {/* Rich Text Editor inherits styles, leaving it to function normally */}
                                        <RichTextEditor value={content} onChange={setContent} />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>

            {/* --- RIGHT: VARIABLES (WP Meta Box Style) --- */}
            <div className="w-full lg:w-[300px] shrink-0 bg-[#f0f0f1] border-t lg:border-t-0 lg:border-l border-[#c3c4c7] p-[15px] overflow-y-auto">
                <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                    <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 px-[12px] py-[8px] border-b border-[#c3c4c7]">
                        Dynamic Variables
                    </h2>
                    <div className="p-[12px]">
                        <p className="text-[12px] text-[#646970] mt-0 mb-[15px]">Click to copy & paste into editor.</p>
                        
                        <ul className="m-0 p-0 list-none space-y-2">
                            {AVAILABLE_VARIABLES.map((v) => (
                                <li 
                                    key={v.key} 
                                    onClick={() => handleCopy(v.key)}
                                    className="p-[8px] bg-[#f6f7f7] border border-[#dcdcde] rounded-[3px] cursor-pointer hover:border-[#2271b1] transition-colors group flex justify-between items-center"
                                >
                                    <div>
                                        <code className="text-[11px] font-bold text-[#2271b1] block">{v.key}</code>
                                        <span className="text-[11px] text-[#646970]">{v.desc}</span>
                                    </div>
                                    {copiedVar === v.key ? <Check size={14} className="text-[#007017] shrink-0"/> : <Copy size={14} className="text-[#c3c4c7] group-hover:text-[#2271b1] shrink-0"/>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>

        {/* === FOOTER === */}
        <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="bg-white border border-[#8c8f94] text-[#2c3338] hover:bg-[#f0f0f1] hover:border-[#8c8f94] hover:text-[#2c3338] rounded-[3px] px-[12px] py-[4px] text-[13px] cursor-pointer min-h-[30px]">
                Cancel
            </button>
            <button type="submit" form="template-form" disabled={loading} className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px]">
                {loading ? <Loader2 className="animate-spin" size={14}/> : null}
                Save Template
            </button>
        </div>

      </DialogContent>
    </Dialog>
  );
};