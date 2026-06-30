// File Location: app/admin/orders/_components/header.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { OrderImportExportButtons } from "./import-export-buttons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2 } from "lucide-react"; // 🔥 Loader2 Imported
import { cn } from "@/lib/utils";

// গেটওয়ের জন্য স্ট্রিক্ট ইন্টারফেস
interface PaymentGatewayItem {
  identifier: string;
  name: string;
}

interface OrdersHeaderProps {
  counts: Record<string, number>;
  gateways: PaymentGatewayItem[]; // 🔥 NEW: Dynamic Gateways Prop
}

export const OrdersHeader = ({ counts, gateways }: OrdersHeaderProps) => {
  const { timezone } = useGlobalStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route Loading transition
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"filter" | "search" | null>(null);

  const currentStatus = searchParams.get("status") || "all";
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [paymentMethod, setPaymentMethod] = useState<string>(searchParams.get("paymentMethod") || "all");
  
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const sd = searchParams.get("startDate");
    const ed = searchParams.get("endDate");
    if (sd) return { from: new Date(sd), to: ed ? new Date(ed) : new Date(sd) };
    return undefined;
  });

  // URL প্যারাম সিঙ্ক করা
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get("query") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaymentMethod(searchParams.get("paymentMethod") || "all");
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
          else params.delete(key);
      });
      params.set("page", "1");

      startTransition(() => {
         router.push(`/admin/orders?${params.toString()}`);
      });
  };

  const handleStatusChange = (val: string) => {
    updateFilters({ status: val === "all" ? undefined : val });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveAction("search");
    updateFilters({ query: query || undefined });
  };

  const applyFilters = () => {
    setActiveAction("filter");
    let startDate, endDate;
    if (date?.from) {
        // 🔥 FIXED: Formatting locally to match server-side UTC boundaries perfectly
        startDate = formatTz(date.from, timezone, "yyyy-MM-dd");
        endDate = date.to ? formatTz(date.to, timezone, "yyyy-MM-dd") : startDate;
    }
    
    updateFilters({ 
        paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        startDate,
        endDate
    });
  };

  const statuses = [
    { id: "all",               label: "All",               countKey: "all" },
    { id: "PENDING",           label: "Pending payment",   countKey: "pending" },
    { id: "AWAITING_PAYMENT",  label: "Awaiting payment",  countKey: "awaitingPayment" },
    { id: "PROCESSING",        label: "Processing",        countKey: "processing" },
    { id: "PACKED",            label: "Packed",            countKey: "packed" },
    { id: "SHIPPED",           label: "Shipped",           countKey: "shipped" },
    { id: "DELIVERED",         label: "Completed",         countKey: "completed" },
    { id: "READY_FOR_PICKUP",  label: "Ready for Pickup",  countKey: "readyForPickup" },
    { id: "CANCELLED",         label: "Cancelled",         countKey: "cancelled" },
    { id: "REFUNDED",          label: "Refunded",          countKey: "refunded" },
    { id: "RETURNED",          label: "Returned",          countKey: "returned" },
    { id: "PARTIALLY_PAID",    label: "Partially Paid",    countKey: "partiallyPaid" },
    { id: "FAILED",            label: "Failed",            countKey: "failed" },
    { id: "DRAFT",             label: "Draft",             countKey: "draft" },
    { id: "trash",             label: "Trash",             countKey: "trash" },
  ];

  return (
    <div className="mb-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Orders</h1>
          <Link 
              href="/admin/orders/create" 
              className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96] hover:border-[#135e96] transition-colors px-2.5 py-1 text-[13px] rounded-[3px] font-medium whitespace-nowrap"
          >
              Add new order
          </Link>
        </div>
        
        <div className="sm:ml-2">
            <OrderImportExportButtons />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 text-[13px] gap-3 md:gap-0">
        <ul className="flex flex-wrap items-center text-[#646970] gap-y-1 m-0 p-0 list-none">
          {statuses.map((status, index) => {
            const count = counts[status.countKey] || 0;
            if (count === 0 && status.id !== "all" && currentStatus !== status.id) return null;

            const isActive = currentStatus === status.id;

            return (
              <li key={status.id} className="inline-block mr-1">
                <button
                  onClick={() => handleStatusChange(status.id)}
                  disabled={isPending}
                  className={cn(
                    "hover:text-[#135e96] transition-colors disabled:opacity-50",
                    isActive ? "text-[#000] font-semibold" : "text-[#2271b1]"
                  )}
                >
                  {status.label} <span className="text-[#646970] font-normal">({count})</span>
                </button>
                {index < statuses.length - 1 && <span className="mx-1 text-[#a7aaad]">|</span>}
              </li>
            );
          })}
        </ul>

        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <input 
                type="search" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isPending}
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none w-full md:w-[200px] disabled:bg-gray-100"
                placeholder="Search orders..."
            />
            <button 
                type="submit" 
                disabled={isPending}
                className="ml-1 border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors whitespace-nowrap disabled:opacity-70 flex items-center gap-1.5"
            >
                {isPending && activeAction === "search" ? (
                   <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</>
                ) : (
                   "Search orders"
                )}
            </button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 my-3 text-[13px]">
         <Popover>
            <PopoverTrigger asChild>
                <button
                    disabled={isPending}
                    className={cn(
                        "h-[30px] px-2 border border-[#8c8f94] bg-white text-left flex items-center w-full sm:w-auto min-w-[150px] shadow-sm disabled:opacity-70",
                        !date && "text-[#32373c]"
                    )}
                >
                    <CalendarIcon className="mr-2 h-3 w-3 text-[#8c8f94]" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {formatTz(date.from, timezone, "LLL dd, y")} - {formatTz(date.to, timezone, "LLL dd, y")}
                            </>
                        ) : (
                            formatTz(date.from, timezone, "LLL dd, y")
                        )
                    ) : (
                        <span>All dates</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[#8c8f94]" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(range) => setDate(range)}
                    numberOfMonths={2}
                />
            </PopoverContent>
         </Popover>

         <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={isPending}
            className="h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm w-full sm:w-auto min-w-[160px] disabled:bg-gray-100"
         >
            <option value="all">All sales channels</option>
            {/* 🔥 FIXED: Dynamic Payment Gateways rendered here */}
            {gateways.map((gw) => (
              <option key={gw.identifier} value={gw.identifier}>
                {gw.name}
              </option>
            ))}
         </select>

         <button 
            onClick={applyFilters}
            disabled={isPending}
            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm w-full sm:w-auto disabled:opacity-70 flex items-center gap-1.5"
         >
            {isPending && activeAction === "filter" ? (
               <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Filtering...</>
            ) : (
               "Filter"
            )}
         </button>
      </div>
    </div>
  );
};