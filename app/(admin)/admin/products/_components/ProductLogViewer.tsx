// File: app/admin/products/_components/ProductLogViewer.tsx

"use client";

import { useState, useEffect } from "react";
import { History, X, RefreshCw, User, Loader2, Trash2, Filter } from "lucide-react";
import { getProductActivityLogs } from "@/app/actions/admin/product/get-logs"; // পাথ ঠিক করে নেবেন
import { deleteActivityLogs } from "@/app/actions/admin/product/delete-log"; 
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ProductLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  
  // 🔥 Data States
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // 🔥 Filter State
  const [actionFilter, setActionFilter] = useState("");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 

  // প্রাথমিক লোড এবং ফিল্টার চেঞ্জ
  const fetchLogs = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) {
        setLoading(true);
        setLogs([]);
    } else {
        setLoadingMore(true);
    }

    const res = await getProductActivityLogs(currentPage, 20, actionFilter);
    
    if (res.success) {
      if (reset) {
          setLogs(res.data);
      } else {
          setLogs(prev => [...prev, ...res.data]);
      }
      setHasMore(res.hasMore);
      setPage(currentPage + 1); // পরের পেজের জন্য রেডি
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  // ড্রয়ার খুললে বা ফিল্টার পাল্টালে ডাটা রিসেট হবে
  useEffect(() => {
    if (isOpen) {
        setPage(1); // Reset page
        fetchLogs(true);
    }
  }, [isOpen, actionFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} logs?`)) return;

    const toastId = toast.loading("Deleting logs...");
    const res = await deleteActivityLogs(selectedIds);
    
    if (res.success) {
        toast.success("Logs deleted", { id: toastId });
        setSelectedIds([]);
        fetchLogs(true); // রিফ্রেশ
    } else {
        toast.error("Failed to delete", { id: toastId });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 hover:text-blue-600 transition shadow-sm text-sm"
      >
        <History size={16} /> Activity Logs
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between p-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <History size={18} /> Product History
                    </h2>
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <button 
                                onClick={handleDelete}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition"
                            >
                                <Trash2 size={14} /> ({selectedIds.length})
                            </button>
                        )}
                        <button 
                            onClick={() => fetchLogs(true)} 
                            disabled={loading}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 🔥 Filter Bar */}
                <div className="px-4 pb-3 flex gap-2">
                    <div className="relative flex-1">
                        <Filter size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATED_PRODUCT">Created</option>
                            <option value="UPDATED_PRODUCT">Updated</option>
                            <option value="ARCHIVED_PRODUCT">Archived (Trash)</option>
                            <option value="DUPLICATED_PRODUCT">Duplicated</option>
                            <option value="BULK_SMART_DELETE">Bulk Delete</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
              
              {loading && logs.length === 0 && (
                <div className="flex justify-center py-10 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              )}

              {!loading && logs.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No activity found.
                </div>
              )}

              {logs.map((log) => (
                <div 
                    key={log.id} 
                    className={`bg-white p-3 rounded border shadow-sm text-sm transition-all ${selectedIds.includes(log.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex gap-3">
                    <div className="pt-1">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(log.id)} 
                            onChange={() => toggleSelect(log.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                    {log.user?.image ? (
                                    <Image src={log.user.image} alt="" width={24} height={24} className="object-cover" />
                                    ) : (
                                    <User size={14} className="text-gray-400" />
                                    )}
                                </div>
                                <span className="font-semibold text-gray-700 text-xs truncate max-w-[120px]">
                                    {log.user?.name || "Unknown"}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <div className="mb-2 font-medium text-xs">
                            {log.action === "CREATED_PRODUCT" && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">Created product</span>}
                            {log.action === "UPDATED_PRODUCT" && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Updated product</span>}
                            {log.action === "ARCHIVED_PRODUCT" && <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Moved to trash</span>}
                            {log.action === "DUPLICATED_PRODUCT" && <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Duplicated product</span>}
                            {!["CREATED_PRODUCT", "UPDATED_PRODUCT", "ARCHIVED_PRODUCT", "DUPLICATED_PRODUCT"].includes(log.action) && 
                                <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{log.action.replace(/_/g, " ")}</span>
                            }
                        </div>

                        {log.details && (
                            <div className="bg-gray-50 p-2 rounded text-[11px] text-gray-600 font-mono border border-gray-100 break-words">
                                {log.details.name && <div><span className="font-bold">Name:</span> {log.details.name}</div>}
                                {log.details.sku && <div><span className="font-bold">SKU:</span> {log.details.sku}</div>}
                                {log.details.count && <div><span className="font-bold">Count:</span> {log.details.count} items</div>}
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 🔥 Load More Button */}
              {hasMore && (
                  <button 
                    onClick={() => fetchLogs(false)} 
                    disabled={loadingMore}
                    className="w-full py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded transition flex justify-center items-center gap-2"
                  >
                    {loadingMore ? <Loader2 size={14} className="animate-spin"/> : "Load More Logs"}
                  </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}