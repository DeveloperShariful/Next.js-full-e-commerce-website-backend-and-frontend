// File: app/(admin)/admin/categories/_components/header.tsx
"use client";

import { RefreshCcw } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Categories</h1>
        
        {/* 🚀 Mobile Only Toggle Buttons (Using your existing logic) */}
        {viewMode === "list" ? (
          <button 
            onClick={() => setViewMode("form")} 
            className="lg:hidden px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-sm transition-colors"
          >
            Add New
          </button>
        ) : (
          <button 
            onClick={resetForm} 
            className="lg:hidden px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] rounded-sm transition-colors"
          >
            Back to List
          </button>
        )}
      </div>

      {/* Right Side: Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
         
         {/* 🚀 WP Style Search Box */}
         <div className="flex items-center w-full sm:w-auto shadow-sm">
           <input 
             type="text" 
             placeholder="Search categories..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
             className="w-full sm:w-[220px] px-2.5 py-1 border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-sm"
           />
           <button className="px-3 py-1 border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-sm">
             Search
           </button>
         </div>
         
         {/* Refresh Button */}
         <button 
           onClick={fetchData} 
           className="px-3 py-1 bg-white border border-[#c3c4c7] text-[#2271b1] text-[13px] rounded-sm hover:bg-[#f6f7f7] transition-colors flex items-center gap-1.5 shadow-sm w-full sm:w-auto justify-center"
         >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
         </button>
      </div>
    </div>
  );
}