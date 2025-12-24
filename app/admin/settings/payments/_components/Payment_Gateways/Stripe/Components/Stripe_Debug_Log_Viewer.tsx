//app/admin/settings/payments/_components/Payment_Gateways/Stripe/Components/Stripe_Debug_Log_Viwer.tsx
"use client"

import { useEffect, useState } from "react"
import { getStripeLogs } from "@/app/actions/admin/settings/payments/stripe/get-system-logs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const Stripe_Debug_Log_Viewer = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    const res = await getStripeLogs()
    if (res.success) {
      setLogs(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
    // প্রতি ১০ সেকেন্ড পর পর রিফ্রেশ করবে (Live Feel দেওয়ার জন্য)
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
        <p>No recent logs found.</p>
        <p className="text-xs mt-1">Make sure "Debug Log" is enabled in Advanced settings.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-900 text-slate-300 font-mono text-xs">
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {log.status === 'SUCCESS' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="font-bold text-white">{log.action}</span>
              </div>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-slate-400 mb-2">{log.message}</p>
            
            {/* Request/Response Details (Optional: Click to expand) */}
            {log.metadata && (
                <div className="bg-black/50 p-2 rounded text-[10px] overflow-x-auto">
                    <pre>{JSON.stringify(JSON.parse(log.metadata as string), null, 2)}</pre>
                </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}