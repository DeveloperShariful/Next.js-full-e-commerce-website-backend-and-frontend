// File: app/admin/settings/email/_components/template-list.tsx

"use client";

import { useState } from "react";
import { EmailTemplate } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Zap, Users, Shield, Mail } from "lucide-react";
import { TemplateEditModal } from "./template-edit-modal";

interface Props {
  templates: EmailTemplate[];
  refreshData: () => void;
}

export const TemplateList = ({ templates, refreshData }: Props) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  if (!templates || templates.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500">
            <Mail size={48} className="mb-4 text-slate-300"/>
            <p className="font-medium">No templates found.</p>
            <p className="text-xs">They should be generated automatically.</p>
            <Button variant="outline" size="sm" onClick={refreshData} className="mt-4">
                Refresh Templates
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-4">
        {templates.map((template) => (
            <Card key={template.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-300 transition-all group">
                
                {/* Info Section */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">{template.name}</h3>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${template.isEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {template.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                        
                        {/* Type Badge */}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                            {template.recipientType === 'admin' ? <Shield size={10}/> : <Users size={10}/>}
                            {template.recipientType}
                        </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                        Subject: {template.subject}
                    </p>
                    
                    {/* Trigger Event Tag */}
                    {template.triggerEvent && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase tracking-tight">
                            <Zap size={10} className="fill-orange-600"/> Trigger: {template.triggerEvent}
                        </div>
                    )}
                </div>

                {/* Actions Section */}
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

        {/* Edit Modal Component */}
        {editingTemplate && (
            <TemplateEditModal 
                template={editingTemplate} 
                open={!!editingTemplate} 
                onClose={() => { setEditingTemplate(null); refreshData(); }} 
            />
        )}
    </div>
  );
};