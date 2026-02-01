//File: app/(admin)/admin/settings/affiliate/_components/log-viewer.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, Filter, Eye, AlertTriangle, 
  Terminal, Shield, FileJson, X, ChevronLeft, ChevronRight, 
  Trash2, Loader2, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { deleteLogsAction } from "@/app/actions/admin/settings/affiliate/_services/log-service";

interface Props {
  auditData: { logs: any[]; total: number; totalPages: number };
  systemData: { logs: any[]; total: number; totalPages: number };
  currentPage: number;
  currentTab: "AUDIT" | "SYSTEM";
}

export default function LogViewer({ auditData, systemData, currentPage, currentTab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Current Data Source based on Tab
  const currentData = currentTab === "AUDIT" ? auditData.logs : systemData.logs;
  const totalPages = currentTab === "AUDIT" ? auditData.totalPages : systemData.totalPages;

  // Reset selection on tab change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentTab, currentPage]);

  // --- Handlers: Navigation ---
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("logType", tab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", searchTerm);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // --- Handlers: Selection ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(currentData.map(log => log.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- Handlers: Actions ---
  const handleDelete = (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} logs? This action cannot be undone.`)) return;

    startTransition(async () => {
      const res = await deleteLogsAction(ids, currentTab);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
            <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-gray-700" /> System Logs
                </h2>
                <p className="text-xs text-gray-500">Track user activities and system health.</p>
            </div>
            
            <div className="flex p-1 bg-gray-200 rounded-lg">
                <button
                    onClick={() => handleTabChange("AUDIT")}
                    className={cn(
                        "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                        currentTab === "AUDIT" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                    )}
                >
                    <Shield className="w-3.5 h-3.5" /> User Audit
                </button>
                <button
                    onClick={() => handleTabChange("SYSTEM")}
                    className={cn(
                        "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                        currentTab === "SYSTEM" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                    )}
                >
                    <AlertTriangle className="w-3.5 h-3.5" /> System Events
                </button>
            </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
                <form onSubmit={handleSearch} className="relative flex-1 sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={currentTab === "AUDIT" ? "Search user, action..." : "Search error source..."}
                        className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
                <button className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Bulk Action Button */}
            {selectedIds.size > 0 && (
                <button 
                    onClick={() => handleDelete(Array.from(selectedIds))}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm animate-in fade-in slide-in-from-right-2"
                >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete Selected ({selectedIds.size})
                </button>
            )}
        </div>

        {/* --- AUDIT LOG TABLE --- */}
        {currentTab === "AUDIT" && (
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                        <tr>
                            <th className="p-4 w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    checked={currentData.length > 0 && selectedIds.size === currentData.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3">Actor</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Entity / ID</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentData.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                        checked={selectedIds.has(log.id)}
                                        onChange={() => handleSelectOne(log.id)}
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    {log.user ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                {log.user.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-xs">{log.user.name}</div>
                                                <div className="text-[10px] text-gray-500">{log.user.role}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">System / Deleted</span>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">{log.tableName}</span>
                                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]" title={log.recordId}>{log.recordId}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                    {format(new Date(log.createdAt), "dd MMM, HH:mm")}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => setSelectedLog(log)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors" title="View Details">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete([log.id])} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Delete Log">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- SYSTEM LOG TABLE --- */}
        {currentTab === "SYSTEM" && (
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                        <tr>
                            <th className="p-4 w-10">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    checked={currentData.length > 0 && selectedIds.size === currentData.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3">Level</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Message</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentData.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                        checked={selectedIds.has(log.id)}
                                        onChange={() => handleSelectOne(log.id)}
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-1 rounded border",
                                        log.level === "INFO" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                        log.level === "WARN" ? "bg-orange-50 text-orange-700 border-orange-100" :
                                        "bg-red-50 text-red-700 border-red-100"
                                    )}>
                                        {log.level}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-gray-700">
                                    {log.source}
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-600 max-w-xs truncate" title={log.message}>
                                    {log.message}
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                    {format(new Date(log.createdAt), "dd MMM, HH:mm")}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => setSelectedLog(log)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black transition-colors">
                                            <FileJson className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete([log.id])} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">
                Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
                <button 
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-1.5 border rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-1.5 border rounded hover:bg-white disabled:opacity-50 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-gray-500"/> Log Details
                    </h3>
                    <button onClick={() => setSelectedLog(null)}><X className="w-5 h-5 text-gray-500 hover:text-black"/></button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-50 font-mono text-xs">
                    
                    {/* Audit Specific View */}
                    {selectedLog.oldValues && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded border border-red-100">
                                <h4 className="font-bold text-red-600 mb-2 uppercase border-b pb-1 text-[10px] tracking-wider">Old Values</h4>
                                <pre className="whitespace-pre-wrap text-gray-600">{JSON.stringify(selectedLog.oldValues, null, 2)}</pre>
                            </div>
                            <div className="bg-white p-4 rounded border border-green-100">
                                <h4 className="font-bold text-green-600 mb-2 uppercase border-b pb-1 text-[10px] tracking-wider">New Values</h4>
                                <pre className="whitespace-pre-wrap text-gray-600">{JSON.stringify(selectedLog.newValues, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto shadow-inner border border-gray-800">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                            <span className="text-gray-500 uppercase font-bold text-[10px]">Raw JSON Payload</span>
                            <button onClick={() => {navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2)); toast.success("Copied to clipboard")}} className="text-gray-500 hover:text-white">
                                <CheckSquare className="w-3 h-3"/>
                            </button>
                        </div>
                        <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}