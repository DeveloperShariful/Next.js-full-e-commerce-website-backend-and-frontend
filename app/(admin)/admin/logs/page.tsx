// app/admin/logs/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getActivityLogs, deleteLog, clearAllLogs } from "@/app/actions/admin/log";
import { toast } from "react-hot-toast";
import { 
  ScrollText, Search, RefreshCcw, Loader2, 
  Trash2, User, Eye, X, ShieldAlert 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  
  // Modal State for JSON Details
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getActivityLogs(page, 20, searchQuery);
    if (res.success) {
      setLogs(res.data);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, searchQuery]);

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this log entry?")) return;
    const res = await deleteLog(id);
    if(res.success) {
      toast.success(res.message as string);
      fetchData();
    }
  };

  const handleClearAll = async () => {
    if(!confirm("Are you sure? This will delete ALL history.")) return;
    const res = await clearAllLogs();
    if(res.success) {
      toast.success(res.message as string);
      fetchData();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="text-blue-600" /> Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track staff actions and system events.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleClearAll} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2">
             <ShieldAlert size={16}/> Clear History
           </button>
           <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search action, user..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
           />
        </div>
        <div className="text-xs text-slate-500 font-bold">
           Total Events: {meta.total}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : logs.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-center">Date</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                             {log.user?.image ? (
                                <Image src={log.user.image} alt="" width={32} height={32} className="object-cover"/>
                             ) : <User size={16}/>}
                          </div>
                          <div>
                             <div className="font-bold text-slate-700">{log.user?.name || "System"}</div>
                             <div className="text-[10px] text-slate-400">{log.user?.role}</div>
                          </div>
                       </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                       {log.action}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                       {log.entityId || "-"}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                       {log.ipAddress || "Unknown"}
                    </td>
                    <td className="p-4 text-center text-xs text-slate-500">
                       {formatDate(log.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {log.details && (
                             <button onClick={() => setSelectedLog(log)} className="p-2 text-blue-600 hover:bg-blue-50 rounded border" title="View Details">
                                <Eye size={16} />
                             </button>
                          )}
                          <button onClick={() => handleDelete(log.id)} className="p-2 text-red-600 hover:bg-red-50 rounded border" title="Delete">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 bg-gray-50 flex justify-between items-center text-xs text-slate-500">
           <span>Page {page} of {meta.pages}</span>
           <div className="flex gap-1">
              <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
              >
                 Previous
              </button>
              <button 
                 onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                 disabled={page === meta.pages}
                 className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
              >
                 Next
              </button>
           </div>
        </div>
      </div>

      {/* === DETAILS MODAL === */}
      {selectedLog && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-lg">Log Details</h3>
                  <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-red-500"><X/></button>
               </div>
               <div className="p-6 overflow-y-auto bg-slate-900 text-green-400 font-mono text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
               </div>
               <div className="p-4 border-t bg-gray-50 text-right">
                  <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-white border rounded text-sm hover:bg-slate-100">Close</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}