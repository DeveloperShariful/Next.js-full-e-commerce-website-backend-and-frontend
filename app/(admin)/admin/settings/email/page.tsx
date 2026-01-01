// File: app/admin/settings/email/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";

import { getEmailConfiguration } from "@/app/actions/admin/settings/email/email-config";
// 🚨 FIX: sync এর বদলে শুধু get ইমপোর্ট করছি (Read Only)
import { getEmailTemplates } from "@/app/actions/admin/settings/email/email-templates"; 
import { getEmailLogs } from "@/app/actions/admin/settings/email/email-logs";

import { EmailSettingsView } from "./_components/email-settings-view";

interface EmailPageData {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  logs: EmailLog[];
  logsMeta: { total: number; pages: number };
}

export default function EmailSettingsPage() {
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
        // 🚨 FIX: এখানে আর sync হবে না, শুধু ডাটাবেস থেকে আনবে।
        // ফলে লগ রিফ্রেশ করলে টেমপ্লেট সিঙ্ক হবে না।
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
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Email Settings & Notifications</h1>
      
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