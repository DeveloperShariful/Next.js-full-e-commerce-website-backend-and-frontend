// File Location: app/admin/logs/page.tsx

import { getActivityLogs, getLogFilterOptions } from "@/app/actions/backend/all-activity-log/all-activity-log";
import { LogsHeader } from "./_components/logs-header";
import { LogsTable } from "./_components/logs-table";
import { PaginationControls } from "../orders/_components/pagination-controls"; 
import { ActivityLogType, LogMetaType } from "./types";

interface LogsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    query?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function LogsPage(props: LogsPageProps) {
  const searchParams = await props.searchParams;
  
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 50; 
  const query = searchParams.query || "";
  const action = searchParams.action || "all";
  const entityType = searchParams.entityType || "all";
  const userId = searchParams.userId || "all";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";

  // 1. Fetch Logs Data
  const { data: logs, meta } = await getActivityLogs({
      page, limit, query, action, entityType, userId, startDate, endDate
  });

  // 2. Fetch Dynamic Filter Options (Users, Actions, Modules)
  const { data: filterOptions } = await getLogFilterOptions();

  const typedLogs: ActivityLogType[] = logs || [];
  const typedMeta: LogMetaType = meta || { total: 0, pages: 1 };

  // ==========================================
  // ✅ STRICT TYPE FIX: Remove nulls properly 
  // using TypeScript Type Predicate (e is string)
  // ==========================================
  const strictFilterOptions = {
      actions: filterOptions?.actions || [],
      // This guarantees to TypeScript that the array is strictly string[] and contains no nulls
      entityTypes: (filterOptions?.entityTypes || []).filter((e): e is string => typeof e === 'string'),
      users: filterOptions?.users || []
  };

  return (
    // WordPress Classic Admin Background Color (#f0f0f1)
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      
      {/* Header contains Title, Search, and Advanced Filters */}
      <LogsHeader 
        filterOptions={strictFilterOptions} 
        totalItems={typedMeta.total}
        currentPage={page}
        totalPages={typedMeta.pages}
      />
      
      {/* Table contains the classic WordPress rows */}
      <LogsTable logs={typedLogs} />

      {/* Pagination matches WordPress style */}
      {typedMeta.total > 0 && (
        <PaginationControls 
          total={typedMeta.total}
          totalPages={typedMeta.pages}
          currentPage={page}
          perPage={limit}
        />
      )}

    </div>
  );
}