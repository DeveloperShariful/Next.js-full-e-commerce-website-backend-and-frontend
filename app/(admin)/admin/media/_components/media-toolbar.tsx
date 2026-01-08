// app/(admin)/admin/media/_components/media-toolbar.tsx

"use client";

import { Search, Grid, List, Trash2, RefreshCw, HardDrive, CheckSquare, Square } from "lucide-react";
import { MediaItem } from "@/app/actions/admin/media/media-read";

interface MediaToolbarProps {
  view: "GRID" | "LIST";
  setView: (v: "GRID" | "LIST") => void;
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  usageFilter: string;
  setUsageFilter: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  selectedCount: number;
  selectedItems: MediaItem[]; 
  onBulkDelete: () => void;
  onCancelSelection: () => void;
  onRefresh: () => void;
  // 🔥 NEW PROPS
  onSelectAll: () => void;
  isAllSelected: boolean;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function MediaToolbar({
  view, setView, search, setSearch, 
  filter, setFilter, 
  usageFilter, setUsageFilter,
  sort, setSort,
  selectedCount, selectedItems,
  onBulkDelete, onCancelSelection,
  onRefresh,
  onSelectAll, isAllSelected // 🔥 Destructured
}: MediaToolbarProps) {

  const totalSize = selectedItems.reduce((acc, item) => acc + item.size, 0);

  if (selectedCount > 0) {
    return (
      <div className="bg-indigo-600 text-white p-3 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center animate-in fade-in slide-in-from-top-2 shadow-lg shadow-indigo-200">
         <div className="flex items-center gap-4 mb-2 sm:mb-0">
            {/* 🔥 Select All Button inside Selection Mode */}
            <button 
                onClick={onSelectAll}
                className="flex items-center gap-2 bg-indigo-700/50 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                title={isAllSelected ? "Deselect All" : "Select All"}
            >
                {isAllSelected ? <CheckSquare size={18} className="text-white"/> : <Square size={18} className="text-white/70"/>}
            </button>

            <span className="bg-white text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full">
               {selectedCount} Selected
            </span>
            <span className="text-sm font-medium opacity-90 flex items-center gap-1">
               <HardDrive size={14} className="opacity-70"/> 
               Size: {formatSize(totalSize)}
            </span>
         </div>
         <div className="flex gap-2">
            <button onClick={onCancelSelection} className="px-4 py-1.5 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 rounded transition">
               Cancel
            </button>
            <button onClick={onBulkDelete} className="px-4 py-1.5 text-xs font-bold bg-white text-red-600 rounded hover:bg-red-50 transition flex items-center gap-1 shadow-sm">
               <Trash2 size={14}/> Delete
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-center gap-4 ">
       
       <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full lg:w-auto">
          {/* 🔥 Select All Button (Normal Mode) */}
          <button 
                onClick={onSelectAll}
                className={`p-2.5 rounded-lg border transition flex items-center justify-center ${isAllSelected ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                title="Select All (Ctrl+A)"
          >
                {isAllSelected ? <CheckSquare size={18}/> : <Square size={18}/>}
          </button>

          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
             <input 
               type="text" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
             />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500 cursor-pointer bg-slate-50 hover:bg-white transition"
          >
             <option value="ALL">All Types</option>
             <option value="IMAGE">Images</option>
             <option value="VIDEO">Videos</option>
             <option value="DOCUMENT">Docs</option>
          </select>

          <select 
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500 cursor-pointer bg-slate-50 hover:bg-white transition"
          >
             <option value="ALL">All Status</option>
             <option value="USED">Used</option>
             <option value="UNUSED">Unused</option>
          </select>

          <button 
            onClick={onRefresh}
            className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center justify-center gap-2 sm:w-auto w-full"
            title="Refresh Library"
          >
            <RefreshCw size={16} />
            <span className="sm:hidden text-sm font-medium">Refresh</span>
          </button>
       </div>

       <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
          >
             <option value="newest">Newest</option>
             <option value="oldest">Oldest</option>
             <option value="name_asc">Name (A-Z)</option>
             <option value="name_desc">Name (Z-A)</option>
             <option value="size_asc">Size (Small)</option>
             <option value="size_desc">Size (Large)</option>
          </select>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setView("GRID")} className={`p-1.5 rounded-md transition ${view === "GRID" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}><Grid size={16}/></button>
             <button onClick={() => setView("LIST")} className={`p-1.5 rounded-md transition ${view === "LIST" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}><List size={16}/></button>
          </div>
       </div>
    </div>
  );
}