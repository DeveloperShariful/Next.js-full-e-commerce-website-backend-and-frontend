"use client";

import { Search, Grid, List, Trash2, Filter, X } from "lucide-react";

interface MediaToolbarProps {
  view: "GRID" | "LIST";
  setView: (v: "GRID" | "LIST") => void;
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onCancelSelection: () => void;
}

export function MediaToolbar({
  view, setView, search, setSearch, 
  filter, setFilter, sort, setSort,
  selectedCount, onBulkDelete, onCancelSelection
}: MediaToolbarProps) {

  if (selectedCount > 0) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
         <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
               {selectedCount} Selected
            </span>
            <span className="text-sm text-indigo-900 font-medium">items ready for action</span>
         </div>
         <div className="flex gap-2">
            <button onClick={onCancelSelection} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-white rounded border border-transparent hover:border-slate-200 transition">
               Cancel
            </button>
            <button onClick={onBulkDelete} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-1 shadow-sm">
               <Trash2 size={14}/> Delete Selected
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-4 z-20">
       
       {/* Left: Search & Filter */}
       <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
             <input 
               type="text" 
               placeholder="Search by name, alt text..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
             />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500 hidden sm:block"
          >
             <option value="ALL">All Types</option>
             <option value="IMAGE">Images</option>
             <option value="VIDEO">Videos</option>
             <option value="DOCUMENT">Documents</option>
          </select>
       </div>

       {/* Right: Sort & View */}
       <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500"
          >
             <option value="newest">Newest First</option>
             <option value="oldest">Oldest First</option>
             <option value="name_asc">Name (A-Z)</option>
             <option value="name_desc">Name (Z-A)</option>
             <option value="size_asc">Size (Smallest)</option>
             <option value="size_desc">Size (Largest)</option>
          </select>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setView("GRID")} className={`p-1.5 rounded-md transition ${view === "GRID" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}><Grid size={16}/></button>
             <button onClick={() => setView("LIST")} className={`p-1.5 rounded-md transition ${view === "LIST" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}><List size={16}/></button>
          </div>
       </div>
    </div>
  );
}