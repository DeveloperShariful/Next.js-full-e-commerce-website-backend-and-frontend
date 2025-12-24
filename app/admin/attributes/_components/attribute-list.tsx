// app/admin/attributes/_components/attribute-list.tsx

"use client";

import { useState } from "react";
import { Search, Loader2, Layers, CheckCircle, ChevronLeft, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { deleteAttribute } from "@/app/actions/admin/attribute";
import { toast } from "react-hot-toast";

interface AttributeListProps {
  attributes: any[];
  loading: boolean;
  onEdit: (attr: any) => void;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AttributeList({ 
  attributes, loading, onEdit, onRefresh, 
  currentPage, totalPages, onPageChange, 
  searchQuery, onSearchChange 
}: AttributeListProps) {

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return; // Simple confirm for now
    
    const toastId = toast.loading("Deleting...");
    const res = await deleteAttribute(id);
    
    if (res.success) {
      toast.success(res.message, { id: toastId });
      onRefresh();
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search attributes..." 
              value={searchQuery} 
              onChange={(e) => onSearchChange(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
            />
         </div>
         <div className="text-sm text-slate-500">
           Page <b>{currentPage}</b> of <b>{totalPages}</b>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="p-4 w-1/4">Name</th>
                <th className="p-4 w-1/5">Slug</th>
                <th className="p-4 w-1/6">Type</th>
                <th className="p-4">Terms</th>
                <th className="p-4 text-center">In Use</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={32} /></td></tr>
              ) : attributes.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center"><Layers size={48} className="mx-auto mb-4 opacity-50 text-slate-400"/><p>No attributes found</p></td></tr>
              ) : (
                attributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 font-bold text-slate-800">{attr.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{attr.slug}</td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${attr.type === 'COLOR' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                         {attr.type}
                       </span>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-wrap gap-1 max-w-xs">
                          {attr.values?.slice(0, 5).map((val: string, i: number) => (
                             <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs shadow-sm">{val}</span>
                          ))}
                          {attr.values?.length > 5 && <span className="text-xs text-slate-400">+{attr.values.length - 5}</span>}
                       </div>
                    </td>
                    <td className="p-4 text-center">
                       {attr.count > 0 ? (
                         <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                           <CheckCircle size={10}/> {attr.count}
                         </span>
                       ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button onClick={() => onEdit(attr)} className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"><Edit2 size={16}/></button>
                         <button onClick={() => handleDelete(attr.id, attr.name)} className="p-2 hover:bg-red-50 text-red-600 rounded transition"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-gray-50 flex items-center justify-end gap-2">
             <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16}/></button>
             <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16}/></button>
          </div>
        )}
      </div>
    </div>
  );
}