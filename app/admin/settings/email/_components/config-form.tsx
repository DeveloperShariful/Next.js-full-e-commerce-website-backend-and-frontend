// File: app/admin/settings/email/_components/config-form.tsx

"use client";

import { useState, useEffect } from "react";
import { EmailConfiguration } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveEmailConfiguration } from "@/app/actions/settings/email/email-config";
import { sendTestEmail } from "@/app/actions/settings/email/send-test-email";
import { toast } from "sonner";
import { Save, Loader2, Send } from "lucide-react";
import { BrandingPreview } from "./branding-preview"; // ✅ Import Preview

interface Props {
  config: EmailConfiguration | null;
  refreshData: () => void;
}

export const ConfigForm = ({ config, refreshData }: Props) => {
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // ✅ Live Preview State
  const [branding, setBranding] = useState({
    headerImage: config?.headerImage || "",
    baseColor: config?.baseColor || "#2271b1",
    backgroundColor: config?.backgroundColor || "#F7F7F7",
    bodyBackgroundColor: config?.bodyBackgroundColor || "#FFFFFF",
    footerText: config?.footerText || "© 2025 GoBike. All rights reserved."
  });

  // Sync state if config props change
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
    
    // Checkbox Manual Handle
    const form = e.target as HTMLFormElement;
    // TypeScript Error Fix for checkbox
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
    const res = await sendTestEmail(testEmail); // Pass single string argument
    if (res.success) toast.success(res.message);
    else toast.error(res.error);
    setSendingTest(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* === LEFT COLUMN: SETTINGS FORM === */}
        <div className="xl:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
                
                {/* 1. Sender Options */}
                <Card>
                    <CardHeader><CardTitle className="text-sm uppercase">Sender Options</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">"From" Name</label>
                                <Input name="senderName" defaultValue={config?.senderName} placeholder="e.g. GoBike Store" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">"From" Address</label>
                                <Input name="senderEmail" defaultValue={config?.senderEmail} placeholder="e.g. sales@gobike.au" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SMTP Settings */}
                <Card>
                    <CardHeader><CardTitle className="text-sm uppercase">SMTP Configuration</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500">SMTP Host</label>
                                <Input name="smtpHost" defaultValue={config?.smtpHost || ""} placeholder="e.g. smtp.gmail.com" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Port</label>
                                <Input name="smtpPort" defaultValue={config?.smtpPort || "587"} placeholder="587" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">SMTP Username</label>
                                <Input name="smtpUser" defaultValue={config?.smtpUser || ""} placeholder="email@gmail.com" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">SMTP Password (App Password)</label>
                                <Input name="smtpPassword" type="password" defaultValue={config?.smtpPassword || ""} placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" name="isActive" id="isActive" defaultChecked={config?.isActive} className="w-4 h-4 text-blue-600 rounded"/>
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Enable SMTP Email Sending</label>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Branding & Styling (Live State Update) */}
                <Card>
                    <CardHeader><CardTitle className="text-sm uppercase">Email Branding</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Header Image URL (Logo)</label>
                            <Input 
                                name="headerImage" 
                                value={branding.headerImage} 
                                onChange={(e) => setBranding({...branding, headerImage: e.target.value})}
                                placeholder="https://example.com/logo.png" 
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Base Color */}
                            <div>
                                <label className="text-xs font-bold text-slate-500">Base Color</label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color" 
                                        name="baseColor"
                                        value={branding.baseColor} 
                                        onChange={(e) => setBranding({...branding, baseColor: e.target.value})}
                                        className="w-12 p-1 cursor-pointer"
                                    />
                                    <Input value={branding.baseColor} readOnly className="text-xs font-mono"/>
                                </div>
                            </div>
                            {/* Background Color */}
                            <div>
                                <label className="text-xs font-bold text-slate-500">Background</label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color" 
                                        name="backgroundColor"
                                        value={branding.backgroundColor} 
                                        onChange={(e) => setBranding({...branding, backgroundColor: e.target.value})}
                                        className="w-12 p-1 cursor-pointer"
                                    />
                                    <Input value={branding.backgroundColor} readOnly className="text-xs font-mono"/>
                                </div>
                            </div>
                            {/* Body Color */}
                            <div>
                                <label className="text-xs font-bold text-slate-500">Body BG</label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color" 
                                        name="bodyBackgroundColor"
                                        value={branding.bodyBackgroundColor} 
                                        onChange={(e) => setBranding({...branding, bodyBackgroundColor: e.target.value})}
                                        className="w-12 p-1 cursor-pointer"
                                    />
                                    <Input value={branding.bodyBackgroundColor} readOnly className="text-xs font-mono"/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Footer Text</label>
                            <Input 
                                name="footerText" 
                                value={branding.footerText} 
                                onChange={(e) => setBranding({...branding, footerText: e.target.value})} 
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button disabled={loading} className="w-full bg-[#2271b1] hover:bg-[#1a5c92]">
                    {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={16}/>} 
                    Save Changes
                </Button>
            </form>
        </div>

        {/* === RIGHT COLUMN: PREVIEW & TEST === */}
        <div className="xl:col-span-1 space-y-6">
            
            {/* Live Preview Component */}
            <BrandingPreview 
                logo={branding.headerImage}
                baseColor={branding.baseColor}
                bgColor={branding.backgroundColor}
                bodyColor={branding.bodyBackgroundColor}
                footerText={branding.footerText}
            />

            {/* Test Email */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <CardTitle className="text-sm uppercase flex items-center gap-2">
                        <Send size={14}/> Test Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-slate-600">
                        Send a test email to verify your SMTP settings before going live.
                    </p>
                    <Input 
                        placeholder="Enter recipient email" 
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="bg-white"
                    />
                    <Button 
                        onClick={handleTestEmail} 
                        disabled={sendingTest} 
                        variant="outline" 
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                        {sendingTest ? <Loader2 className="animate-spin mr-2"/> : "Send Test Email"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};