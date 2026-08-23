//File: app/actions/backend/visitors/visitor-insights.actions.ts
"use server";

import { db } from "@/lib/prisma";
import { toZonedTime } from "date-fns-tz";
import { addDays, format } from "date-fns";
import type { DateRange } from "@/app/actions/backend/analytics/shared.utils";

export interface VisitorDailyPoint {
  date: string; // yyyy-MM-dd, store-timezone local calendar day
  count: number;
}

export interface ChannelBreakdown {
  channel: string;
  count: number;
  percentage: number;
}

export interface CountryBreakdown {
  country: string;
  count: number;
  percentage: number;
}

export interface VisitorInsightsData {
  totalVisitors: number;
  previousTotalVisitors: number;
  dailyTrend: VisitorDailyPoint[];
  channelBreakdown: ChannelBreakdown[];
  countryBreakdown: CountryBreakdown[];
}

export async function getVisitorInsightsData(
  current: DateRange,
  previous: DateRange,
  timezone: string
): Promise<VisitorInsightsData> {
  const [totalVisitors, previousTotalVisitors, dailyRows, channelRows, countryRows] = await Promise.all([
    db.siteVisit.count({ where: { createdAt: { gte: current.from, lte: current.to } } }),
    db.siteVisit.count({ where: { createdAt: { gte: previous.from, lte: previous.to } } }),

    // Postgres-এর নিজের date_trunc দিয়ে গ্রুপ করা হচ্ছে (raw row fetch করে JS-এ
    // গোনার বদলে) — বড় ডেটা volume-এও দ্রুত থাকে, শুধু indexed count query।
    // ★ "createdAt" কলামটা Prisma-র default অনুযায়ী `timestamp without time zone`
    // (timestamptz না) — মানে raw value UTC wall-clock হিসেবে সেভ আছে, কিন্তু
    // কোনো tz metadata ছাড়া। শুধু `AT TIME ZONE timezone` করলে Postgres উল্টো
    // দিকে shift করে (naive ভ্যালুটাকে already সেই zone-এর local time ধরে UTC-তে
    // রূপান্তর করে — যেটা আমরা চাই না)। তাই আগে `AT TIME ZONE 'UTC'` দিয়ে naive
    // ভ্যালুটাকে সঠিক UTC instant-এ রূপান্তর করে, তারপর `AT TIME ZONE timezone`
    // দিয়ে store-local wall-clock-এ আনা হচ্ছে — লাইভ ডেটা দিয়ে যাচাই করা হয়েছে।
    db.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}), 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM "SiteVisit"
      WHERE "createdAt" >= ${current.from} AND "createdAt" <= ${current.to}
      GROUP BY day
      ORDER BY day ASC
    `,

    db.siteVisit.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: current.from, lte: current.to } },
      _count: { channel: true },
      orderBy: { _count: { channel: "desc" } },
    }),

    db.siteVisit.groupBy({
      by: ["country"],
      where: { createdAt: { gte: current.from, lte: current.to }, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
    }),
  ]);

  // Zero-visit দিনগুলোও চার্টে ফাঁকা না রেখে ০ দিয়ে fill করা হচ্ছে।
  // ★ এখানে cursor.toISOString().slice(0,10) দিয়ে UTC calendar day বের করলে
  // ভুল হতো — SQL query উপরে store-timezone-local day-তে group করে (Sydney-র
  // জন্য UTC থেকে ১০-১১ ঘণ্টা এগিয়ে), তাই সেই key-র সাথে মিলত না। toZonedTime
  // দিয়ে store-local wall-clock representation বানিয়ে, তারপর প্লেইন date-fns
  // format/addDays দিয়ে ধাপে ধাপে এগোনো হচ্ছে (formatTz/formatInTimeZone না —
  // zonedCursor ইতিমধ্যেই zoned, সেটাকে আবার timezone-convert করলে shared.utils.ts-এর
  // storeDayStart-এর মতোই এক দিন এগিয়ে যাওয়ার বাগ হতো)।
  const countByDay = new Map(dailyRows.map((r) => [r.day, Number(r.count)]));
  const dailyTrend: VisitorDailyPoint[] = [];
  let cursor = toZonedTime(current.from, timezone);
  const end = toZonedTime(current.to, timezone);
  while (cursor <= end) {
    const key = format(cursor, "yyyy-MM-dd");
    dailyTrend.push({ date: key, count: countByDay.get(key) ?? 0 });
    cursor = addDays(cursor, 1);
  }

  const channelBreakdown: ChannelBreakdown[] = channelRows.map((r) => ({
    channel: r.channel,
    count: r._count.channel,
    percentage: totalVisitors > 0 ? Number(((r._count.channel / totalVisitors) * 100).toFixed(1)) : 0,
  }));

  const countryBreakdown: CountryBreakdown[] = countryRows
    .filter((r) => r.country)
    .map((r) => ({
      country: r.country as string,
      count: r._count.country,
      percentage: totalVisitors > 0 ? Number(((r._count.country / totalVisitors) * 100).toFixed(1)) : 0,
    }));

  return { totalVisitors, previousTotalVisitors, dailyTrend, channelBreakdown, countryBreakdown };
}

const LOG_PAGE_SIZE = 20;

export interface VisitorLogRow {
  id: string;
  createdAt: Date;
  channel: string;
  country: string | null;
  landingPage: string;
}

export interface VisitorLogPage {
  rows: VisitorLogRow[];
  totalCount: number;
  totalPages: number;
  page: number;
}

// প্রতিটা individual visitor row-এর তালিকা — pagination সহ, যাতে বড় ডেটাতেও
// একবারে সব row DB থেকে টেনে না আনতে হয় (performance)।
export async function getVisitorLog(current: DateRange, page: number): Promise<VisitorLogPage> {
  const safePage = Math.max(1, page);
  const where = { createdAt: { gte: current.from, lte: current.to } };

  const [rows, totalCount] = await Promise.all([
    db.siteVisit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * LOG_PAGE_SIZE,
      take: LOG_PAGE_SIZE,
      select: { id: true, createdAt: true, channel: true, country: true, landingPage: true },
    }),
    db.siteVisit.count({ where }),
  ]);

  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / LOG_PAGE_SIZE)),
    page: safePage,
  };
}

// একটা নির্দিষ্ট visitor-এর সম্পূর্ণ প্রমাণ — referrer, click ID, UTM, দেশ, ডিভাইস।
export async function getVisitorDetail(id: string) {
  return db.siteVisit.findUnique({ where: { id } });
}
