// File: app/admin/refunds/_components/wc-refund-header.tsx

"use client";

import { RefundStats } from "../types";

export const WcRefundHeader = ({ stats }: { stats: RefundStats }) => {
  
  const formatTotal = (amount: number, currencyCode: string = "AUD") => {
    return new Intl.NumberFormat("en-US", { 
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    // মোবাইলে flex-col, বড় স্ক্রিনে flex-row
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          Refunds
        </h1>
        <p className="text-[13px] text-[#50575e] mt-1">
          Manage customer refund requests and financial records.
        </p>
      </div>

      {/* Stats Cards - মোবাইলে পাশাপাশি ফিট হওয়ার জন্য w-full এবং grid ব্যবহার করা হলো */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-[13px] w-full lg:w-auto">
        
        <div className="bg-white border border-[#c3c4c7] px-3 sm:px-4 py-2 rounded-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full">
          <span className="text-[#646970] block text-[10px] sm:text-[11px] uppercase font-semibold mb-0.5 truncate">
            Total Approved
          </span>
          <strong className="text-[#5b841b] text-[14px] sm:text-[15px] font-bold truncate block">
             {formatTotal(stats.totalRefundedAmount, stats.currency)}
          </strong>
        </div>
        
        <div className="bg-white border border-[#c3c4c7] px-3 sm:px-4 py-2 rounded-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)] w-full">
          <span className="text-[#646970] block text-[10px] sm:text-[11px] uppercase font-semibold mb-0.5 truncate">
            Pending Requests
          </span>
          <strong className="text-[#d63638] text-[14px] sm:text-[15px] font-bold block">
            {stats.pendingCount}
          </strong>
        </div>
        
      </div>
    </div>
  );
};