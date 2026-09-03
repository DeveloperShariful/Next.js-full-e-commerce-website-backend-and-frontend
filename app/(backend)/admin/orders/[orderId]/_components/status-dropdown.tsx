// File Location: app/admin/orders/[orderId]/_components/status-dropdown.tsx
//
// Shared by order-sidebar-actions.tsx and order-details-meta.tsx — both had
// their own "Order Status" <select> with the same 11 options. Native <select>
// options popups auto-size to their longest option text and ignore the box's
// own (narrowed on mobile) width, so this locks the popup to the trigger's
// width (or a bit wider, via `wideContent`) instead.

"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ORDER_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending payment" },
  { value: "PROCESSING", label: "Processing" },
  { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
  { value: "RETURNED", label: "Returned" },
];
export const PAYMENT_STATUS_OPTIONS = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIALLY_REFUNDED", label: "Partially Refunded" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "VOIDED", label: "Voided" },
  { value: "AUTHORIZED", label: "Authorized" },
];
export const FULFILLMENT_STATUS_OPTIONS = [
  { value: "UNFULFILLED", label: "Unfulfilled" },
  { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "RETURNED", label: "Returned" },
  { value: "PICKED_UP", label: "Picked Up" },
];

// Trigger-width-locked dropdown, standing in for a <select>.
export function StatusDropdown({ name, value, onChange, disabled, options, wideContent }: {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  options: { value: string; label: string }[];
  // Order Status only (both instances) — its longest labels ("Awaiting
  // Payment") still wrap awkwardly locked to a narrow trigger. This lets
  // just that one popup render a bit wider than its trigger instead;
  // Payment/Fulfillment stay trigger-width-locked by default.
  wideContent?: boolean;
}) {
  const current = options.find(o => o.value === value)?.label ?? value;
  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="w-full h-[30px] px-1 lg:px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[11px] lg:text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] disabled:bg-[#f6f7f7] flex items-center justify-between gap-1"
          >
            <span className="truncate">{current}</span>
            <ChevronDown className="h-3 w-3 text-[#8c8f94] shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className={`border-[#8c8f94] shadow-lg p-1 divide-y divide-[#dcdcde] max-h-[300px] overflow-y-auto ${
            wideContent ? 'min-w-[170px] w-max max-w-[240px]' : 'w-[var(--radix-dropdown-menu-trigger-width)]'
          }`}
        >
          {options.map(o => {
            const isCurrent = o.value === value;
            return (
              <DropdownMenuItem
                key={o.value}
                onClick={() => onChange(o.value)}
                className={`cursor-pointer text-[13px] px-2 py-1.5 rounded ${
                  isCurrent
                    ? 'text-[#5b841b] font-semibold bg-[#edfaef] hover:bg-[#e0f5e2] focus:bg-[#e0f5e2]'
                    : 'text-[#1d2327] hover:bg-[#f0f6fc] focus:bg-[#f0f6fc]'
                }`}
              >
                {o.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
