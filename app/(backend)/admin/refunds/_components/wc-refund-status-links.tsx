// File: app/admin/refunds/_components/wc-refund-status-links.tsx

"use client";

import { RefundQueryParams, RefundCounts } from "../types";

interface WcRefundStatusLinksProps {
  counts: RefundCounts;
  currentStatus: RefundQueryParams["status"];
  onStatusChange: (status: RefundQueryParams["status"]) => void;
}

export const WcRefundStatusLinks = ({ counts, currentStatus, onStatusChange }: WcRefundStatusLinksProps) => {
  
  const availableStatuses = [
    { label: "All", value: "ALL" as const },
    { label: "Pending", value: "pending" as const },
    { label: "Approved", value: "approved" as const },
    { label: "Rejected", value: "rejected" as const },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-x-1 text-[13px] mb-2 text-[#646970]">
      {availableStatuses.map((status, index) => {
        const count = counts[status.value];
        
        // Hide if count is 0 (except 'All')
        if (status.value !== "ALL" && count === 0) return null;

        const isActive = currentStatus === status.value;

        return (
          <li key={status.value} className="flex items-center">
            <button
              onClick={() => onStatusChange(status.value)}
              className={`
                hover:text-[#135e96] transition-colors outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#2271b1]
                ${isActive ? "text-[#000] font-semibold" : "text-[#2271b1]"}
              `}
            >
              {status.label} <span className="text-[#646970] font-normal">({count})</span>
            </button>
            
            {/* Divider */}
            {index < availableStatuses.length - 1 && (
              <span className="mx-2 text-[#c3c4c7]">|</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};