// File: app/(backend)/admin/settings/_components/email/template-list.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { EmailTemplate } from "@prisma/client";
import { Edit, RefreshCw } from "lucide-react";
import { syncEmailTemplates } from "@/app/actions/backend/settings/email/email-templates";
import { toast } from "sonner";

interface Props {
  templates: EmailTemplate[];
  refreshData: () => void;
}

export const TemplateList = ({ templates, refreshData }: Props) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const res = await syncEmailTemplates();
    if (res.success) {
        refreshData();
        toast.success("Templates synced successfully");
    } else {
        toast.error("Failed to sync templates");
    }
    setTimeout(() => {
        setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="w-full text-[13px] text-[#3c434a]">

        {/* WP Top Action Bar */}
        <div className="flex justify-between items-center mb-[10px]">
            <span className="text-[13px] text-[#646970]">
                {templates.length} templates
            </span>
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-transparent border border-[#8c8f94] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] rounded-[3px] px-[10px] py-[3px] text-[13px] cursor-pointer min-h-[30px] flex items-center gap-2"
            >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Syncing..." : "Sync Templates"}
            </button>
        </div>

        {/* WP List Table - Fully Responsive */}
        <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border mb-[15px]">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                        <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Email Name</th>
                        <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Subject Line</th>
                        <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Recipient</th>
                        <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Status</th>
                        <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {templates.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-[10px] py-[20px] text-center text-[#646970]">
                                No templates found. Click sync to initialize.
                            </td>
                        </tr>
                    ) : templates.map((template, index) => (
                        <tr key={template.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                            <td className="px-[10px] py-[10px]">
                                <strong className="text-[#2271b1] block mb-1">{template.name}</strong>
                                <span className="text-[11px] text-[#646970]">Trigger: {template.triggerEvent}</span>
                            </td>
                            <td className="px-[10px] py-[10px] text-[#3c434a]">
                                {template.subject}
                            </td>
                            <td className="px-[10px] py-[10px] text-[#3c434a] capitalize">
                                {template.recipientType}
                            </td>
                            <td className="px-[10px] py-[10px]">
                                {template.isEnabled ? (
                                    <span className="text-[#007017] font-semibold">Active</span>
                                ) : (
                                    <span className="text-[#646970]">Disabled</span>
                                )}
                            </td>
                            <td className="px-[10px] py-[10px] text-right">
                                <Link
                                    href={`/admin/settings/email/templates/${template.id}/edit`}
                                    className="bg-transparent border border-[#c3c4c7] text-[#3c434a] hover:bg-[#f6f7f7] hover:border-[#8c8f94] rounded-[3px] px-[10px] py-[3px] text-[13px] cursor-pointer min-h-[30px] inline-flex items-center gap-1 no-underline"
                                >
                                    <Edit size={14}/> Edit
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
