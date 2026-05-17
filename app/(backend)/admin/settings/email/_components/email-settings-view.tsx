// File: app/admin/settings/email/_components/email-settings-view.tsx

"use client";

import { useState } from "react";
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";
import { Settings, Mail, FileText } from "lucide-react";

import { ConfigForm } from "./config-form";
import { TemplateList } from "./template-list";
import { EmailLogsTable } from "./email-logs-table"; // Ensure this import is correct

interface Props {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  logs: EmailLog[];
  logsMeta: { total: number; pages: number };
  currentLogPage: number;          // ✅ Added
  onLogPageChange: (page: number) => void; // ✅ Added
  refreshData: () => void;
}

export const EmailSettingsView = ({ 
  config, 
  templates, 
  logs, 
  logsMeta, 
  currentLogPage, 
  onLogPageChange, 
  refreshData 
}: Props) => {
  const [activeTab, setActiveTab] = useState("config");

  const tabs = [
    { id: "config", label: "Configuration & SMTP", icon: Settings },
    { id: "templates", label: "Email Templates", icon: Mail },
    { id: "logs", label: "Email Logs", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#2271b1] text-[#2271b1] bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in">
        {activeTab === "config" && <ConfigForm config={config} refreshData={refreshData} />}
        {activeTab === "templates" && <TemplateList templates={templates} refreshData={refreshData} />}
        {activeTab === "logs" && (
            <EmailLogsTable 
                logs={logs} 
                meta={logsMeta} 
                currentPage={currentLogPage}
                onPageChange={onLogPageChange}
                refreshData={refreshData}
            />
        )}
      </div>
    </div>
  );
};