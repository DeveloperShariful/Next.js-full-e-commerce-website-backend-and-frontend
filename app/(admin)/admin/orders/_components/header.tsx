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
import { Search, Plus, ListFilter, Truck, AlertCircle, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OrderImportExportButtons } from "./import-export-buttons";

// --- Types ---
interface OrdersHeaderProps {
  counts: Record<string, number>;
}

// ✅ CONFIGURATION DATA
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

  // --- Handlers ---
  const handleStatusChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") params.delete("status");
    else params.set("status", val);
    
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("query", query);
    else params.delete("query");
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  };

  // --- Helpers ---
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
      
      {/* Top Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and fulfill your store orders.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <OrderImportExportButtons />
           <Link href="/admin/orders/create" className="w-full sm:w-auto">
             <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shadow-sm transition-all duration-200 active:scale-95 cursor-pointer">
               <Plus size={16} className="mr-2"/> Create Order
             </Button>
           </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
         
         <div className="w-full flex flex-col md:flex-row gap-3">
            
            {/* 1. GENERAL DROPDOWN */}
            <Select 
                value={isGeneralActive ? currentStatus : undefined} 
                onValueChange={handleStatusChange}
            >
                <SelectTrigger 
                    className={`w-full md:w-[200px] h-10 transition-all duration-200 cursor-pointer ${
                        isGeneralActive 
                        ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium ring-1 ring-blue-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <ListFilter size={14} className={isGeneralActive ? "text-blue-600" : "text-slate-400"}/>
                        <SelectValue placeholder="General Status" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="all" className="font-bold cursor-pointer transition-colors focus:bg-slate-100">
                            <div className="flex w-full min-w-[140px] group">All Orders <CountBadge countKey="all"/></div>
                        </SelectItem>
                        <SelectSeparator />
                        
                        {STATUS_CONFIG.general.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="cursor-pointer focus:bg-slate-50">
                                <div className="flex w-full min-w-[140px] group">
                                    {item.label} <CountBadge countKey={item.countKey}/>
                                </div>
                            </SelectItem>
                        ))}
                        
                        <SelectSeparator />
                        <SelectItem value="trash" className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                            <div className="flex items-center gap-2 group">
                                <Trash2 size={14}/> Trash Bin <CountBadge countKey="trash"/>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            {/* 2. FULFILLMENT DROPDOWN */}
            <Select 
                value={isFulfillmentActive ? currentStatus : undefined} 
                onValueChange={handleStatusChange}
            >
                <SelectTrigger 
                    className={`w-full md:w-[200px] h-10 transition-all duration-200 cursor-pointer ${
                        isFulfillmentActive 
                        ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium ring-1 ring-blue-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Truck size={14} className={isFulfillmentActive ? "text-blue-600" : "text-slate-400"}/>
                        <SelectValue placeholder="Fulfillment" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel className="text-xs text-slate-400 font-normal px-2 py-1.5">Select Status</SelectLabel>
                        <SelectItem value="all" className="text-slate-500 cursor-pointer focus:bg-slate-50">
                            <div className="flex items-center gap-2">
                                <XCircle size={14}/> Any Fulfillment
                            </div>
                        </SelectItem>
                        <SelectSeparator />

                        {STATUS_CONFIG.fulfillment.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="cursor-pointer focus:bg-slate-50">
                                <div className="flex w-full min-w-[140px] group">
                                    {item.label} <CountBadge countKey={item.countKey}/>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            {/* 3. ISSUES & RETURNS DROPDOWN */}
            <Select 
                value={isIssueActive ? currentStatus : undefined} 
                onValueChange={handleStatusChange}
            >
                <SelectTrigger 
                    className={`w-full md:w-[200px] h-10 transition-all duration-200 cursor-pointer ${
                        isIssueActive 
                        ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium ring-1 ring-blue-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} className={isIssueActive ? "text-blue-600" : "text-slate-400"}/>
                        <SelectValue placeholder="Issues & Returns" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel className="text-xs text-slate-400 font-normal px-2 py-1.5">Select Status</SelectLabel>
                        <SelectItem value="all" className="text-slate-500 cursor-pointer focus:bg-slate-50">
                            <div className="flex items-center gap-2">
                                <XCircle size={14}/> No Issues / Any
                            </div>
                        </SelectItem>
                        <SelectSeparator />

                        {STATUS_CONFIG.issues.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="cursor-pointer focus:bg-slate-50">
                                <div className="flex w-full min-w-[140px] group">
                                    {item.label} <CountBadge countKey={item.countKey}/>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

         </div>

         {/* Search Bar */}
         <form onSubmit={handleSearch} className="relative w-full xl:w-96 shrink-0 group">
            <button 
                type="submit" 
                className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors cursor-pointer hover:text-slate-600"
            >
                <Search size={16} />
            </button>
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID, email, customer..." 
              className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all shadow-sm rounded-md"
            />
         </form>
      </div>
    </div>
  );
};