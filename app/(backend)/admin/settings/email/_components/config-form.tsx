// File: app/(backend)/admin/settings/_components/email/config-form.tsx

"use client";

import { useState, useEffect } from "react";
import { EmailConfiguration, EmailTemplate } from "@prisma/client";
import { saveEmailConfiguration } from "@/app/actions/backend/settings/email/email-config";
import { sendTestEmail } from "@/app/actions/backend/settings/email/send-test-email";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandingPreview } from "./branding-preview"; 

interface Props {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  refreshData: () => void;
}

export const ConfigForm = ({ config, templates, refreshData }: Props) => {
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [branding, setBranding] = useState({
    headerImage: config?.headerImage || "",
    baseColor: config?.baseColor || "#2271b1",
    backgroundColor: config?.backgroundColor || "#F7F7F7",
    bodyBackgroundColor: config?.bodyBackgroundColor || "#FFFFFF",
    footerText: config?.footerText || "© 2025 GoBike. All rights reserved."
  });

  useEffect(() => {
    if(config) {
        setBranding({
            headerImage: config.headerImage || "",
            baseColor: config.baseColor || "#2271b1",
            backgroundColor: config.backgroundColor || "#F7F7F7",
            bodyBackgroundColor: config.bodyBackgroundColor || "#FFFFFF",
            footerText: config.footerText || ""
        });
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    const form = e.target as HTMLFormElement;
    const isActiveInput = form.elements.namedItem('isActive') as HTMLInputElement;
    formData.set("isActive", String(isActiveInput?.checked || false));

    const res = await saveEmailConfiguration(formData);
    if (res.success) {
        toast.success(res.message);
        refreshData();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) return toast.error("Enter an email address");
    setSendingTest(true);
    const res = await sendTestEmail(testEmail, selectedTemplateId || undefined);
    if (res.success) toast.success(res.message);
    else toast.error(res.error);
    setSendingTest(false);
  };

  // WP Input Class Helper (Responsive Width added)
  const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border";
  const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
  const thResponsiveClass = "block md:table-cell w-full md:w-[200px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0";
  const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px]";

  return (
    // Mobile: column (stack), Large screen: row (side by side)
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* === LEFT COLUMN: SETTINGS FORM === */}
        <div className="min-w-0" style={{ flex: "1 1 0%" }}>
            <form onSubmit={handleSave} className="w-full">
                
                <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Sender Options</h2>
                <table className="w-full text-left border-collapse mb-[20px] block md:table">
                    <tbody className="block md:table-row-group">
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>"From" Name</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="senderName" defaultValue={config?.senderName} placeholder="e.g. GoBike Store" className={wpInputClass} />
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>"From" Address</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="senderEmail" defaultValue={config?.senderEmail} placeholder="e.g. sales@gobike.au" className={wpInputClass} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none mt-[20px]">SMTP Configuration</h2>
                <table className="w-full text-left border-collapse mb-[20px] block md:table">
                    <tbody className="block md:table-row-group">
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Enable SMTP</th>
                            <td className={tdResponsiveClass}>
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input type="checkbox" name="isActive" id="isActive" defaultChecked={config?.isActive} className="w-4 h-4 border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] m-0"/>
                                    <span className="text-[13px] text-[#3c434a]">Enable SMTP Email Sending</span>
                                </label>
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>SMTP Host</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="smtpHost" defaultValue={config?.smtpHost || ""} placeholder="e.g. smtp.gmail.com" className={wpInputClass} />
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Port</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="smtpPort" defaultValue={config?.smtpPort || "587"} placeholder="587" className={`${wpInputClass} md:!w-[80px]`} />
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>SMTP Username</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="smtpUser" defaultValue={config?.smtpUser || ""} placeholder="email@gmail.com" className={wpInputClass} />
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>SMTP Password</th>
                            <td className={tdResponsiveClass}>
                                <input type="password" name="smtpPassword" defaultValue={config?.smtpPassword || ""} placeholder="••••••••" className={wpInputClass} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none mt-[20px]">Email Branding</h2>
                <table className="w-full text-left border-collapse mb-[20px] block md:table">
                    <tbody className="block md:table-row-group">
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Header Image URL</th>
                            <td className={tdResponsiveClass}>
                                <input type="text" name="headerImage" value={branding.headerImage} onChange={(e) => setBranding({...branding, headerImage: e.target.value})} placeholder="https://example.com/logo.png" className={wpInputClass} />
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Base Color</th>
                            <td className={tdResponsiveClass}>
                                <div className="flex items-center gap-2">
                                    <input type="color" name="baseColor" value={branding.baseColor} onChange={(e) => setBranding({...branding, baseColor: e.target.value})} className="h-[30px] w-[30px] p-0 border border-[#8c8f94] cursor-pointer shrink-0" />
                                    <input type="text" value={branding.baseColor} readOnly className={`${wpInputClass} !w-full md:!w-[100px] bg-[#f0f0f1]`} />
                                </div>
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Background Color</th>
                            <td className={tdResponsiveClass}>
                                <div className="flex items-center gap-2">
                                    <input type="color" name="backgroundColor" value={branding.backgroundColor} onChange={(e) => setBranding({...branding, backgroundColor: e.target.value})} className="h-[30px] w-[30px] p-0 border border-[#8c8f94] cursor-pointer shrink-0" />
                                    <input type="text" value={branding.backgroundColor} readOnly className={`${wpInputClass} !w-full md:!w-[100px] bg-[#f0f0f1]`} />
                                </div>
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Body BG Color</th>
                            <td className={tdResponsiveClass}>
                                <div className="flex items-center gap-2">
                                    <input type="color" name="bodyBackgroundColor" value={branding.bodyBackgroundColor} onChange={(e) => setBranding({...branding, bodyBackgroundColor: e.target.value})} className="h-[30px] w-[30px] p-0 border border-[#8c8f94] cursor-pointer shrink-0" />
                                    <input type="text" value={branding.bodyBackgroundColor} readOnly className={`${wpInputClass} !w-full md:!w-[100px] bg-[#f0f0f1]`} />
                                </div>
                            </td>
                        </tr>
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Footer Text</th>
                            <td className={tdResponsiveClass}>
                                <textarea name="footerText" value={branding.footerText} onChange={(e) => setBranding({...branding, footerText: e.target.value})} className={`${wpInputClass} !h-[80px] md:w-[35em] py-2`}></textarea>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none mt-[20px]">Test Configuration</h2>
                <table className="w-full text-left border-collapse mb-[20px] block md:table">
                    <tbody className="block md:table-row-group">
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>Recipient Email</th>
                            <td className={tdResponsiveClass}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="text"
                                        placeholder="Enter recipient email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className={wpInputClass}
                                    />
                                    <button
                                        onClick={handleTestEmail}
                                        disabled={sendingTest}
                                        className="bg-[#f6f7f7] text-[#2271b1] border border-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px] flex items-center justify-center gap-2 shrink-0"
                                    >
                                        {sendingTest && <Loader2 className="animate-spin" size={14}/>}
                                        {sendingTest ? "Sending..." : "Send Test Email"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-[4px] mb-[30px] pb-6 md:pb-0">
                    <button type="submit" disabled={loading} className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px] w-full md:w-auto">
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        Save changes
                    </button>
                </div>
            </form>
        </div>

        {/* === RIGHT COLUMN: LIVE EMAIL PREVIEW === */}
        <div className="flex flex-col gap-[20px]" style={{ flex: "0 0 580px", maxWidth: "100%" }}>
            <BrandingPreview
                logo={branding.headerImage}
                baseColor={branding.baseColor}
                bgColor={branding.backgroundColor}
                bodyColor={branding.bodyBackgroundColor}
                footerText={branding.footerText}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={setSelectedTemplateId}
            />
        </div>
    </div>
  );
};