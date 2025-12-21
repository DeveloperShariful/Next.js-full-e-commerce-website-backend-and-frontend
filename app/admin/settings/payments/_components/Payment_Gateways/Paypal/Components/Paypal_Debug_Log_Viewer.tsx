//app/admin/settings/payments/_components/Payment_Gateways/Paypal/Components/Paypal_Debug_Log_Viewer.tsx

"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPaymentSystemLogs } from "@/app/actions/settings/payments/get-system-logs"
import { Loader2, Terminal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const Paypal_Debug_Log_Viewer = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      // Hardcoded to fetch only PAYPAL logs
      const res = await getPaymentSystemLogs("PAYPAL")
      if (res.success && res.data) {
        setLogs(res.data)
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading PayPal logs...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border rounded-md bg-muted/20">
        <Terminal className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No recent PayPal logs found.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] w-full rounded-md border bg-slate-950 text-slate-50 p-4 font-mono text-xs">
      {logs.map((log) => (
        <div key={log.id} className="mb-4 border-b border-slate-800 pb-2 last:border-0">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`uppercase font-bold ${log.level === 'ERROR' ? 'text-red-400' : 'text-[#0070BA]'}`}>
              [{log.level}]
            </span>
            <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
          </div>
          <p className="mb-1 text-slate-200">{log.message}</p>
          {log.context && (
            <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
              {JSON.stringify(log.context, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </ScrollArea>
  )
}