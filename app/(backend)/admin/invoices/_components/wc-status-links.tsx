// File: app/admin/invoices/_components/wc-status-links.tsx

"use client";

import { OrderStatus } from "@prisma/client";
import { StatusCounts } from "../types";

interface WcStatusLinksProps {
  counts: StatusCounts;
  currentStatus: OrderStatus | "ALL";
  onStatusChange: (status: OrderStatus | "ALL") => void;
}

export const WcStatusLinks = ({ counts, currentStatus, onStatusChange }: WcStatusLinksProps) => {
  // কোন কোন স্ট্যাটাস আমরা উপরে দেখাতে চাই (যেগুলোতে ভ্যালু ০ এর বেশি)
  const availableStatuses = [
    { label: "All", value: "ALL" },
    { label: "Pending payment", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "On hold", value: "ON_HOLD" }, // If you add ON_HOLD to your enum later
    { label: "Completed", value: "DELIVERED" }, // Mapping DELIVERED as Completed
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Refunded", value: "REFUNDED" },
    { label: "Failed", value: "FAILED" },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-x-1 text-[13px] mb-2 text-[#646970]">
      {availableStatuses.map((status, index) => {
        // এই স্ট্যাটাসে কতগুলো অর্ডার আছে?
        const count = counts[status.value as keyof StatusCounts] || 0;
        
        // যদি ALL না হয় এবং কাউন্ট 0 হয়, তাহলে ঐ স্ট্যাটাস লিংক দেখাবো না (WordPress Behavior)
        if (status.value !== "ALL" && count === 0) return null;

        const isActive = currentStatus === status.value;

        return (
          <li key={status.value} className="flex items-center">
            <button
              onClick={() => onStatusChange(status.value as OrderStatus | "ALL")}
              className={`
                hover:text-[#135e96] transition-colors outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#2271b1]
                ${isActive ? "text-[#000] font-semibold" : "text-[#2271b1]"}
              `}
            >
              {status.label} <span className="text-[#646970] font-normal">({count})</span>
            </button>
            
            {/* বিভাজক দাগ ( | ), শেষ আইটেমের পরে দাগ হবে না */}
            {index < availableStatuses.length - 1 && (
              <span className="mx-2 text-[#c3c4c7]">|</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};