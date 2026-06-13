//File: app/(backend)/admin/analytics/_components/date-range-picker.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Week to date", value: "week_to_date" },
  { label: "Last week", value: "last_week" },
  { label: "Month to date", value: "month_to_date" },
  { label: "Last month", value: "last_month" },
  { label: "Quarter to date", value: "quarter_to_date" },
  { label: "Last quarter", value: "last_quarter" },
  { label: "Year to date", value: "year_to_date" },
  { label: "Last year", value: "last_year" },
];

export default function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month_to_date");
  const [comparePeriod, setComparePeriod] = useState<string>("previous_year"); 
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const periodParam = searchParams.get("period");
    const compareParam = searchParams.get("compare");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (periodParam) setSelectedPeriod(periodParam);
    if (compareParam !== null) setComparePeriod(compareParam); 
    if (periodParam === "custom" && fromParam && toParam) {
      setDateRange({ from: new Date(fromParam), to: new Date(toParam) });
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCompareChange = (value: string) => {
    if (comparePeriod === value) {
      setComparePeriod("none"); 
    } else {
      setComparePeriod(value); 
    }
  };

  const handleUpdate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", selectedPeriod);
    params.set("compare", comparePeriod);
    
    if (selectedPeriod === "custom" && dateRange?.from) {
      params.set("from", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to) {
        params.set("to", format(dateRange.to, "yyyy-MM-dd"));
      } else {
        params.set("to", format(dateRange.from, "yyyy-MM-dd"));
      }
    } else {
      params.delete("from");
      params.delete("to");
    }
    
    setIsOpen(false);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  let currentPresetLabel = PRESETS.find(p => p.value === selectedPeriod)?.label;
  if (selectedPeriod === "custom" && dateRange?.from) {
    currentPresetLabel = dateRange.to 
      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy");
  }

  const compareText = comparePeriod === "previous_year" 
    ? " vs. Previous year" 
    : comparePeriod === "previous_period" 
    ? " vs. Previous period" 
    : "";

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="border border-[#8c8f94] px-3 py-1.5 bg-white text-[13px] text-[#2c3338] cursor-pointer flex items-center justify-between w-full sm:w-auto sm:min-w-[280px] hover:border-[#50575e] transition-colors rounded-sm"
      >
        <span className="truncate">{currentPresetLabel || "Select Date"}{compareText}</span>
        <svg className="w-4 h-4 text-[#50575e] ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto mt-1 w-[95vw] sm:w-auto max-w-[600px] bg-white border border-[#c3c4c7] shadow-lg z-50 rounded-sm overflow-hidden flex flex-col max-h-[85vh] sm:max-h-none">
          
          {/* Top Section: Presets & Calendar (Stacked on Mobile, Row on Desktop) */}
          <div className="flex flex-col sm:flex-row overflow-y-auto sm:overflow-visible">
            
            {/* Presets Column */}
            <div className="w-full sm:w-[180px] border-b sm:border-b-0 sm:border-r border-[#c3c4c7]">
              <div className="px-4 py-2 text-[11px] font-semibold text-[#646970] uppercase tracking-wide border-b border-[#c3c4c7] bg-[#f8f9f9] sticky top-0 z-10">
                Presets
              </div>
              <ul className="py-2 text-[13px] text-[#2c3338] sm:h-[320px] overflow-y-auto grid grid-cols-2 sm:block">
                {PRESETS.map((preset) => (
                  <li 
                    key={preset.value}
                    onClick={() => { setSelectedPeriod(preset.value); setDateRange(undefined); }}
                    className={`px-4 py-1.5 cursor-pointer hover:bg-[#f0f0f1] hover:text-[#2271b1] ${selectedPeriod === preset.value ? "text-[#2271b1] font-semibold" : ""}`}
                  >
                    {preset.label}
                  </li>
                ))}
                <li 
                  className={`px-4 py-1.5 cursor-pointer hover:bg-[#f0f0f1] hover:text-[#2271b1] ${selectedPeriod === "custom" ? "text-[#2271b1] font-semibold" : ""}`}
                  onClick={() => setSelectedPeriod("custom")}
                >
                  Custom
                </li>
              </ul>
            </div>
            
            {/* Calendar Column */}
            <div className="p-2 sm:p-4 bg-white flex justify-center w-full sm:w-auto">
               <style>{`
                 .rdp { --rdp-cell-size: 32px; --rdp-accent-color: #2271b1; --rdp-background-color: #f0f0f1; margin: 0;} 
                 .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: #2271b1; color: white; } 
                 .rdp-day_range_middle { background-color: #f0f0f1 !important; color: #2c3338 !important; }
                 @media (min-width: 640px) { .rdp { --rdp-cell-size: 35px; } }
               `}</style>
               <div className="overflow-x-auto w-full flex justify-center">
                 <DayPicker 
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => { setDateRange(range); setSelectedPeriod("custom"); }}
                    numberOfMonths={1}
                 />
               </div>
            </div>
          </div>

          {/* Bottom Section: Compare & Update Button (Stacked on Mobile) */}
          <div className="border-t border-[#c3c4c7] p-4 bg-[#f8f9f9] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mt-auto">
              
              <div className="w-full sm:w-auto">
                <div className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-2">Compare To</div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-5 text-[13px] text-[#2c3338]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={comparePeriod === "previous_period"}
                      onChange={() => handleCompareChange("previous_period")}
                      className="w-4 h-4 rounded-[2px] border-gray-400 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" 
                    />
                    <span>Previous period</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={comparePeriod === "previous_year"}
                      onChange={() => handleCompareChange("previous_year")}
                      className="w-4 h-4 rounded-[2px] border-gray-400 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer" 
                    />
                    <span>Previous year</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleUpdate} 
                className="bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] font-medium px-5 py-2 sm:py-1.5 rounded-[3px] transition-colors shadow-sm w-full sm:w-auto mt-2 sm:mt-0"
              >
                Update
              </button>
          </div>
        </div>
      )}
    </div>
  );
}