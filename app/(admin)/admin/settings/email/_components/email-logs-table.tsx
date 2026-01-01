"use client";

import { useState } from "react";
import { EmailLog } from "@prisma/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteEmailLogs, cleanupOldLogs } from "@/app/actions/admin/settings/email/delete-logs";

interface Props {
  logs: EmailLog[];
  meta: { total: number; pages: number };
  currentPage: number;
  onPageChange: (page: number) => void;
  refreshData: () => void;
}

export const EmailLogsTable = ({ logs, meta, currentPage, onPageChange, refreshData }: Props) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // সব সিলেক্ট/আনসিলেক্ট
  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(logs.map(log => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  // সিঙ্গেল সিলেক্ট
  const toggleOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // ম্যানুয়াল ডিলেট হ্যান্ডলার
  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.length} logs?`)) return;
    
    setIsDeleting(true);
    const res = await deleteEmailLogs(selectedIds);
    if (res.success) {
        toast.success("Logs deleted");
        setSelectedIds([]);
        refreshData();
    } else {
        toast.error("Failed to delete");
    }
    setIsDeleting(false);
  };

  // রিফ্রেশ + অটো ক্লিনআপ হ্যান্ডলার
  const handleRefreshAndCleanup = async () => {
    setIsRefreshing(true);
    
    // ১. ৩০ দিনের পুরনো লগ ক্লিন করা (ব্যাকগ্রাউন্ডে)
    // এটি প্রতিবার রিফ্রেশে অটোমেটিক ক্লিন করবে
    const cleanupRes = await cleanupOldLogs();
    if (cleanupRes.success && cleanupRes.count && cleanupRes.count > 0) {
        toast.success(`Auto-cleaned ${cleanupRes.count} old logs`);
    }

    // ২. ডাটা রিফ্রেশ
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                Delivery Logs
                <Badge variant="secondary" className="ml-2">{meta.total}</Badge>
            </h3>
            <p className="text-xs text-slate-500">Logs older than 30 days are cleaned automatically on refresh.</p>
        </div>
        
        <div className="flex gap-2">
            {selectedIds.length > 0 && (
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteSelected} 
                    disabled={isDeleting}
                    className="animate-in fade-in zoom-in"
                >
                    <Trash2 size={14} className="mr-2"/> 
                    Delete ({selectedIds.length})
                </Button>
            )}
            
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshAndCleanup}
                disabled={isRefreshing}
            >
                <RefreshCw size={14} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}/> 
                {isRefreshing ? "Syncing..." : "Refresh & Clean"}
            </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox 
                            checked={selectedIds.length === logs.length && logs.length > 0}
                            onCheckedChange={(val) => toggleAll(!!val)}
                        />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Read?</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error Info</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500 flex flex-col items-center justify-center w-full">
                            <ShieldAlert className="h-10 w-10 mb-2 opacity-20"/>
                            No logs found.
                        </TableCell>
                    </TableRow>
                ) : logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                            <Checkbox 
                                checked={selectedIds.includes(log.id)}
                                onCheckedChange={(val) => toggleOne(log.id, !!val)}
                            />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {format(new Date(log.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        
                        {/* Read Status (Based on openedAt) */}
                        <TableCell>
                            {log.openedAt ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full w-fit">
                                    <Eye size={12} /> Read
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-full w-fit">
                                    <EyeOff size={12} /> Unread
                                </div>
                            )}
                        </TableCell>

                        <TableCell className="text-sm font-medium text-slate-700">
                            {log.recipient}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 truncate max-w-[200px]" title={log.subject}>
                            {log.subject}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                log.status === 'SENT' ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-red-50 text-red-700 border-red-200'
                            }>
                                {log.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-red-500 truncate max-w-[150px]" title={log.errorMessage || ""}>
                            {log.errorMessage || "-"}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-between items-center bg-white p-2 border rounded-lg">
            <span className="text-xs text-slate-500 pl-2">
                Page {currentPage} of {meta.pages}
            </span>
            <div className="flex gap-1">
                <Button 
                    variant="ghost" size="icon" className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft size={16}/>
                </Button>
                <Button 
                    variant="ghost" size="icon" className="h-8 w-8"
                    disabled={currentPage >= meta.pages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight size={16}/>
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};