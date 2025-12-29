// File Location: app/admin/orders/_components/email-logs.tsx

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { getEmailLogs } from "@/app/actions/admin/order/get-email-logs";

export const EmailLogs = ({ orderId }: { orderId: string }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await getEmailLogs(orderId);
      if (res.success) {
        setLogs(res.data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [orderId]);

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
          <Mail size={14} /> Email History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="text-xs text-slate-400 italic py-2">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-4 text-center border border-dashed rounded">
            No emails sent for this order yet.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 items-start relative">
                <div className="mt-0.5">
                    {log.status === "SENT" ? <CheckCircle size={14} className="text-green-500"/> : <Clock size={14} className="text-amber-500"/>}
                </div>
                <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-800">{log.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>To: {log.recipient}</span>
                        <span>•</span>
                        <span>{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
                        {log.openedAt && <span className="text-blue-600">• Opened</span>}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};