//app/(backend)/admin/reviews/_components/header.tsx

"use client";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function ReviewHeader({ 
  searchQuery, setSearchQuery 
}: HeaderProps) {
  return (
    <div className="mb-4">
      
      {/* 🚀 WP Style Page Title & Search Bar in one row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Product Reviews</h1>
        </div>

        {/* 🚀 100% Responsive Search Input */}
        <div className="flex items-stretch shadow-sm w-full sm:w-auto">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="flex-1 min-w-0 sm:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
            placeholder="Search Reviews..."
          />
          <button className="shrink-0 whitespace-nowrap px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
            Search Reviews
          </button>
        </div>
      </div>

    </div>
  );
}