// File: app/admin/invoices/_components/wc-page-header.tsx

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export const WcPageHeader = () => {
  return (
    // মোবাইলে flex-col, বড় স্ক্রিনে flex-row
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        {/* WordPress Typography for h1: 23px, font-normal */}
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          Orders / Invoices
        </h1>
        
        {/* WordPress "Add New" Button Style */}
        <Link 
          href="/admin/orders/create"
          className="
            inline-flex items-center gap-1 px-2.5 py-1 text-[13px] 
            border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] 
            hover:bg-[#f0f0f1] hover:text-[#135e96] hover:border-[#135e96] 
            rounded-[3px] transition-colors focus:ring-1 focus:ring-[#2271b1] outline-none
          "
        >
          <Plus size={14} />
          Add order
        </Link>
      </div>
    </div>
  );
};