// File Location: app/admin/logs/_components/logs-table.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, X, Eye } from "lucide-react";
import { deleteLog, deleteBulkLogs } from "@/app/actions/backend/all-activity-log/all-activity-log";
import { ActivityLogType } from "../types";

interface LogsTableProps {
  logs: ActivityLogType[];
}

export const LogsTable = ({ logs }: LogsTableProps) => {
  const router = useRouter();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bulkAction, setBulkAction] = useState<string>("");

  // Modal State for JSON Details
  const [selectedLogData, setSelectedLogData] = useState<any | null>(null);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(cid => cid !== id));
    else setSelectedIds(prev => [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) setSelectedIds([]);
    else setSelectedIds(logs.map(c => c.id));
  };

  // --- HANDLERS ---
  const handleApplyBulkAction = () => {
    if (!bulkAction) return toast.error("Please select a bulk action.");
    if (selectedIds.length === 0) return toast.error("Please select at least one log.");

    if (bulkAction === "delete") {
      if (!confirm("Are you sure you want to permanently delete selected logs?")) return;

      startTransition(async () => {
          const res = await deleteBulkLogs(selectedIds);
          if (res.success) {
              toast.success(res.message);
              setSelectedIds([]);
              setBulkAction("");
              router.refresh();
          } else {
              toast.error(res.error);
          }
      });
    }
  };

  const handleSingleDelete = (id: string) => {
      if (!confirm("Permanently delete this log entry?")) return;
      
      startTransition(async () => {
          const res = await deleteLog(id);
          if (res.success) {
              toast.success(res.message);
              router.refresh();
          } else toast.error(res.error);
      });
  };

  return (
    <div className={`transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        
        {/* Top Bulk Actions Bar */}
        <div className="flex items-center gap-1 mb-2 mt-4">
            <select 
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm min-w-[150px] rounded-[3px]"
            >
                <option value="">Bulk actions</option>
                <option value="delete">Delete permanently</option>
            </select>
            <button 
                onClick={handleApplyBulkAction}
                disabled={isPending}
                className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
                {isPending && bulkAction ? <Loader2 size={14} className="animate-spin"/> : null}
                Apply
            </button>
        </div>

        {/* The Classic WP Table */}
        <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr className="border-b border-[#c3c4c7]">
                        <th className="w-[2.2em] py-2 px-2 text-center font-normal">
                            <input 
                                type="checkbox" 
                                className="border-[#8c8f94] mt-1"
                                checked={selectedIds.length === logs.length && logs.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="py-2 px-3 font-medium text-[#2c3338] min-w-[200px]">User</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Action</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Module (Entity)</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Entity ID</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">IP Address</th>
                        <th className="py-2 px-3 font-medium text-[#2c3338]">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                    {logs.length === 0 ? (
                        <tr><td colSpan={7} className="py-4 px-3 text-center text-[#646970]">No logs found for this filter.</td></tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} className={`hover:bg-[#f6f7f7] group ${selectedIds.includes(log.id) ? 'bg-[#ffffea]' : ''}`}>
                                <td className="py-3 px-2 text-center align-top">
                                    <input 
                                        type="checkbox" 
                                        className="border-[#8c8f94] mt-1"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelect(log.id)}
                                    />
                                </td>
                                
                                <td className="py-3 px-3 align-top">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#f0f0f1] border border-[#c3c4c7] shrink-0">
                                            {log.user?.image ? (
                                                <img src={log.user.image} alt="" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#8c8f94] font-bold text-[14px]">
                                                    {log.user?.name ? log.user.name.charAt(0) : "S"}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-bold text-[#2271b1] block leading-none">
                                                {log.user?.name || "System"}
                                            </span>
                                            <span className="text-[11px] text-[#646970]">{log.user?.email || "internal"}</span>
                                        </div>
                                    </div>
                                    
                                    {/* WP Style Row Actions (Visible on Hover) */}
                                    <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2 pl-[40px]">
                                        <button onClick={() => setSelectedLogData(log)} className="text-[#2271b1] hover:underline flex items-center gap-0.5"><Eye size={12}/> View details</button>
                                        <span className="text-[#c3c4c7]">|</span>
                                        <button onClick={() => handleSingleDelete(log.id)} className="text-[#d63638] hover:underline">Delete</button>
                                    </div>
                                </td>
                                
                                <td className="py-3 px-3 align-top">
                                    <span className="bg-[#f0f0f1] border border-[#c3c4c7] px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono text-[#3c434a]">
                                        {log.action}
                                    </span>
                                </td>
                                
                                <td className="py-3 px-3 align-top text-[#3c434a] capitalize">
                                    {log.entityType || "—"}
                                </td>

                                <td className="py-3 px-3 align-top text-[#646970] font-mono text-[11px]">
                                    {log.entityId || "—"}
                                </td>
                                
                                <td className="py-3 px-3 align-top text-[#646970] font-mono text-[12px]">
                                    {log.ipAddress || "—"}
                                </td>

                                <td className="py-3 px-3 align-top text-[#3c434a]">
                                    {format(new Date(log.createdAt), "MMM d, yyyy")}
                                    <br/>
                                    <span className="text-[11px] text-[#646970]">{format(new Date(log.createdAt), "h:mm a")}</span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* ========================================== */}
        {/* WP STYLE MODAL FOR JSON DETAILS            */}
        {/* ========================================== */}
        {selectedLogData && (
            <div className="fixed inset-0 bg-[#000]/60 z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3px] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[#c3c4c7]">
                    
                    {/* Modal Header */}
                    <div className="p-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7]">
                        <h3 className="font-semibold text-[#1d2327] m-0 text-[14px]">Log Details: {selectedLogData.action}</h3>
                        <button onClick={() => setSelectedLogData(null)} className="text-[#646970] hover:text-[#d63638]"><X size={18}/></button>
                    </div>
                    
                    {/* Modal Body (Code View) */}
                    <div className="p-4 overflow-y-auto bg-[#1e1e1e] text-[#a6e22e] font-mono text-[13px] leading-relaxed">
                        <pre className="whitespace-pre-wrap m-0">
                            {selectedLogData.details 
                                ? JSON.stringify(selectedLogData.details, null, 2) 
                                : "// No additional metadata recorded for this event."}
                        </pre>
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="p-3 border-t border-[#c3c4c7] bg-[#f6f7f7] text-right">
                        <button 
                            onClick={() => setSelectedLogData(null)} 
                            className="border border-[#8c8f94] bg-white hover:bg-[#f0f0f1] text-[#3c434a] h-[30px] px-4 text-[13px] rounded-[3px] font-medium shadow-sm transition-colors"
                        >
                            Close window
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};