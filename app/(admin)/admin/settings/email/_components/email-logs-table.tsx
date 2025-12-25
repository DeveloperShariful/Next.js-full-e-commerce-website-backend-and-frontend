// File: app/admin/settings/email/_components/email-logs-table.tsx

"use client";

import { EmailLog } from "@prisma/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

interface Props {
  logs: EmailLog[];
  meta: { total: number; pages: number };
  currentPage: number;
  onPageChange: (page: number) => void;
  refreshData: () => void;
}

export const EmailLogsTable = ({ logs, meta, currentPage, onPageChange, refreshData }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-700 uppercase">Delivery Logs</h3>
        <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCcw size={14} className="mr-2"/> Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error Info</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No logs found.</TableCell>
                    </TableRow>
                ) : logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                        <TableCell className="text-xs text-slate-500">
                            {format(new Date(log.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{log.recipient}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{log.subject}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                log.status === 'SENT' ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-red-50 text-red-700 border-red-200'
                            }>
                                {log.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-red-500 truncate max-w-[200px]" title={log.errorMessage || ""}>
                            {log.errorMessage || "-"}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-end gap-2 items-center">
            <span className="text-xs text-slate-500">Page {currentPage} of {meta.pages}</span>
            <Button 
                variant="outline" size="icon" 
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft size={16}/>
            </Button>
            <Button 
                variant="outline" size="icon" 
                disabled={currentPage >= meta.pages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight size={16}/>
            </Button>
        </div>
      )}
    </div>
  );
};