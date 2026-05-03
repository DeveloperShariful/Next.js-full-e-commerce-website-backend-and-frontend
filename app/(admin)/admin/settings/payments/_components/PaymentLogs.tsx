//File: app/admin/settings/payments/_components/PaymentLogs.tsx

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, History, FileJson, ArrowRightLeft, Maximize2 } from "lucide-react"
import { getPaymentAuditLogs } from "@/app/actions/admin/settings/payments/payments-section-log"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

export const PaymentLogs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    const res = await getPaymentAuditLogs()
    if (res.success) {
      setLogs(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <Card className="mt-8 border-t-4 border-t-slate-500 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Payment configuration history.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
            Refresh Logs
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Entity</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 hidden sm:block">
                                <AvatarImage src={log.user?.image || ""} />
                                <AvatarFallback>{log.user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-none">{log.user?.name || "System"}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-none">{log.user?.email}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] sm:text-xs whitespace-nowrap">
                            {log.action}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {log.tableName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      {format(new Date(log.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <Maximize2 className="h-4 w-4 text-slate-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* RESPONSIVE FULL SCREEN JSON VIEWER MODAL */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {/* Mobile: 95vw width, Desktop: 85vw width. Height optimized. */}
        <DialogContent className="w-[95vw] md:max-w-[85vw] h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
            
            {/* Header */}
            <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b bg-white flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                        <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                            <FileJson className="h-5 w-5 md:h-6 md:w-6 text-blue-600" /> 
                            Log Details
                        </DialogTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-slate-100 px-1 rounded">{selectedLog?.id}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{selectedLog && format(new Date(selectedLog.createdAt), "PPpp")}</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs md:text-sm">
                        {selectedLog?.action}
                    </Badge>
                </div>
            </DialogHeader>
            
            {/* Responsive Content Area: Block on Mobile, Grid on Desktop */}
            <div className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-0">
                
                {/* Left: Old Data */}
                <div className="flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden h-[400px] md:h-full shrink-0">
                    <div className="bg-red-50/50 border-b border-red-100 px-4 py-2 md:py-3 flex items-center justify-between sticky top-0 z-10">
                        <h4 className="font-semibold text-red-700 flex items-center gap-2 text-sm md:text-base">
                            <History className="h-4 w-4" /> Old Data
                        </h4>
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-white text-[10px] md:text-xs">Before</Badge>
                    </div>
                    {/* Mobile uses auto-scroll, Desktop uses ScrollArea */}
                    <div className="flex-1 overflow-auto bg-slate-900 relative">
                        <ScrollArea className="h-full w-full p-4">
                            <pre className="text-xs font-mono text-red-50 leading-relaxed whitespace-pre-wrap break-all">
                                {selectedLog?.oldValues 
                                    ? JSON.stringify(selectedLog.oldValues, null, 2) 
                                    : "// No previous data (Creation)"}
                            </pre>
                        </ScrollArea>
                    </div>
                </div>

                {/* Right: New Data */}
                <div className="flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden h-[400px] md:h-full shrink-0">
                    <div className="bg-green-50/50 border-b border-green-100 px-4 py-2 md:py-3 flex items-center justify-between sticky top-0 z-10">
                        <h4 className="font-semibold text-green-700 flex items-center gap-2 text-sm md:text-base">
                            <ArrowRightLeft className="h-4 w-4" /> New Data
                        </h4>
                        <Badge variant="outline" className="border-green-200 text-green-700 bg-white text-[10px] md:text-xs">After</Badge>
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-900 relative">
                        <ScrollArea className="h-full w-full p-4">
                            <pre className="text-xs font-mono text-green-50 leading-relaxed whitespace-pre-wrap break-all">
                                {selectedLog?.newValues 
                                    ? JSON.stringify(selectedLog.newValues, null, 2) 
                                    : "// Data deleted"}
                            </pre>
                        </ScrollArea>
                    </div>
                </div>

            </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}