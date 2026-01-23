// File: app/admin/products/_components/ProductLogViewer.tsx
"use client";

import { useState, useEffect } from "react";
import { History, X, RefreshCw, User, Loader2, Trash2, Filter, ArrowRight, Package } from "lucide-react";
import { getProductActivityLogs } from "@/app/actions/admin/product/get-logs"; 
import { deleteActivityLogs } from "@/app/actions/admin/product/delete-log"; 
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ProductLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [actionFilter, setActionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 

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
      setPage(currentPage + 1); 
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (isOpen) {
        setPage(1); 
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
        fetchLogs(true); 
    } else {
        toast.error("Failed to delete", { id: toastId });
    }
  };

  const formatValue = (val: any) => {
    if (val === 0) return "0"; 
    if (val === false) return "False";
    if (val === true) return "True";
    if (val === "" || val === null || val === undefined) return <span className="text-gray-400 italic">Empty</span>;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const renderDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    
    // 🔥 Remove productName from the loop so it doesn't show in diffs
    const { productName, ...rest } = details;
    
    const entries = Object.entries(rest);
    if (entries.length === 0) return null;

    return (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2 space-y-3">
            {entries.map(([key, value]: [string, any]) => {
                const isDiff = value && typeof value === 'object' && ('old' in value || 'new' in value);

                if (isDiff) {
                    return (
                        <div key={key} className="flex flex-col border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                            <span className="font-bold capitalize text-gray-700 mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            
                            <div className="flex flex-col gap-1 pl-2">
                                <div className="flex items-start gap-2 text-xs bg-green-50 border border-green-100 p-1.5 rounded">
                                    <span className="font-bold text-green-700 min-w-[30px]">New:</span>
                                    <span className="text-gray-800 break-all font-medium">
                                        {formatValue(value.new)}
                                    </span>
                                </div>

                                <div className="flex items-start gap-2 text-xs bg-red-50 border border-red-100 p-1.5 rounded opacity-80">
                                    <span className="font-bold text-red-600 min-w-[30px]">Old:</span>
                                    <span className="text-gray-500 break-all line-through decoration-red-400">
                                        {formatValue(value.old)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div key={key} className="flex gap-2 text-xs">
                        <span className="font-bold capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-800 break-all">{formatValue(value)}</span>
                    </div>
                );
            })}
        </div>
    );
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
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
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

              {logs.map((log) => {
                // 🔥 EXTRACT PRODUCT NAME
                const productName = log.details?.productName;

                return (
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
                            {/* Header: User & Time */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                        {log.user?.image ? (
                                        <Image src={log.user.image} alt="" width={24} height={24} className="object-cover" />
                                        ) : (
                                        <User size={14} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-700 text-xs truncate max-w-[120px]">
                                            {log.user?.name || "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="mb-2 font-medium text-xs">
                                {log.action === "CREATED_PRODUCT" && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Created product</span>}
                                {log.action === "UPDATED_PRODUCT" && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Updated product</span>}
                                {log.action === "ARCHIVED_PRODUCT" && <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Moved to trash</span>}
                                {log.action === "DUPLICATED_PRODUCT" && <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Duplicated product</span>}
                                {!["CREATED_PRODUCT", "UPDATED_PRODUCT", "ARCHIVED_PRODUCT", "DUPLICATED_PRODUCT"].includes(log.action) && 
                                    <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{log.action.replace(/_/g, " ")}</span>
                                }
                            </div>

                            {/* 🔥 PRODUCT NAME DISPLAY (Updated Logic) */}
                            {productName && (
                                <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-600">
                                    <Package size={14} className="text-gray-400"/>
                                    <span className="font-bold text-gray-800">{productName}</span>
                                </div>
                            )}

                            {renderDetails(log.details)}
                            
                        </div>
                    </div>
                    </div>
                );
              })}

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