"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";

import { getEmailConfiguration } from "@/app/actions/backend/settings/email/email-config";
import { getEmailTemplates } from "@/app/actions/backend/settings/email/email-templates"; 
import { getEmailLogs } from "@/app/actions/backend/settings/email/email-logs";

// সাব-কম্পোনেন্ট ইমপোর্ট (আগের email/ ফোল্ডারের ভেতরের রিলেটিভ পাথ বজায় রাখা হয়েছে)
import { EmailSettingsView } from "./email-settings-view";

interface EmailPageData {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  logs: EmailLog[];
  logsMeta: { total: number; pages: number };
}

export default function EmailTab() {
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState<EmailPageData>({
    config: null,
    templates: [],
    logs: [],
    logsMeta: { total: 0, pages: 0 },
  });

  const [logPage, setLogPage] = useState(1);

  const fetchData = async () => {
    try {
      const [configRes, templatesRes, logsRes] = await Promise.all([
        getEmailConfiguration(),
        getEmailTemplates(), 
        getEmailLogs(logPage),
      ]);

      setData({
        config: (configRes.success && configRes.data) ? configRes.data : null,
        templates: (templatesRes.success && Array.isArray(templatesRes.data)) ? templatesRes.data : [],
        logs: (logsRes.success && Array.isArray(logsRes.logs)) ? logsRes.logs : [],
        logsMeta: { 
            total: logsRes.success ? (logsRes.total || 0) : 0, 
            pages: logsRes.success ? (logsRes.pages || 0) : 0 
        },
      });

    } catch (error) {
      console.error("Error fetching email settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [logPage]);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2271b1]" size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Email Settings & Notifications</h2>
        <p className="text-slate-500 text-xs mt-1">
          Configure SMTP, customize email templates, and view system email logs.
        </p>
      </div>
      
      <EmailSettingsView 
        config={data.config}
        templates={data.templates}
        logs={data.logs}
        logsMeta={data.logsMeta}
        currentLogPage={logPage}
        onLogPageChange={setLogPage}
        refreshData={fetchData} 
      />
    </div>
  );
}