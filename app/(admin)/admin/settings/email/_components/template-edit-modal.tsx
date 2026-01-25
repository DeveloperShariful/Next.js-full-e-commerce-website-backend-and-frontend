// File: app/admin/settings/email/_components/template-edit-modal.tsx
"use client";

import { useState } from "react";
import { EmailTemplate } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Shadcn Switch (Optional, using checkbox logic here for simplicity)
import { updateEmailTemplate } from "@/app/actions/admin/settings/email/email-templates";
import { toast } from "sonner";
import { Loader2, Save, Copy, Check, Info, X } from "lucide-react";
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
    
    // Rich Text Content
    formData.set("content", content);

    // Checkbox Manual Handle
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* 🔥 FIX: বড় এবং রেসপন্সিভ মডাল */}
      <DialogContent className="max-w-[95vw] w-full md:max-w-7xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden bg-slate-50">
        
        {/* === HEADER (FIXED) === */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
            <div>
                <DialogTitle className="text-xl font-bold text-slate-800">Edit Template: {template.name}</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                    Trigger Event: <span className="font-mono text-xs bg-slate-100 px-1 rounded text-orange-600">{template.triggerEvent}</span>
                </DialogDescription>
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 rounded-full"><X size={20}/></Button>
        </div>
        
        {/* === BODY (SCROLLABLE) === */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            
            {/* --- LEFT: FORM EDITOR --- */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                <form id="template-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                    <input type="hidden" name="id" value={template.id} />
                    
                    {/* Enable Switch */}
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <div>
                            <label htmlFor="isEnabled" className="text-sm font-bold text-slate-800 cursor-pointer block">Active Status</label>
                            <p className="text-xs text-slate-500">Enable or disable this automated email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="isEnabled" id="isEnabled" defaultChecked={template.isEnabled} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Subject & Heading */}
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label className="text-slate-700">Email Subject Line</Label>
                            <Input name="subject" defaultValue={template.subject} className="font-medium h-10 border-slate-300 focus:border-blue-500" placeholder="e.g. Your Order #{order_number} is Confirmed" />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-slate-700">Email Heading (H1 inside email)</Label>
                            <Input name="heading" defaultValue={template.heading || ""} className="h-10 border-slate-300" placeholder="e.g. Thanks for your order!" />
                        </div>
                    </div>

                    {/* CC / BCC */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="grid gap-2">
                            <Label className="text-xs uppercase text-slate-500 font-bold">CC</Label>
                            <Input name="cc" defaultValue={template.cc?.join(", ") || ""} placeholder="manager@store.com" className="text-xs bg-slate-50" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs uppercase text-slate-500 font-bold">BCC</Label>
                            <Input name="bcc" defaultValue={template.bcc?.join(", ") || ""} placeholder="admin@store.com" className="text-xs bg-slate-50" />
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="space-y-2">
                        <Label className="text-slate-700">Email Body Content</Label>
                        <div className="h-[400px] border border-slate-300 rounded-md overflow-hidden shadow-sm">
                            <RichTextEditor 
                                value={content} 
                                onChange={setContent} 
                                label="Design Email"
                            />
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Info size={12}/> Supported HTML tags allowed. Use variables from the sidebar.
                        </p>
                    </div>
                </form>
            </div>

            {/* --- RIGHT: VARIABLES SIDEBAR --- */}
            <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto flex-shrink-0 p-5 custom-scrollbar">
                <div className="sticky top-0 bg-slate-50 pb-2 z-10">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dynamic Variables</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Click to copy & paste into editor.</p>
                </div>

                <div className="space-y-2">
                    {AVAILABLE_VARIABLES.map((v) => (
                        <div 
                            key={v.key} 
                            onClick={() => handleCopy(v.key)}
                            className="p-3 bg-white border border-slate-200 rounded-md cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group active:scale-95"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <code className="text-xs font-bold text-blue-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{v.key}</code>
                                {copiedVar === v.key ? <Check size={14} className="text-green-600 animate-in zoom-in"/> : <Copy size={14} className="text-slate-300 group-hover:text-blue-500"/>}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* === FOOTER (FIXED) === */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Cancel</Button>
            <Button type="submit" form="template-form" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm px-6">
                {loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                Save Template
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};