// File: app/admin/products/_components/ProductLogViewer.tsx

"use client";

import { useState, useEffect } from "react";
import { History, X, RefreshCw, User, Loader2, Trash2, Filter, Package, ArrowRight } from "lucide-react";
import { getProductActivityLogs, deleteActivityLogs } from "@/app/actions/backend/product/product-logs"; 
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
    if (val === "" || val === null || val === undefined) return <span className="text-[#8c8f94] italic">Empty</span>;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  // 🔥 Visual Diff Render Logic (Advanced Feature)
  const renderDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    
    const { productName, ...rest } = details;
    
    const entries = Object.entries(rest);
    if (entries.length === 0) return null;

    return (
        <div className="bg-[#f0f0f1] p-3 rounded-[3px] border border-[#e2e4e7] mt-3 space-y-3 shadow-inner">
            {entries.map(([key, value]: [string, any]) => {
                const isDiff = value && typeof value === 'object' && ('old' in value || 'new' in value);

                if (isDiff) {
                    return (
                        <div key={key} className="flex flex-col border-b border-[#c3c4c7] last:border-0 pb-2 last:pb-0">
                            <span className="font-semibold capitalize text-[#1d2327] mb-1.5 text-[12px]">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            
                            <div className="flex items-center gap-2 text-[12px]">
                                {/* OLD Value */}
                                <div className="flex-1 bg-[#fef2f2] border border-[#fecaca] p-1.5 rounded-[2px] text-[#991b1b] line-through decoration-red-400/50 break-all opacity-80 shadow-sm">
                                    {formatValue(value.old)}
                                </div>
                                
                                <ArrowRight size={14} className="text-[#8c8f94] shrink-0"/>
                                
                                {/* NEW Value */}
                                <div className="flex-1 bg-[#f0fdf4] border border-[#bbf7d0] p-1.5 rounded-[2px] text-[#166534] font-medium break-all shadow-sm">
                                    {formatValue(value.new)}
                                </div>
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div key={key} className="flex gap-2 text-[12px] border-b border-[#e2e4e7] last:border-0 pb-1.5 last:pb-0">
                        <span className="font-semibold capitalize text-[#1d2327]">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-[#50575e] break-all">{formatValue(value)}</span>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <>
      {/* 🚀 WP Style Secondary Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] text-[13px] rounded-[3px] hover:bg-[#f0f0f1] transition-colors shadow-sm flex items-center gap-1.5"
      >
        <History size={14} className="text-[#8c8f94]"/> Activity Logs
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Slide Panel */}
          <div className="relative w-full max-w-md bg-[#f0f0f1] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#c3c4c7]">
            
            {/* Header Area */}
            <div className="flex flex-col border-b border-[#c3c4c7] bg-white">
                <div className="flex items-center justify-between p-4">
                    <h2 className="font-normal text-[#1d2327] text-[18px] flex items-center gap-2">
                        <History size={18} className="text-[#8c8f94]" /> Product History
                    </h2>
                    <div className="flex items-center gap-1">
                        {selectedIds.length > 0 && (
                            <button 
                                onClick={handleDelete}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#fef2f2] border border-[#fecaca] text-[#d63638] hover:bg-[#d63638] hover:text-white rounded-[3px] text-[12px] transition-colors"
                            >
                                <Trash2 size={12} /> Delete ({selectedIds.length})
                            </button>
                        )}
                        <button 
                            onClick={() => fetchLogs(true)} 
                            disabled={loading}
                            className="p-1.5 text-[#2271b1] hover:bg-[#f0f6fc] rounded-[3px] transition-colors border border-transparent hover:border-[#2271b1]"
                            title="Refresh Logs"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 text-[#8c8f94] hover:text-[#d63638] hover:bg-[#fef2f2] rounded-[3px] transition-colors border border-transparent hover:border-[#fecaca]"
                            title="Close Panel"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="px-4 pb-3 flex gap-2">
                    <div className="relative flex-1">
                        <Filter size={12} className="absolute left-2.5 top-2 text-[#8c8f94]"/>
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full pl-7 pr-2 py-[3px] text-[12px] border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] bg-white text-[#3c434a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
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

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              
              {loading && logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-[#8c8f94] gap-2">
                  <Loader2 size={24} className="animate-spin text-[#2271b1]" />
                  <span className="text-[12px]">Loading history...</span>
                </div>
              )}

              {!loading && logs.length === 0 && (
                <div className="text-center py-10 text-[#8c8f94] text-[13px] italic">
                  No activity found.
                </div>
              )}

              {logs.map((log) => (
                <div 
                    key={log.id} 
                    className={`bg-white p-3 rounded-[3px] border shadow-sm text-[13px] transition-all ${selectedIds.includes(log.id) ? 'border-[#2271b1] bg-[#f0f6fc]' : 'border-[#c3c4c7] hover:border-[#8c8f94]'}`}
                >
                    <div className="flex gap-3">
                        <div className="pt-1">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.includes(log.id)} 
                                onChange={() => toggleSelect(log.id)}
                                className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] rounded-[2px] focus:ring-[#2271b1] cursor-pointer"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            
                            {/* Header: User & Time */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-[2px] overflow-hidden bg-[#f0f0f1] border border-[#c3c4c7] flex items-center justify-center shrink-0">
                                        {log.user?.image ? (
                                           <img src={log.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                           <User size={14} className="text-[#8c8f94]" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[#2271b1] text-[12px] truncate max-w-[150px]">
                                            {log.user?.name || "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-[#8c8f94] whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="mb-2 font-semibold text-[11px]">
                                {log.action === "CREATED_PRODUCT" && <span className="text-[#008a20] bg-[#f0fdf4] px-1.5 py-0.5 rounded-[2px] border border-[#bbf7d0]">Created product</span>}
                                {log.action === "UPDATED_PRODUCT" && <span className="text-[#2271b1] bg-[#f0f6fc] px-1.5 py-0.5 rounded-[2px] border border-[#c5d9ed]">Updated product</span>}
                                {log.action === "ARCHIVED_PRODUCT" && <span className="text-[#d63638] bg-[#fef2f2] px-1.5 py-0.5 rounded-[2px] border border-[#fecaca]">Moved to trash</span>}
                                {log.action === "DUPLICATED_PRODUCT" && <span className="text-[#8224e3] bg-[#f4f1fa] px-1.5 py-0.5 rounded-[2px] border border-[#e0c8f6]">Duplicated product</span>}
                                {!["CREATED_PRODUCT", "UPDATED_PRODUCT", "ARCHIVED_PRODUCT", "DUPLICATED_PRODUCT"].includes(log.action) && 
                                    <span className="text-[#3c434a] bg-[#f6f7f7] px-1.5 py-0.5 rounded-[2px] border border-[#c3c4c7]">{log.action.replace(/_/g, " ")}</span>
                                }
                            </div>

                            {/* Product Name */}
                            {log.details?.productName && (
                                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[#50575e]">
                                    <Package size={12} className="text-[#8c8f94]"/>
                                    <span className="font-semibold text-[#1d2327]">{log.details.productName}</span>
                                </div>
                            )}

                            {renderDetails(log.details)}
                            
                        </div>
                    </div>
                </div>
              ))}

              {hasMore && (
                  <button 
                    onClick={() => fetchLogs(false)} 
                    disabled={loadingMore}
                    className="w-full py-1 text-[12px] font-semibold text-[#2271b1] border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] rounded-[3px] transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                    {loadingMore ? <Loader2 size={12} className="animate-spin"/> : "Load More Logs"}
                  </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}