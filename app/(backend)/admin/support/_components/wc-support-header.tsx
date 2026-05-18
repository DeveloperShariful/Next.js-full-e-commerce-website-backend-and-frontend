// File: app/admin/support/_components/wc-support-header.tsx

"use client";

import { SupportCounts } from "../types";

export const WcSupportHeader = ({ counts }: { counts: SupportCounts }) => {
  return (
    // মোবাইলে flex-col, বড় স্ক্রিনে flex-row
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          Support Tickets
        </h1>
        <p className="text-[13px] text-[#50575e] mt-1">
          Manage customer inquiries, issues, and conversations.
        </p>
      </div>

      {/* Stats Cards - মোবাইলে পাশাপাশি ফিট হওয়ার জন্য w-full এবং grid */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-[13px] w-full lg:w-auto">
        
        <div className="bg-white border border-[#c3c4c7] px-3 sm:px-4 py-2 rounded-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full">
          <span className="text-[#646970] block text-[10px] sm:text-[11px] uppercase font-semibold mb-0.5 truncate">
            Needs Attention (Open)
          </span>
          <strong className="text-[#d63638] text-[14px] sm:text-[15px] font-bold truncate block">
             {counts.OPEN}
          </strong>
        </div>
        
        <div className="bg-white border border-[#c3c4c7] px-3 sm:px-4 py-2 rounded-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full">
          <span className="text-[#646970] block text-[10px] sm:text-[11px] uppercase font-semibold mb-0.5 truncate">
            In Progress
          </span>
          <strong className="text-[#d63cd2] text-[14px] sm:text-[15px] font-bold block">
            {counts.IN_PROGRESS}
          </strong>
        </div>
        
      </div>
    </div>
  );
};