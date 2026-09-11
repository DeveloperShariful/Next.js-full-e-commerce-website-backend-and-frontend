// File: app/(backend)/admin/settings/_components/email/email-log-table.tsx

"use client";

import { useEffect, useState } from "react";
import { EmailLog } from "@prisma/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Search, Trash2, X, Eye, EyeOff, ShieldAlert, Loader2, MailOpen, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { deleteEmailLogs, cleanupOldLogs } from "@/app/actions/backend/settings/email/delete-logs";
import { getEmailLogPreview } from "@/app/actions/backend/settings/email/email-logs";

// Must match the `limit` used in getEmailLogs (app/actions/backend/settings/email/email-logs.ts)
const PAGE_SIZE = 20;

// getEmailLogs() list query ইচ্ছাকৃতভাবে htmlBody select করে না (speed-এর জন্য) —
// তাই list-এর row type পুরো Prisma EmailLog না, সেটা বাদ দেওয়া একটা টাইপ
type EmailLogRow = Omit<EmailLog, "htmlBody">;

interface Props {
  logs: EmailLogRow[];
  meta: { total: number; pages: number };
  currentPage: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearch: (query: string) => void;
  refreshData: () => void;
}

export const EmailLogsTable = ({ logs, meta, currentPage, onPageChange, search, onSearch, refreshData }: Props) => {
  const { timezone } = useGlobalStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [pageInput, setPageInput] = useState(String(currentPage));

  // Row-এ ক্লিক করলে আসল পাঠানো HTML preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLog, setPreviewLog] = useState<{ subject: string; recipient: string; createdAt: Date | string; htmlBody: string | null } | null>(null);

  const openPreview = async (id: string) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewLog(null);
    const res = await getEmailLogPreview(id);
    if (res.success && res.log) {
      setPreviewLog(res.log);
    } else {
      toast.error("Preview লোড করা যায়নি");
      setPreviewOpen(false);
    }
    setPreviewLoading(false);
  };

  // Keep the search box / page box in sync if the parent state changes externally
  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => setPageInput(String(currentPage)), [currentPage]);

  // Clear stale selections whenever the visible page/result set changes
  useEffect(() => setSelectedIds([]), [logs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), Math.max(meta.pages, 1));
    onPageChange(clamped);
  };

  const submitPageInput = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) goToPage(parsed);
    else setPageInput(String(currentPage));
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPageInput();
  };

  // Select / deselect all
  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(logs.map(log => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Single select
  const toggleOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Manual delete handler
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

  // Refresh + auto-cleanup handler
  const handleRefreshAndCleanup = async () => {
    setIsRefreshing(true);
    
    // 1. Clean logs older than 30 days (in background)
    // Runs automatically on every refresh
    const cleanupRes = await cleanupOldLogs();
    if (cleanupRes.success && cleanupRes.count && cleanupRes.count > 0) {
        toast.success(`Auto-cleaned ${cleanupRes.count} old logs`);
    }

    // 2. Refresh data
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-3">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2 whitespace-nowrap">
                Delivery Logs
                <Badge variant="secondary">{meta.total}</Badge>
            </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:flex-1 lg:justify-end">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search recipient or subject..."
                    className="h-8 pl-8 pr-7 text-xs"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </form>

            <div className="flex gap-2 shrink-0">
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
                    title="Logs older than 30 days are cleaned automatically on refresh."
                >
                    <RefreshCw size={14} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}/>
                    {isRefreshing ? "Syncing..." : "Refresh & Clean"}
                </Button>
            </div>
        </div>
      </div>
      {search && (
        <p className="text-xs text-slate-500 -mt-1 px-1">
            Showing results for <span className="font-medium text-slate-700">&ldquo;{search}&rdquo;</span> — {meta.total} match{meta.total === 1 ? "" : "es"}.
        </p>
      )}

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
                            {search ? `No logs match "${search}".` : "No logs found."}
                        </TableCell>
                    </TableRow>
                ) : logs.map(log => (
                    <TableRow
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => openPreview(log.id)}
                        title="ক্লিক করে আসল email preview দেখুন"
                    >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={selectedIds.includes(log.id)}
                                onCheckedChange={(val) => toggleOne(log.id, !!val)}
                            />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {formatTz(new Date(log.createdAt), timezone, "MMM d, h:mm a")}
                        </TableCell>
                        
                        {/* Read Status — Clicked (নির্ভরযোগ্য, real action) আর
                            Opened (pixel-based, Apple/Gmail-এর preload-এ ভুল
                            positive হতে পারে) আলাদা করে দেখানো হচ্ছে */}
                        <TableCell>
                            {log.clickedAt ? (
                                <div className="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded-full w-fit" title={`Clicked ${formatTz(new Date(log.clickedAt), timezone, "MMM d, h:mm a")}`}>
                                    <MousePointerClick size={12} /> Clicked
                                </div>
                            ) : log.openedAt ? (
                                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full w-fit" title="Pixel-based — Apple/Gmail-এর privacy protection false positive দিতে পারে">
                                    <Eye size={12} /> Opened
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
                        <TableCell className="text-sm text-slate-600 truncate max-w-[200px] group" title={log.subject}>
                            <span className="inline-flex items-center gap-1.5">
                                {log.subject}
                                <MailOpen size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                            </span>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                log.status === 'SENT' ? 'bg-green-50 text-green-700 border-green-200' :
                                // SUPPRESSED = ইচ্ছাকৃত skip (bounced address), FAILED-এর মতো আসল error নয়
                                log.status === 'SUPPRESSED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
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
      {meta.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-white p-2.5 border rounded-lg">
            <span className="text-xs text-slate-500 pl-1 order-2 sm:order-1">
                Showing <span className="font-medium text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                {"–"}
                <span className="font-medium text-slate-700">{(currentPage - 1) * PAGE_SIZE + logs.length}</span>
                {" of "}
                <span className="font-medium text-slate-700">{meta.total}</span> logs
            </span>

            <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(1)}
                    title="First page"
                >
                    <ChevronsLeft size={14}/>
                </Button>
                <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    title="Previous page"
                >
                    <ChevronLeft size={14}/>
                </Button>

                <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 mx-1">
                    <Input
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={submitPageInput}
                        className="h-8 w-11 text-center text-xs px-1"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">of {meta.pages}</span>
                </form>

                <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    disabled={currentPage >= meta.pages}
                    onClick={() => goToPage(currentPage + 1)}
                    title="Next page"
                >
                    <ChevronRight size={14}/>
                </Button>
                <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    disabled={currentPage >= meta.pages}
                    onClick={() => goToPage(meta.pages)}
                    title="Last page"
                >
                    <ChevronsRight size={14}/>
                </Button>
            </div>
        </div>
      )}

      {/* Email Preview Modal — আসল পাঠানো HTML দেখায় (স্টোর করা htmlBody থেকে) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-semibold text-slate-700">
              {previewLog ? previewLog.subject : "Email Preview"}
            </DialogTitle>
            {previewLog && (
              <p className="text-xs text-slate-500">
                To: {previewLog.recipient} · {formatTz(new Date(previewLog.createdAt), timezone, "MMM d, yyyy · h:mm a")}
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-slate-100">
            {previewLoading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin" /> Loading preview...
              </div>
            ) : previewLog?.htmlBody ? (
              <iframe
                title="Email preview"
                srcDoc={previewLog.htmlBody}
                sandbox="allow-popups allow-same-origin"
                className="w-full h-[65vh] bg-white border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 px-6 text-center">
                <ShieldAlert size={22} className="opacity-40" />
                <p className="text-sm">এই email-এর জন্য কোনো preview নেই — এই feature যোগ হওয়ার আগে পাঠানো হয়েছিল।</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};