//File 4: app/admin/settings/payments/logs/_components/PaymentLogsTable.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatTz } from "@/lib/store-time"
import { useGlobalStore } from "@/app/providers/global-store-provider"
import { toast } from "sonner"
import { Loader2, Eye, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { bulkDeletePaymentLogs, autoCleanupOldLogs } from "@/app/actions/backend/settings/payments/logs-actions"

interface LogItem {
  id: string
  type: string 
  level: string
  title: string
  message: string
  user: string
  context: any
  createdAt: Date
}

interface Props {
  initialLogs: LogItem[]
}

export const PaymentLogsTable = ({ initialLogs }: Props) => {
  const router = useRouter()
  const { timezone } = useGlobalStore()
  const [logs, setLogs] = useState<LogItem[]>(initialLogs)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("-1")

  // Level Badge Helper
  const getLevelBadge = (level: string, type: string) => {
    if (type === "ADMIN_ACTION") return <span className="text-[#2271b1] font-semibold text-[13px]">SETTING</span>
    if (level === "ERROR" || level === "CRITICAL") return <span className="text-[#d63638] font-semibold text-[13px]">ERROR</span>
    if (level === "WARN") return <span className="text-[#dba617] font-semibold text-[13px]">WARNING</span>
    return <span className="text-[#00a32a] font-semibold text-[13px]">SUCCESS</span>
  }

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) setSelectedIds([])
    else setSelectedIds(logs.map(l => l.id))
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  // Handle Bulk Action (Apply Button)
  const handleBulkApply = async () => {
    if (bulkAction === "-1") return;

    if (bulkAction === "delete") {
      if (selectedIds.length === 0) {
        toast.error("Please select items to delete.");
        return;
      }
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;
      
      setIsProcessing(true)
      const itemsToDelete = logs.filter(l => selectedIds.includes(l.id)).map(l => ({ id: l.id, type: l.type }))
      
      const res = await bulkDeletePaymentLogs(itemsToDelete)
      if (res.success) {
        toast.success(res.message)
        setLogs(logs.filter(l => !selectedIds.includes(l.id)))
        setSelectedIds([])
        setBulkAction("-1")
        router.refresh()
      } else toast.error(res.error)
      setIsProcessing(false)
    }

    if (bulkAction === "cleanup") {
      if (!confirm("This will permanently delete all logs older than 30 days. Proceed?")) return;
      setIsProcessing(true)
      const res = await autoCleanupOldLogs()
      if (res.success) {
        toast.success(res.message)
        setBulkAction("-1")
        router.refresh()
      } else toast.error(res.error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-3">
      
      {/* WordPress Style Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        
        {/* Left Side: Bulk Actions Dropdown */}
        <div className="flex items-center gap-2">
          <select 
            className="h-[30px] px-2 text-[13px] border border-[#8c8f94] rounded-sm text-[#2c3338] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={isProcessing}
          >
            <option value="-1">Bulk actions</option>
            <option value="delete">Delete permanently</option>
            <option value="cleanup">Cleanup Logs (30+ days)</option>
          </select>
          <Button 
             variant="outline" 
             size="sm" 
             onClick={handleBulkApply} 
             disabled={bulkAction === "-1" || isProcessing}
             className="h-[30px] px-3 text-[13px] font-normal border-[#8c8f94] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1]"
           >
             {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
           </Button>
        </div>
        
        {/* Right Side: Item Count */}
        <div className="text-[13px] text-[#3c434a]">
           {logs.length} items
        </div>

      </div>

      {/* WooCommerce Style Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse">
          <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <tr>
              <th className="py-2 px-3 w-10 text-center border-r border-[#c3c4c7]/50">
                <Checkbox checked={logs.length > 0 && selectedIds.length === logs.length} onCheckedChange={toggleSelectAll} className="scale-90" />
              </th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Level</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Source / Title</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-[40%]">Message</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">User</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#8c8f94]">No logs recorded yet.</td>
              </tr>
            )}

            {logs.map((log, index) => (
              <tr key={log.id} className={`${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"} hover:bg-[#f0f0f1] transition-colors group`}>
                <td className="py-3 px-3 text-center align-top border-r border-[#f0f0f1]">
                  <Checkbox checked={selectedIds.includes(log.id)} onCheckedChange={() => toggleSelect(log.id)} className="scale-90 mt-0.5" />
                </td>
                <td className="py-3 px-3 align-top">{getLevelBadge(log.level, log.type)}</td>
                
                {/* Title with hover actions (WP Style) */}
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-[#1d2327]">{log.title}</div>
                  <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedLog(log)} className="text-[#2271b1] hover:text-[#0a4b78] bg-transparent border-none p-0 cursor-pointer">
                      View Details
                    </button>
                  </div>
                </td>
                
                <td className="py-3 px-3 align-top text-[#50575e] break-words">{log.message}</td>
                <td className="py-3 px-3 align-top">{log.user}</td>
                <td className="py-3 px-3 align-top whitespace-nowrap">{formatTz(new Date(log.createdAt), timezone, "MMM d, yyyy h:mm a")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7]">
            <tr>
              <th className="py-2 px-3 w-10 text-center border-r border-[#c3c4c7]/50">
                <Checkbox checked={logs.length > 0 && selectedIds.length === logs.length} onCheckedChange={toggleSelectAll} className="scale-90" />
              </th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Level</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Source / Title</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Message</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">User</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Date</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* JSON VIEWER MODAL */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-[95vw] max-w-3xl h-[80vh] flex flex-col p-0 bg-white border-0 shadow-xl">
            <DialogHeader className="px-6 py-4 border-b bg-[#f6f7f7] flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 text-lg font-normal text-[#1d2327]">
                    <FileJson className="h-5 w-5 text-[#2271b1]" /> Log Details
                </DialogTitle>
                <div className="text-[12px] text-[#50575e] font-mono mt-1">ID: {selectedLog?.id} | Date: {selectedLog && formatTz(new Date(selectedLog.createdAt), timezone, "dd MMM yyyy, h:mm a")}</div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden p-6 bg-white">
                <div className="h-full flex flex-col bg-[#1e1e1e] rounded-sm shadow-inner overflow-hidden">
                   <div className="bg-[#2d2d2d] border-b border-[#404040] px-4 py-2 flex items-center justify-between">
                       <span className="text-[#cccccc] text-[12px] font-mono">Raw Context Data</span>
                   </div>
                   <div className="flex-1 relative">
                       <ScrollArea className="h-full w-full p-4">
                           <pre className="text-[13px] font-mono text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                               {selectedLog?.context 
                                   ? JSON.stringify(selectedLog.context, null, 2) 
                                   : "// No context data available for this log."}
                           </pre>
                       </ScrollArea>
                   </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}