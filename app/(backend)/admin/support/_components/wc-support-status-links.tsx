// File: app/admin/support/_components/wc-support-status-links.tsx

"use client";

import { SupportQueryParams, SupportCounts } from "../types";
import { TicketStatus } from "@prisma/client";

interface WcSupportStatusLinksProps {
  counts: SupportCounts;
  currentStatus: SupportQueryParams["status"];
  onStatusChange: (status: SupportQueryParams["status"]) => void;
}

export const WcSupportStatusLinks = ({ counts, currentStatus, onStatusChange }: WcSupportStatusLinksProps) => {
  
  const availableStatuses = [
    { label: "All", value: "ALL" },
    { label: "Open", value: TicketStatus.OPEN },
    { label: "In Progress", value: TicketStatus.IN_PROGRESS },
    { label: "Resolved", value: TicketStatus.RESOLVED },
    { label: "Closed", value: TicketStatus.CLOSED },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-x-1 text-[13px] mb-2 text-[#646970]">
      {availableStatuses.map((status, index) => {
        const count = counts[status.value as keyof SupportCounts] || 0;
        
        // Hide if count is 0 (except 'All')
        if (status.value !== "ALL" && count === 0) return null;

        const isActive = currentStatus === status.value;

        return (
          <li key={status.value} className="flex items-center">
            <button
              onClick={() => onStatusChange(status.value as SupportQueryParams["status"])}
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