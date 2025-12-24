// File: app/admin/settings/email/_components/template-edit-modal.tsx

"use client";

import { useState } from "react";
import { EmailTemplate } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateEmailTemplate } from "@/app/actions/settings/email/email-templates";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface Props {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

export const TemplateEditModal = ({ template, open, onClose }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const form = e.target as HTMLFormElement;
    
    // Checkbox Handling
    const isEnabledInput = form.elements.namedItem('isEnabled') as HTMLInputElement;
    formData.set("isEnabled", String(isEnabledInput.checked));

    const res = await updateEmailTemplate(formData);
    if (res.success) {
        toast.success("Template updated successfully");
        onClose();
    } else {
        toast.error("Failed to update template");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit: {template.name}</DialogTitle>
          <DialogDescription>
            Customize the content and settings for this email notification.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
            <input type="hidden" name="id" value={template.id} />
            
            {/* Enable Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <input 
                    type="checkbox" 
                    name="isEnabled" 
                    id="isEnabled" 
                    defaultChecked={template.isEnabled} 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                    <label htmlFor="isEnabled" className="text-sm font-bold text-slate-800 cursor-pointer">Enable Notification</label>
                    <p className="text-xs text-slate-500">Uncheck to disable this email from being sent automatically.</p>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-3">
                <Label>Email Subject</Label>
                <Input name="subject" defaultValue={template.subject} className="font-medium" />
                <p className="text-[10px] text-slate-400">
                    Use variables like <code className="bg-slate-100 px-1 rounded">{'{order_number}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{customer_name}'}</code>
                </p>
            </div>

            <div className="grid gap-3">
                <Label>Email Heading (Optional)</Label>
                <Input name="heading" defaultValue={template.heading || ""} placeholder="e.g. Thanks for your order!" />
            </div>

            {/* CC / BCC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label className="text-xs uppercase text-slate-500">CC (Comma separated)</Label>
                    <Input name="cc" defaultValue={template.cc?.join(", ") || ""} placeholder="manager@store.com" className="text-xs" />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs uppercase text-slate-500">BCC (Hidden copy)</Label>
                    <Input name="bcc" defaultValue={template.bcc?.join(", ") || ""} placeholder="admin@store.com" className="text-xs" />
                </div>
            </div>

            {/* Content Editor */}
            <div className="grid gap-3">
                <Label>Email Body (HTML)</Label>
                <Textarea 
                    name="content" 
                    defaultValue={template.content} 
                    className="font-mono text-xs min-h-[250px] leading-relaxed p-4" 
                />
                <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                    <strong>Tip:</strong> You can use standard HTML tags like &lt;b&gt;, &lt;p&gt;, &lt;br&gt;, &lt;a href="..."&gt; etc.
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                    Save Changes
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};