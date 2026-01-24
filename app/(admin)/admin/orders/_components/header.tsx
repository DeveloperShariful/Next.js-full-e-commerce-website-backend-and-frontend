//app/admin/orders/_components/header.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  SelectSeparator,
  SelectLabel,
  SelectGroup 
} from "@/components/ui/select";
import { Search, Plus, ListFilter, Truck, AlertCircle, Trash2, XCircle, CalendarIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { OrderImportExportButtons } from "./import-export-buttons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface OrdersHeaderProps {
  counts: Record<string, number>;
}

const STATUS_CONFIG = {
    general: [
        { value: "PENDING", label: "Pending", countKey: "pending" },
        { value: "PROCESSING", label: "Processing", countKey: "processing" },
    ],
    fulfillment: [
        { value: "PACKED", label: "Packed", countKey: "packed" },
        { value: "SHIPPED", label: "Shipped", countKey: "shipped" },
        { value: "DELIVERED", label: "Delivered", countKey: "completed" }, 
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup", countKey: "pickup" },
    ],
    issues: [
        { value: "CANCELLED", label: "Cancelled", countKey: "cancelled" },
        { value: "REFUNDED", label: "Refunded", countKey: "refunded" },
        { value: "FAILED", label: "Failed", countKey: "failed" },
        { value: "RETURNED", label: "Returned", countKey: "returned" },
    ]
};

export const OrdersHeader = ({ counts }: OrdersHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string>("all");

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

  const handleDateSelect = (range: DateRange | undefined) => {
      setDate(range);
      if (range?.from) {
          const toDate = range.to ? range.to : range.from;
          toDate.setHours(23, 59, 59, 999);
          
          updateFilters({
              startDate: range.from.toISOString(),
              endDate: toDate.toISOString()
          });
      } else {
          updateFilters({ startDate: undefined, endDate: undefined });
      }
  };

  const handlePaymentFilter = (val: string) => {
      setPaymentMethod(val);
      updateFilters({ paymentMethod: val === "all" ? undefined : val });
  };

  const isGeneralActive = ["all", "PENDING", "PROCESSING", "trash"].includes(currentStatus);
  const isFulfillmentActive = STATUS_CONFIG.fulfillment.some(i => i.value === currentStatus);
  const isIssueActive = STATUS_CONFIG.issues.some(i => i.value === currentStatus);

  const CountBadge = ({ countKey }: { countKey?: string }) => {
    const count = countKey ? counts[countKey] : 0;
    if (!count || count === 0) return null;
    return <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold group-hover:bg-white transition-colors">{count}</span>;
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm mb-6 space-y-6 transition-all duration-300 hover:shadow-md">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="w-full sm:w-auto">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and fulfill your store orders.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
            <div className="flex-1 sm:flex-none">
                <OrderImportExportButtons />
            </div>
            <Link href="/admin/orders/create" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap">
                <Plus size={16} className="mr-2"/> Create Order
            </Button>
            </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
         <div className="flex flex-col xl:flex-row gap-3">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
                <Select value={isGeneralActive ? currentStatus : undefined} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`w-full md:w-[180px] h-10 ${isGeneralActive ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <ListFilter size={14} className={isGeneralActive ? "text-blue-600" : "text-slate-400"}/>
                            <SelectValue placeholder="Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all" className="font-bold">All Orders <CountBadge countKey="all"/></SelectItem>
                            <SelectSeparator />
                            {STATUS_CONFIG.general.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label} <CountBadge countKey={item.countKey}/></SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="trash" className="text-red-600">Trash Bin <CountBadge countKey="trash"/></SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Select value={isFulfillmentActive ? currentStatus : undefined} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`w-full md:w-[180px] h-10 ${isFulfillmentActive ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <Truck size={14} className={isFulfillmentActive ? "text-blue-600" : "text-slate-400"}/>
                            <SelectValue placeholder="Fulfillment" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">Any Fulfillment</SelectItem>
                            <SelectSeparator />
                            {STATUS_CONFIG.fulfillment.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label} <CountBadge countKey={item.countKey}/></SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Select value={isIssueActive ? currentStatus : undefined} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`w-full md:w-[180px] h-10 ${isIssueActive ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className={isIssueActive ? "text-blue-600" : "text-slate-400"}/>
                            <SelectValue placeholder="Issues" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">No Issues / Any</SelectItem>
                            <SelectSeparator />
                            {STATUS_CONFIG.issues.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label} <CountBadge countKey={item.countKey}/></SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[240px] justify-start text-left font-normal bg-slate-50 border-slate-200",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                <Select value={paymentMethod} onValueChange={handlePaymentFilter}>
                    <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200">
                        <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-slate-400"/>
                            <SelectValue placeholder="Payment Method" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="manual">Manual / COD</SelectItem>
                    </SelectContent>
                </Select>

                <form onSubmit={handleSearch} className="relative w-full md:w-64 shrink-0">
                    <button 
                        type="submit" 
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                        <Search size={16} />
                    </button>
                    <Input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search orders..." 
                        className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500"
                    />
                </form>
            </div>
         </div>
      </div>
    </div>
  );
};