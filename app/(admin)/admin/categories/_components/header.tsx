// File: app/(admin)/admin/categories/_components/header.tsx
"use client";
import { FolderTree, Plus, ArrowLeft, RefreshCcw, Search } from "lucide-react";

interface HeaderProps {
  viewMode: "list" | "form";
  setViewMode: (mode: "list" | "form") => void;
  resetForm: () => void;
  loading: boolean;
  fetchData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function CategoryHeader({ 
  viewMode, setViewMode, resetForm, loading, fetchData, searchQuery, setSearchQuery 
}: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FolderTree className="text-blue-600" /> Category Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage hierarchy, sorting orders, and SEO.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {viewMode === "list" && (
           <div className="relative w-full sm:w-64 group">
             <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search categories..." 
               value={searchQuery} 
               onChange={(e) => setSearchQuery(e.target.value)} 
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
             />
           </div>
        )}
        
        {viewMode === "list" ? (
          <>
            <button onClick={fetchData} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition">
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setViewMode("form")} className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium shadow-md">
              <Plus size={18} /> Add Category
            </button>
          </>
        ) : (
          <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm">
            <ArrowLeft size={18} /> Back to List
          </button>
        )}
      </div>
    </div>
  );
}