// File: app/(backend)/admin/settings/_components/email/email-settings-view.tsx

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";

import { ConfigForm } from "./config-form";
import { TemplateList } from "./template-list";
import { EmailLogsTable } from "./email-logs-table"; 

interface Props {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  logs: EmailLog[];
  logsMeta: { total: number; pages: number };
  currentLogPage: number;          
  onLogPageChange: (page: number) => void; 
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("subtab") ?? "config");

  const tabs = [
    { id: "config", label: "Configuration & SMTP" },
    { id: "templates", label: "Email Templates" },
    { id: "logs", label: "Email Logs" },
  ];

  return (
    <div className="w-full text-[13px] text-[#3c434a]">
      
      {/* WordPress subsubsub style tabs - Fully Responsive flex-wrap */}
      <ul className="list-none p-0 m-0 mb-6 text-[13px] text-[#646970] flex flex-wrap items-center gap-y-2">
        {tabs.map((tab, index) => (
          <li key={tab.id} className="inline-block m-0 p-0">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`inline-block p-0 bg-transparent border-none cursor-pointer hover:text-[#135e96] transition-colors ${
                activeTab === tab.id
                  ? "text-[#000] font-semibold"
                  : "text-[#2271b1]"
              }`}
            >
              {tab.label}
            </button>
            {index < tabs.length - 1 && <span className="mx-2 text-[#c3c4c7]">|</span>}
          </li>
        ))}
      </ul>

      {/* Content Area */}
      <div className="animate-in fade-in duration-150 w-full">
        {activeTab === "config" && <ConfigForm config={config} templates={templates} refreshData={refreshData} />}
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