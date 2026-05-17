//app/(backend)/admin/brands/_components/header.tsx

"use client";

interface HeaderProps {
  viewMode: "list" | "form";
  setViewMode: (mode: "list" | "form") => void;
  resetForm: () => void;
  loading: boolean;
  fetchData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function BrandHeader({ 
  viewMode, setViewMode, resetForm, loading, fetchData, searchQuery, setSearchQuery 
}: HeaderProps) {
  return (
    <div className="mb-4">
      
      {/* 🚀 WP Style Page Title & Search Bar in one row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Product brands</h1>
          
          {/* Mobile Toggle Buttons */}
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

        {/* 🚀 WP Style Search Brands Input (Right Aligned) */}
        {viewMode === "list" && (
          <div className="flex items-center shadow-sm w-full sm:w-auto">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="flex-1 min-w-0 sm:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
            />
            <button className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
              Search brands
            </button>
          </div>
        )}
      </div>

      {/* 🚀 WP Style Description Text */}
      <div className="text-[13px] text-[#50575e] max-w-4xl leading-relaxed">
        Brands can be managed here. They allow you to group your products by manufacturer or company. Brands can be used in product filters and displayed on product pages.
      </div>

    </div>
  );
}