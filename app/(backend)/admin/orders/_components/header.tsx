// File Location: app/admin/orders/_components/header.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { OrderImportExportButtons } from "./import-export-buttons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdersHeaderProps {
  counts: Record<string, number>;
}

export const OrdersHeader = ({ counts }: OrdersHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string>(searchParams.get("paymentMethod") || "all");

  const updateFilters = (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
          else params.delete(key);
      });
      params.set("page", "1");
      router.push(`/admin/orders?${params.toString()}`);
  };

  const handleStatusChange = (val: string) => {
    updateFilters({ status: val === "all" ? undefined : val });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ query: query || undefined });
  };

  const applyFilters = () => {
    let startDate, endDate;
    if (date?.from) {
        const toDate = date.to ? date.to : date.from;
        toDate.setHours(23, 59, 59, 999);
        startDate = date.from.toISOString();
        endDate = toDate.toISOString();
    }
    
    updateFilters({ 
        paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        startDate,
        endDate
    });
  };

  // Status map to match WooCommerce labels exactly (Now fully visible thanks to backend update)
  const statuses = [
    { id: "all", label: "All", countKey: "all" },
    { id: "PENDING", label: "Pending payment", countKey: "pending" },
    { id: "PROCESSING", label: "Processing", countKey: "processing" },
    { id: "DELIVERED", label: "Completed", countKey: "completed" },
    { id: "CANCELLED", label: "Cancelled", countKey: "cancelled" },
    { id: "REFUNDED", label: "Refunded", countKey: "refunded" },
    { id: "FAILED", label: "Failed", countKey: "failed" },
    { id: "trash", label: "Trash", countKey: "trash" },
  ];

  return (
    <div className="mb-2">
      
      {/* Top Header: Title & Add New Button (Responsive) */}
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

      {/* Status Links & Search Box (Responsive Flex-wrap) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 text-[13px] gap-3 md:gap-0">
        
        {/* Status Links */}
        <ul className="flex flex-wrap items-center text-[#646970] gap-y-1 m-0 p-0 list-none">
          {statuses.map((status, index) => {
            const count = counts[status.countKey] || 0;
            if (count === 0 && status.id !== "all" && currentStatus !== status.id) return null;

            const isActive = currentStatus === status.id;

            return (
              <li key={status.id} className="inline-block mr-1">
                <button
                  onClick={() => handleStatusChange(status.id)}
                  className={cn(
                    "hover:text-[#135e96] transition-colors",
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

        {/* WooCommerce style Search Box (Full width on mobile) */}
        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <input 
                type="search" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none w-full md:w-[200px]"
                placeholder="Search orders..."
            />
            <button 
                type="submit" 
                className="ml-1 border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors whitespace-nowrap"
            >
                Search orders
            </button>
        </form>

      </div>

      {/* WordPress Table Navigation Top (Filters - Stacked on Mobile) */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 my-3 text-[13px]">
         
         <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "h-[30px] px-2 border border-[#8c8f94] bg-white text-left flex items-center w-full sm:w-auto min-w-[150px] shadow-sm",
                        !date && "text-[#32373c]"
                    )}
                >
                    <CalendarIcon className="mr-2 h-3 w-3 text-[#8c8f94]" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
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
            className="h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm w-full sm:w-auto min-w-[160px]"
         >
            <option value="all">All sales channels</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="manual">Manual / COD</option>
         </select>

         <button 
            onClick={applyFilters}
            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm w-full sm:w-auto"
         >
            Filter
         </button>
      </div>

    </div>
  );
};