// File: app/(backend)/admin/settings/_components/email/email-settings-view.tsx

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";
import { Settings2, FileText, ScrollText } from "lucide-react";

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
  logSearch: string;
  onLogSearch: (query: string) => void;
  refreshData: () => void;
}

export const EmailSettingsView = ({
  config,
  templates,
  logs,
  logsMeta,
  currentLogPage,
  onLogPageChange,
  logSearch,
  onLogSearch,
  refreshData
}: Props) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("subtab") ?? "config");

  const tabs = [
    { id: "config", label: "Configuration & SMTP", icon: Settings2 },
    { id: "templates", label: "Email Templates", icon: FileText },
    { id: "logs", label: "Email Logs", icon: ScrollText },
  ];

  return (
    <div className="w-full text-[13px] text-[#3c434a]">

      {/* Modern underline tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors outline-none ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={15} className={isActive ? "text-blue-600" : "text-slate-400"} />
              {tab.label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

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
                search={logSearch}
                onSearch={onLogSearch}
                refreshData={refreshData}
            />
        )}
      </div>
    </div>
  );
};