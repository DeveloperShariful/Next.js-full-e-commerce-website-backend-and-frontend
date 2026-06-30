// File Location: app/admin/logs/_components/logs-header.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarIcon, ShieldAlert, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { clearAllLogs } from "@/app/actions/backend/all-activity-log/all-activity-log";

interface LogsHeaderProps {
  filterOptions: {
    actions: string[];
    entityTypes: string[];
    users: { id: string; name: string | null; email: string }[];
  };
  totalItems: number; 
  currentPage: number;
  totalPages: number;
}

export const LogsHeader = ({ filterOptions, totalItems, currentPage, totalPages }: LogsHeaderProps) => {
  const { timezone } = useGlobalStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search State
  const [query, setQuery] = useState(searchParams.get("query") || "");

  // Filter States
  const [selectedAction, setSelectedAction] = useState(searchParams.get("action") || "all");
  const [selectedEntity, setSelectedEntity] = useState(searchParams.get("entityType") || "all");
  const [selectedUser, setSelectedUser] = useState(searchParams.get("userId") || "all");
  
  // Date State
  const defaultStartDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined;
  const defaultEndDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined;
  
  const [date, setDate] = useState<DateRange | undefined>({
      from: defaultStartDate,
      to: defaultEndDate
  });

  // --- Handlers ---
  const updateFilters = (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
          else params.delete(key);
      });
      params.set("page", "1");
      router.push(`/admin/logs?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ query: query || undefined });
  };

  const applyFilters = () => {
    let startDate, endDate;
    if (date?.from) {
        const toDate = date.to ? date.to : date.from;
        toDate.setHours(23, 59, 59, 999); // Set to end of the day
        startDate = date.from.toISOString();
        endDate = toDate.toISOString();
    }
    
    updateFilters({ 
        action: selectedAction === "all" ? undefined : selectedAction,
        entityType: selectedEntity === "all" ? undefined : selectedEntity,
        userId: selectedUser === "all" ? undefined : selectedUser,
        startDate,
        endDate
    });
  };

  const handleClearAll = () => {
      if(!confirm("WARNING: Are you sure you want to permanently delete ALL activity logs? This action cannot be undone.")) return;
      
      startTransition(async () => {
          const res = await clearAllLogs();
          if (res.success) {
              toast.success(res.message);
              router.refresh();
          } else {
              toast.error(res.error);
          }
      });
  };

  const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin/logs?${params.toString()}`);
  };

  return (
    <div className="mb-2">
      
      {/* Top Header: Title & Warning Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 w-full">
        <div className="flex items-center gap-3">
            <h1 className="text-[23px] font-normal text-[#1d2327] m-0">Activity Logs</h1>
            <p className="text-[13px] text-[#646970] m-0 hidden sm:block ml-2">Track staff actions and system events.</p>
        </div>
        
        <div className="flex justify-end">
            <button 
                onClick={handleClearAll}
                disabled={isPending || totalItems === 0}
                className="border border-[#d63638] bg-white text-[#d63638] hover:bg-[#fcf0f1] transition-colors h-[30px] px-3 text-[13px] rounded-[3px] font-medium shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
                {isPending ? <Loader2 size={14} className="animate-spin"/> : <ShieldAlert size={14}/>}
                Clear History
            </button>
        </div>
      </div>

      {/* Search Box */}
      <div className="flex justify-end mb-3">
        <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <input 
                type="search" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search action, user, IP..."
                className="w-full md:w-[250px] border border-[#8c8f94] bg-white h-[30px] px-2 text-[13px] text-[#32373c] outline-none rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm"
            />
            <button type="submit" className="ml-1 border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm whitespace-nowrap">
                Search logs
            </button>
        </form>
      </div>

      {/* WooCommerce Style Advanced Filters Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mt-2 mb-3 text-[13px] gap-3">
          
          <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto">
              
              {/* Filter 1: Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "h-[30px] px-2 border border-[#8c8f94] bg-white text-left flex items-center shadow-sm rounded-[3px] min-w-[180px]",
                            !date && "text-[#646970]"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#8c8f94]" />
                        {date?.from ? (
                            date.to ? (
                                <span className="truncate text-[#32373c]">{formatTz(date.from, timezone, "MMM d, y")} - {formatTz(date.to, timezone, "MMM d, y")}</span>
                            ) : (
                                <span className="text-[#32373c]">{formatTz(date.from, timezone, "MMM d, y")}</span>
                            )
                        ) : (
                            <span>Filter by date</span>
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

              {/* Filter 2: Action Type */}
              <select 
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[#32373c] outline-none shadow-sm rounded-[3px] cursor-pointer max-w-[150px]"
              >
                  <option value="all">All actions</option>
                  {filterOptions.actions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* Filter 3: Module / Entity Type */}
              <select 
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[#32373c] outline-none shadow-sm rounded-[3px] cursor-pointer max-w-[150px]"
              >
                  <option value="all">All modules</option>
                  {filterOptions.entityTypes.map(e => <option key={e} value={e} className="capitalize">{e}</option>)}
              </select>

              {/* Filter 4: User */}
              <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="border border-[#8c8f94] bg-white h-[30px] px-2 text-[#32373c] outline-none shadow-sm rounded-[3px] cursor-pointer max-w-[150px] truncate"
              >
                  <option value="all">All users</option>
                  {filterOptions.users.map(u => (
                      <option key={u.id} value={u.id}>
                          {u.name || "Unknown"} ({u.email})
                      </option>
                  ))}
              </select>

              <button 
                  onClick={applyFilters}
                  className="border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 rounded-[3px] font-medium transition-colors shadow-sm ml-1"
              >
                  Filter
              </button>
          </div>

          {/* Top Pagination */}
          {totalItems > 0 && (
              <div className="flex items-center gap-1.5 text-[#646970] shrink-0">
                  <span className="mr-1">{totalItems} items</span>
                  <button onClick={() => handlePageChange(1)} disabled={currentPage <= 1} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1]">«</button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1]">‹</button>
                  <span className="flex items-center gap-1 mx-1">
                      <input type="text" value={currentPage} readOnly className="w-[35px] h-[30px] text-center border border-[#8c8f94] bg-white shadow-inner rounded-[3px]" />
                      of <span className="font-medium text-[#3c434a]">{totalPages}</span>
                  </span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1]">›</button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} className="w-[30px] h-[30px] flex justify-center items-center border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] hover:bg-[#f0f0f1] disabled:opacity-50 text-[#2271b1]">»</button>
              </div>
          )}
      </div>

    </div>
  );
};