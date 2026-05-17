// app/admin/attributes/_components/attribute-header.tsx

"use client";

interface HeaderProps {
  viewMode: "list" | "form";
  setViewMode: (mode: "list" | "form") => void;
  resetForm: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function AttributeHeader({ 
  viewMode, setViewMode, resetForm, searchQuery, setSearchQuery 
}: HeaderProps) {
  return (
    <div className="mb-4">
      
      {/* 🚀 WP Style Page Title & Search Bar in one row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Attributes</h1>
          
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

        {/* 🚀 WP Style Search Input (Right Aligned) */}
        {viewMode === "list" && (
          <div className="flex items-center shadow-sm w-full sm:w-auto">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full sm:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
            />
            <button className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
              Search attributes
            </button>
          </div>
        )}
      </div>

      {/* 🚀 WP Style Description Text */}
      <div className="text-[13px] text-[#50575e] max-w-4xl leading-relaxed">
        Attributes let you define extra product data, such as size or color. You can use these attributes in the shop sidebar using the "Filter Products by Attribute" widgets.
      </div>

    </div>
  );
}