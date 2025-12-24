// File: app/admin/settings/email/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
// ✅ Prisma থেকে জেনারেট হওয়া টাইপ ইমপোর্ট করছি
import { EmailConfiguration, EmailTemplate, EmailLog } from "@prisma/client";

// --- ACTIONS ---
import { getEmailConfiguration } from "@/app/actions/settings/email/email-config";
import { getEmailTemplates } from "@/app/actions/settings/email/email-templates";
import { getEmailLogs } from "@/app/actions/settings/email/email-logs";

// --- COMPONENTS ---
import { EmailSettingsView } from "./_components/email-settings-view";

// ✅ 1. Strong Interface Definition
interface EmailPageData {
  config: EmailConfiguration | null;
  templates: EmailTemplate[];
  logs: EmailLog[];
  logsMeta: { total: number; pages: number };
}

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // ✅ 2. State এ নির্দিষ্ট টাইপ বলে দেওয়া হলো
  const [data, setData] = useState<EmailPageData>({
    config: null,
    templates: [],
    logs: [],
    logsMeta: { total: 0, pages: 0 },
  });

  const [logPage, setLogPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Server Actions কল করা হচ্ছে
      const [configRes, templatesRes, logsRes] = await Promise.all([
        getEmailConfiguration(),
        getEmailTemplates(),
        getEmailLogs(logPage),
      ]);

      // ✅ 3. Type-Safe Assignment (কোনো 'any' নেই)
      // আমরা চেক করছি success true কিনা এবং data আছে কিনা
      setData({
        config: (configRes.success && configRes.data) ? configRes.data : null,
        
        // নিশ্চিত করছি এটি অ্যারে (যদি undefined আসে তবে খালি অ্যারে)
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
      
      {/* কম্পোনেন্টে প্রপস পাস করা হচ্ছে */}
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