// File: app/admin/settings/email/_components/template-list.tsx

"use client";

import { useState } from "react";
import { EmailTemplate } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Zap, Users, Shield, Mail, RefreshCw } from "lucide-react";
import { TemplateEditModal } from "./template-edit-modal";
// 🚨 NEW: সরাসরি সিঙ্ক অ্যাকশন ইমপোর্ট
import { syncEmailTemplates } from "@/app/actions/admin/settings/email/email-templates";
import { toast } from "sonner";

interface Props {
  templates: EmailTemplate[];
  refreshData: () => void;
}

export const TemplateList = ({ templates, refreshData }: Props) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // রিফ্রেশ হ্যান্ডলার (Specific Logic)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // ১. প্রথমে সিঙ্ক করব (ডাটাবেস ফিক্স করার জন্য)
    const res = await syncEmailTemplates();
    
    if (res.success) {
        // ২. তারপর UI আপডেট করব
        await refreshData();
        toast.success("Templates synced successfully");
    } else {
        toast.error("Failed to sync templates");
    }
    
    setTimeout(() => {
        setIsRefreshing(false);
    }, 800);
  };

  if (!templates || templates.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500">
            <Mail size={48} className="mb-4 text-slate-300"/>
            <p className="font-medium">No templates found.</p>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="mt-4 gap-2"
            >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Syncing..." : "Initialize Templates"}
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-4">
        
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
            <span className="text-sm font-medium text-slate-500">
                Total Templates: {templates.length}
            </span>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2 h-8"
            >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Syncing..." : "Sync & Refresh"}
            </Button>
        </div>

        {/* Template Cards Loop (Same as before) */}
        {templates.map((template) => (
            <Card key={template.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-300 transition-all group">
                
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">{template.name}</h3>
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${template.isEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {template.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                        
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                            {template.recipientType === 'admin' ? <Shield size={10}/> : <Users size={10}/>}
                            {template.recipientType}
                        </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                        Subject: {template.subject}
                    </p>
                    
                    {template.triggerEvent && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase tracking-tight">
                            <Zap size={10} className="fill-orange-600"/> Trigger: {template.triggerEvent}
                        </div>
                    )}
                </div>

                <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0 gap-2 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    onClick={() => setEditingTemplate(template)}
                >
                    <Edit size={14}/> Edit
                </Button>
            </Card>
        ))}

        {editingTemplate && (
            <TemplateEditModal 
                template={editingTemplate} 
                open={!!editingTemplate} 
                onClose={() => { 
                    setEditingTemplate(null); 
                    refreshData(); // এডিট শেষে নরমাল রিফ্রেশ
                }} 
            />
        )}
    </div>
  );
};