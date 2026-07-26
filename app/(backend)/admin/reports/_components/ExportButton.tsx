'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { exportReportsCSV } from '@/app/actions/backend/reports/report-actions';
import type { ReportFilters } from '@/app/actions/backend/reports/report-actions';
import { toast } from 'sonner';

export default function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const filters: ReportFilters = {
        staffName:      searchParams.get('staff')    || undefined,
        fromDate:       searchParams.get('from')     || undefined,
        toDate:         searchParams.get('to')       || undefined,
        reviewedFilter: (searchParams.get('reviewed') as ReportFilters['reviewedFilter']) || 'all',
      };

      const csv = await exportReportsCSV(filters);
      if (!csv) { toast.error('No data to export.'); setIsLoading(false); return; }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href     = url;
      a.download = `daily-reports-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch {
      toast.error('Export failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2271b1] border border-[#2271b1] hover:bg-[#f0f6fc] px-3 py-1.5 rounded-[3px] transition-colors disabled:opacity-60"
    >
      {isLoading
        ? <Loader2 size={12} className="animate-spin" />
        : <Download size={12} />
      }
      Export CSV
    </button>
  );
}
