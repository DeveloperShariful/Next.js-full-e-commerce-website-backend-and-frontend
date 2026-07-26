'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';

export default function AdminFilters() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [staffName,      setStaffName]      = useState(searchParams.get('staff')    ?? '');
  const [fromDate,       setFromDate]       = useState(searchParams.get('from')     ?? '');
  const [toDate,         setToDate]         = useState(searchParams.get('to')       ?? '');
  const [reviewedFilter, setReviewedFilter] = useState(searchParams.get('reviewed') ?? 'all');

  const hasActiveFilters =
    searchParams.get('staff') || searchParams.get('from') ||
    searchParams.get('to')    || (searchParams.get('reviewed') && searchParams.get('reviewed') !== 'all');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (staffName.trim())              params.set('staff',    staffName.trim());
    if (fromDate)                      params.set('from',     fromDate);
    if (toDate)                        params.set('to',       toDate);
    if (reviewedFilter !== 'all')      params.set('reviewed', reviewedFilter);
    params.set('tab', 'list');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const clearFilters = () => {
    setStaffName('');
    setFromDate('');
    setToDate('');
    setReviewedFilter('all');
    startTransition(() => router.push(`${pathname}?tab=list`));
  };

  return (
    <div className="bg-[#f6f7f7] border border-[#dcdcde] rounded-sm p-3 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={13} className="text-[#646970]" />
        <span className="text-[12px] font-semibold text-[#646970] uppercase tracking-wide">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Staff name */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Staff name..."
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="w-full border border-[#8c8f94] rounded-[3px] text-[12px] pl-7 pr-2 py-[5px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white"
          />
        </div>

        {/* From date */}
        <div>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full border border-[#8c8f94] rounded-[3px] text-[12px] px-2 py-[5px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white text-[#646970]"
          />
        </div>

        {/* To date */}
        <div>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full border border-[#8c8f94] rounded-[3px] text-[12px] px-2 py-[5px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white text-[#646970]"
          />
        </div>

        {/* Reviewed status */}
        <div>
          <select
            value={reviewedFilter}
            onChange={e => setReviewedFilter(e.target.value)}
            className="w-full border border-[#8c8f94] rounded-[3px] text-[12px] px-2 py-[5px] focus:border-[#2271b1] outline-none bg-white text-[#646970]"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="bg-[#2271b1] hover:bg-[#135e96] text-white text-[12px] font-semibold px-4 py-1.5 rounded-[3px] flex items-center gap-1.5 disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          Apply Filters
        </button>
      </div>
    </div>
  );
}
