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
import VisitorSearchBar from "./_components/visitor-search-bar";
import SetupGuide from "./_components/setup-guide";

type SearchParams = Promise<{ period?: string; compare?: string; from?: string; to?: string; vpage?: string; tab?: string; checkout?: string; q?: string }>;

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
  const checkoutOnly = searchParams.checkout === "1";
  const searchQuery = searchParams.q?.trim() || "";

  const timezone = await getStoreTimezone();
  const dates = parseDateRange(period, compare, customFrom, customTo, timezone);

  // যে ট্যাবে আছি শুধু সেটার জন্যই ডেটা আনা হচ্ছে — অন্য ট্যাবের ভারী query
  // (aggregation বা paginated log) অকারণে চালানো হবে না (performance)
  const [data, log] = await Promise.all([
    activeTab === "overview" ? getVisitorInsightsData(dates.current, dates.previous, timezone) : null,
    activeTab === "recent" ? getVisitorLog(dates.current, vpage, checkoutOnly, searchQuery) : null,
  ]);

  // ট্যাব/pagination লিংক বানানোর জন্য — date-range filter সবসময় বজায় থাকবে
  const filterQuery = new URLSearchParams();
  filterQuery.set("period", period);
  if (compare) filterQuery.set("compare", compare);
  if (customFrom) filterQuery.set("from", customFrom);
  if (customTo) filterQuery.set("to", customTo);
  const baseFilterQuery = filterQuery.toString();

  // "Reached Checkout" card থেকে ক্লিক করলে এই filter-সহ লিংকে আসবে — সংখ্যাটার
  // প্রমাণ হিসেবে সরাসরি সেই visitor-দের list দেখানো যায়।
  const checkoutProofLink = `/admin/visitors?${baseFilterQuery}&tab=recent&checkout=1`;

  const channelRows = data?.channelBreakdown.map((c) => ({ label: c.channel, count: c.count, percentage: c.percentage })) ?? [];
  const countryRows = data?.countryBreakdown.map((c) => ({ label: c.country, count: c.count, percentage: c.percentage })) ?? [];
  const checkoutChannelRows = data?.checkoutChannelBreakdown.map((c) => ({ label: c.channel, count: c.count, percentage: c.percentage })) ?? [];
  const checkoutCountryRows = data?.checkoutCountryBreakdown.map((c) => ({ label: c.country, count: c.count, percentage: c.percentage })) ?? [];

  return (
    <div className="w-full">
      {activeTab !== "guide" ? (
        <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 mb-3 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 rounded-sm">
          <div className="w-full sm:w-auto">
            <h2 className="text-[13px] font-semibold text-[#50575e] mb-2 uppercase tracking-wide">Date range:</h2>
            <DateRangePicker />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#c3c4c7] mb-6 pb-3 sm:pb-0">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/admin/visitors?${baseFilterQuery}&tab=${t.value}`}
              className={`px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px] font-medium -mb-px border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.value
                  ? "border-[#2271b1] text-[#2271b1]"
                  : "border-transparent text-[#646970] hover:text-[#2c3338]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <VisitorSearchBar />
      </div>

      {activeTab === "overview" && data ? (
        <>
          <VisitorSummaryCards data={data} checkoutProofLink={checkoutProofLink} />

          <div className="mb-6">
            <VisitorTrendChart data={data.dailyTrend} />
          </div>

          <h3 className="text-[13px] font-semibold text-[#50575e] uppercase tracking-wide mb-2">All Visitors</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BreakdownTable title="By Channel" labelHeader="Channel" rows={channelRows} />
            <BreakdownTable title="By Country" labelHeader="Country" rows={countryRows} />
          </div>

          <h3 className="text-[13px] font-semibold text-[#50575e] uppercase tracking-wide mb-2">Visitors Who Reached Checkout</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownTable title="By Channel" labelHeader="Channel" rows={checkoutChannelRows} />
            <BreakdownTable title="By Country" labelHeader="Country" rows={checkoutCountryRows} />
          </div>
        </>
      ) : null}

      {activeTab === "recent" && log ? (
        <>
          {checkoutOnly ? (
            <div className="mb-4 flex items-center justify-between bg-[#fff8e5] border border-[#f0d896] rounded-sm px-4 py-2.5">
              <span className="text-[13px] text-[#664d03]">
                Showing only visitors who reached the checkout page ({log.totalCount} of them, in this date range).
              </span>
              <Link href={`/admin/visitors?${baseFilterQuery}&tab=recent`} className="text-[13px] text-[#2271b1] hover:underline shrink-0 ml-3">
                Clear filter
              </Link>
            </div>
          ) : null}
          {searchQuery ? (
            <div className="mb-4 flex items-center justify-between bg-[#e5f5fa] border border-[#8fd1e8] rounded-sm px-4 py-2.5">
              <span className="text-[13px] text-[#0a4b78]">
                Showing results for &quot;{searchQuery}&quot; ({log.totalCount} matches, in this date range).
              </span>
              <Link href={`/admin/visitors?${baseFilterQuery}&tab=recent${checkoutOnly ? "&checkout=1" : ""}`} className="text-[13px] text-[#2271b1] hover:underline shrink-0 ml-3">
                Clear search
              </Link>
            </div>
          ) : null}
          <VisitorLogTable
            log={log}
            timezone={timezone}
            basePathWithQuery={`/admin/visitors?${baseFilterQuery}&tab=recent${checkoutOnly ? "&checkout=1" : ""}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
          />
        </>
      ) : null}

      {activeTab === "guide" ? <SetupGuide /> : null}
    </div>
  );
}
