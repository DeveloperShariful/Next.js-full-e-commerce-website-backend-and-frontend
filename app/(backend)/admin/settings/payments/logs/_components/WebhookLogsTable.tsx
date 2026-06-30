"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatTz } from "@/lib/store-time"
import { useGlobalStore } from "@/app/providers/global-store-provider"
import { toast } from "sonner"
import { Loader2, FileJson, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { bulkDeleteWebhookLogs, autoCleanupWebhookLogs, type WebhookLogItem } from "@/app/actions/backend/settings/payments/logs-actions"

interface Props {
  initialLogs: WebhookLogItem[]
}

const PROVIDER_BADGE: Record<string, string> = {
  stripe: "bg-[#635bff] text-white",
  paypal: "bg-[#003087] text-white",
}

export function WebhookLogsTable({ initialLogs }: Props) {
  const router = useRouter()
  const { timezone } = useGlobalStore()
  const [logs, setLogs] = useState<WebhookLogItem[]>(initialLogs)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewLog, setViewLog] = useState<WebhookLogItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bulkAction, setBulkAction] = useState("-1")
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all")

  const filtered = logs.filter((l) => {
    if (filterStatus === "success") return l.processed && !l.processingError
    if (filterStatus === "failed") return !!l.processingError
    if (filterStatus === "pending") return !l.processed && !l.processingError
    return true
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([])
    else setSelectedIds(filtered.map((l) => l.id))
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleBulkApply = async () => {
    if (bulkAction === "delete") {
      if (!selectedIds.length) return toast.error("Select items first.")
      if (!confirm(`Delete ${selectedIds.length} webhook logs permanently?`)) return
      setIsProcessing(true)
      const res = await bulkDeleteWebhookLogs(selectedIds)
      if (res.success) {
        toast.success(res.message)
        setLogs((prev) => prev.filter((l) => !selectedIds.includes(l.id)))
        setSelectedIds([])
        setBulkAction("-1")
      } else toast.error(res.error)
      setIsProcessing(false)
    }

    if (bulkAction === "cleanup") {
      if (!confirm("Delete ALL webhook logs older than 30 days?")) return
      setIsProcessing(true)
      const res = await autoCleanupWebhookLogs()
      if (res.success) {
        toast.success(res.message)
        setBulkAction("-1")
        router.refresh()
      } else toast.error(res.error)
      setIsProcessing(false)
    }
  }

  const failedCount = logs.filter((l) => !!l.processingError).length
  const pendingCount = logs.filter((l) => !l.processed && !l.processingError).length

  return (
    <div className="space-y-3">

      {/* Summary Bar */}
      {(failedCount > 0 || pendingCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {failedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
              <XCircle className="w-3.5 h-3.5" />
              {failedCount} webhook{failedCount > 1 ? "s" : ""} failed — click to investigate
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-[12px] text-yellow-700">
              <Clock className="w-3.5 h-3.5" />
              {pendingCount} unprocessed
            </div>
          )}
        </div>
      )}

      {/* Bulk + Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2">
          <select
            className="h-[30px] px-2 text-[13px] border border-[#8c8f94] rounded-sm bg-white text-[#2c3338] outline-none focus:border-[#2271b1]"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={isProcessing}
          >
            <option value="-1">Bulk actions</option>
            <option value="delete">Delete selected</option>
            <option value="cleanup">Cleanup 30+ days</option>
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

          {/* Status Filter */}
          <div className="flex gap-1 ml-2">
            {(["all", "success", "failed", "pending"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setSelectedIds([]) }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors capitalize ${
                  filterStatus === s
                    ? "bg-[#2271b1] text-white border-[#2271b1]"
                    : "bg-white text-[#50575e] border-[#c3c4c7] hover:bg-[#f0f0f1]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#50575e]">
          <span>{filtered.length} of {logs.length} events</span>
          <button
            onClick={() => router.refresh()}
            className="p-1.5 rounded border border-[#c3c4c7] hover:bg-white"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse">
          <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <tr>
              <th className="py-2 px-3 w-10 text-center border-r border-[#c3c4c7]/50">
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onCheckedChange={toggleSelectAll}
                  className="scale-90"
                />
              </th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-20">Status</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-20">Provider</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Event Type</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Event ID</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327] w-[30%]">Error / Note</th>
              <th className="py-2 px-3 font-semibold text-[#1d2327]">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#8c8f94]">
                  No webhook events found.
                </td>
              </tr>
            )}
            {filtered.map((log, index) => {
              const hasFailed = !!log.processingError
              const isPending = !log.processed && !log.processingError

              return (
                <tr
                  key={log.id}
                  className={`hover:bg-[#f0f0f1] transition-colors group ${
                    hasFailed ? "bg-red-50" : index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                  }`}
                >
                  <td className="py-3 px-3 text-center align-top border-r border-[#f0f0f1]">
                    <Checkbox
                      checked={selectedIds.includes(log.id)}
                      onCheckedChange={() => toggleOne(log.id)}
                      className="scale-90 mt-0.5"
                    />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 align-top">
                    {hasFailed ? (
                      <span className="flex items-center gap-1 text-red-600 font-semibold text-[12px]">
                        <XCircle className="w-3.5 h-3.5" /> FAILED
                      </span>
                    ) : isPending ? (
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold text-[12px]">
                        <Clock className="w-3.5 h-3.5" /> PENDING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 font-semibold text-[12px]">
                        <CheckCircle className="w-3.5 h-3.5" /> OK
                      </span>
                    )}
                  </td>

                  {/* Provider */}
                  <td className="py-3 px-3 align-top">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${PROVIDER_BADGE[log.provider] || "bg-gray-200 text-gray-700"}`}>
                      {log.provider}
                    </span>
                  </td>

                  {/* Event Type */}
                  <td className="py-3 px-3 align-top">
                    <div className="font-mono text-[12px] text-[#1d2327]">{log.eventType}</div>
                    <div className="text-[11px] text-[#8c8f94] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewLog(log)}
                        className="text-[#2271b1] hover:underline"
                      >
                        View Payload
                      </button>
                    </div>
                  </td>

                  {/* Event ID */}
                  <td className="py-3 px-3 align-top font-mono text-[11px] text-[#50575e] max-w-[160px] truncate">
                    {log.eventId}
                  </td>

                  {/* Error */}
                  <td className="py-3 px-3 align-top text-[12px]">
                    {log.processingError ? (
                      <span className="text-red-600 break-words">{log.processingError}</span>
                    ) : log.retryCount > 0 ? (
                      <span className="text-yellow-600">Retried {log.retryCount}×</span>
                    ) : (
                      <span className="text-[#8c8f94]">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 align-top whitespace-nowrap text-[12px]">
                    {formatTz(new Date(log.createdAt), timezone, "dd MMM yyyy, h:mm a")}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Payload Viewer Modal */}
      <Dialog open={!!viewLog} onOpenChange={(open) => !open && setViewLog(null)}>
        <DialogContent className="w-[95vw] max-w-3xl h-[80vh] flex flex-col p-0 bg-white border-0 shadow-xl">
          <DialogHeader className="px-6 py-4 border-b bg-[#f6f7f7] flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1d2327]">
              <FileJson className="h-5 w-5 text-[#2271b1]" />
              {viewLog?.provider?.toUpperCase()} — {viewLog?.eventType}
            </DialogTitle>
            <div className="text-[11px] text-[#50575e] font-mono mt-1">
              {viewLog?.eventId} · {viewLog && formatTz(new Date(viewLog.createdAt), timezone, "dd MMM yyyy, h:mm a")}
            </div>
            {viewLog?.processingError && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-[12px] text-red-700">
                Error: {viewLog.processingError}
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full flex flex-col bg-[#1e1e1e] rounded-sm shadow-inner overflow-hidden">
              <div className="bg-[#2d2d2d] border-b border-[#404040] px-4 py-2">
                <span className="text-[#cccccc] text-[12px] font-mono">Full Webhook Payload</span>
              </div>
              <div className="flex-1 relative">
                <ScrollArea className="h-full w-full p-4">
                  <pre className="text-[12px] font-mono text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                    {viewLog?.payload
                      ? JSON.stringify(viewLog.payload, null, 2)
                      : "// No payload data"}
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
