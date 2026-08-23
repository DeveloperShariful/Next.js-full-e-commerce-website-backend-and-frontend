//File: app/(backend)/admin/visitors/page.tsx

import React from "react";
import Link from "next/link";
import { getVisitorInsightsData, getVisitorLog } from "@/app/actions/backend/visitors/visitor-insights.actions";
import { parseDateRange } from "@/app/actions/backend/analytics/shared.utils";
import { getStoreTimezone } from "@/lib/get-store-timezone";

import DateRangePicker from "@/app/(backend)/admin/analytics/_components/date-range-picker";
import VisitorSummaryCards from "./_components/visitor-summary-cards";
import VisitorTrendChart from "./_components/visitor-trend-chart";
import BreakdownTable from "./_components/breakdown-table";
import VisitorLogTable from "./_components/visitor-log-table";
import SetupGuide from "./_components/setup-guide";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string; vpage?: string; tab?: string }>;

interface PageProps {
  searchParams: SearchParams;
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "recent", label: "Recent Visitors" },
  { value: "guide", label: "Setup Guide" },
] as const;

export default async function VisitorsPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const period = searchParams.period || "month_to_date";
  const compare = searchParams.compare !== undefined ? searchParams.compare : "previous_period";
  const customFrom = searchParams.from;
  const customTo = searchParams.to;
  const vpage = searchParams.vpage ? parseInt(searchParams.vpage, 10) : 1;
  const activeTab = searchParams.tab === "recent" ? "recent" : searchParams.tab === "guide" ? "guide" : "overview";

  const timezone = await getStoreTimezone();
  const dates = parseDateRange(period, compare, customFrom, customTo, timezone);

  // যে ট্যাবে আছি শুধু সেটার জন্যই ডেটা আনা হচ্ছে — অন্য ট্যাবের ভারী query
  // (aggregation বা paginated log) অকারণে চালানো হবে না (performance)
  const [data, log] = await Promise.all([
    activeTab === "overview" ? getVisitorInsightsData(dates.current, dates.previous, timezone) : null,
    activeTab === "recent" ? getVisitorLog(dates.current, vpage) : null,
  ]);

  // ট্যাব/pagination লিংক বানানোর জন্য — date-range filter সবসময় বজায় থাকবে
  const filterQuery = new URLSearchParams();
  filterQuery.set("period", period);
  if (compare) filterQuery.set("compare", compare);
  if (customFrom) filterQuery.set("from", customFrom);
  if (customTo) filterQuery.set("to", customTo);
  const baseFilterQuery = filterQuery.toString();

  const channelRows = data?.channelBreakdown.map((c) => ({ label: c.channel, count: c.count, percentage: c.percentage })) ?? [];
  const countryRows = data?.countryBreakdown.map((c) => ({ label: c.country, count: c.count, percentage: c.percentage })) ?? [];

  return (
    <div className="w-full">
      {activeTab !== "guide" ? (
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 rounded-sm">
          <div className="w-full sm:w-auto">
            <h2 className="text-[13px] font-semibold text-[#50575e] mb-2 uppercase tracking-wide">Date range:</h2>
            <DateRangePicker />
          </div>
        </div>
      ) : null}

      <div className="flex gap-1 border-b border-[#c3c4c7] mb-6">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/visitors?${baseFilterQuery}&tab=${t.value}`}
            className={`px-4 py-2.5 text-[14px] font-medium -mb-px border-b-2 transition-colors ${
              activeTab === t.value
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-[#646970] hover:text-[#2c3338]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && data ? (
        <>
          <VisitorSummaryCards data={data} />

          <div className="mb-6">
            <VisitorTrendChart data={data.dailyTrend} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownTable title="By Channel" labelHeader="Channel" rows={channelRows} />
            <BreakdownTable title="By Country" labelHeader="Country" rows={countryRows} />
          </div>
        </>
      ) : null}

      {activeTab === "recent" && log ? (
        <VisitorLogTable
          log={log}
          timezone={timezone}
          basePathWithQuery={`/admin/visitors?${baseFilterQuery}&tab=recent`}
        />
      ) : null}

      {activeTab === "guide" ? <SetupGuide /> : null}
    </div>
  );
}
