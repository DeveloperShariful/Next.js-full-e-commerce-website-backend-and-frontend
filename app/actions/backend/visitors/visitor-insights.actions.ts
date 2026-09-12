//File: app/actions/backend/visitors/visitor-insights.actions.ts
"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { addDays, format } from "date-fns";
import type { DateRange } from "@/app/actions/backend/analytics/shared.utils";

// একটা visitorId-এর নামে Order row থাকলেই সেটাকে "order placed" ধরা ঠিক না —
// DRAFT (কখনো submit-ই হয়নি), CANCELLED, FAILED — এগুলো real conversion না,
// dead-end। বাকি সব (এমনকি PENDING/AWAITING_PAYMENT — bank transfer/COD-এ
// payment confirm হওয়ার আগেও কাস্টমার আসলে order বসিয়েই দিয়েছে) গণনা হয়।
const NON_QUALIFYING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
];

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
  reachedCartCount: number;
  reachedCheckoutCount: number;
  dailyTrend: VisitorDailyPoint[];
  channelBreakdown: ChannelBreakdown[];
  countryBreakdown: CountryBreakdown[];
  cartChannelBreakdown: ChannelBreakdown[];
  cartCountryBreakdown: CountryBreakdown[];
  checkoutChannelBreakdown: ChannelBreakdown[];
  checkoutCountryBreakdown: CountryBreakdown[];
}

export async function getVisitorInsightsData(
  current: DateRange,
  previous: DateRange,
  timezone: string
): Promise<VisitorInsightsData> {
  const [
    totalVisitors,
    previousTotalVisitors,
    reachedCartCount,
    reachedCheckoutCount,
    dailyRows,
    channelRows,
    countryRows,
    cartChannelRows,
    cartCountryRows,
    checkoutChannelRows,
    checkoutCountryRows,
  ] = await Promise.all([
    db.siteVisit.count({ where: { createdAt: { gte: current.from, lte: current.to } } }),
    db.siteVisit.count({ where: { createdAt: { gte: previous.from, lte: previous.to } } }),
    db.siteVisit.count({ where: { createdAt: { gte: current.from, lte: current.to }, reachedCart: true } }),
    db.siteVisit.count({ where: { createdAt: { gte: current.from, lte: current.to }, reachedCheckout: true } }),

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

    // reachedCart: true দিয়ে scope করা — "কোন channel/country থেকে আসা visitor
    // cart পর্যন্ত গিয়েছে" (checkout breakdown-এর ঠিক একই প্যাটার্ন, cart-এ)।
    db.siteVisit.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: current.from, lte: current.to }, reachedCart: true },
      _count: { channel: true },
      orderBy: { _count: { channel: "desc" } },
    }),

    db.siteVisit.groupBy({
      by: ["country"],
      where: { createdAt: { gte: current.from, lte: current.to }, reachedCart: true, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
    }),

    // নিচের দুটো একই groupBy, শুধু reachedCheckout: true যোগ করে scope করা —
    // "কোন channel/country থেকে আসা visitor আসলে checkout পর্যন্ত গিয়েছে" সেটা
    // দেখানোর জন্য, শুধু "কোথা থেকে আসছে" (উপরের দুটো) না।
    db.siteVisit.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: current.from, lte: current.to }, reachedCheckout: true },
      _count: { channel: true },
      orderBy: { _count: { channel: "desc" } },
    }),

    db.siteVisit.groupBy({
      by: ["country"],
      where: { createdAt: { gte: current.from, lte: current.to }, reachedCheckout: true, country: { not: null } },
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

  // এই দুটোর percentage মোট visitor-এর তুলনায় না, reachedCartCount-এর তুলনায় —
  // "cart পর্যন্ত যাওয়া visitor-দের কত % কোন channel/country থেকে" বোঝাতে।
  const cartChannelBreakdown: ChannelBreakdown[] = cartChannelRows.map((r) => ({
    channel: r.channel,
    count: r._count.channel,
    percentage: reachedCartCount > 0 ? Number(((r._count.channel / reachedCartCount) * 100).toFixed(1)) : 0,
  }));

  const cartCountryBreakdown: CountryBreakdown[] = cartCountryRows
    .filter((r) => r.country)
    .map((r) => ({
      country: r.country as string,
      count: r._count.country,
      percentage: reachedCartCount > 0 ? Number(((r._count.country / reachedCartCount) * 100).toFixed(1)) : 0,
    }));

  // এই দুটোর percentage মোট visitor-এর তুলনায় না, reachedCheckoutCount-এর
  // তুলনায় — "checkout পর্যন্ত যাওয়া visitor-দের কত % কোন channel/country থেকে" বোঝাতে।
  const checkoutChannelBreakdown: ChannelBreakdown[] = checkoutChannelRows.map((r) => ({
    channel: r.channel,
    count: r._count.channel,
    percentage: reachedCheckoutCount > 0 ? Number(((r._count.channel / reachedCheckoutCount) * 100).toFixed(1)) : 0,
  }));

  const checkoutCountryBreakdown: CountryBreakdown[] = checkoutCountryRows
    .filter((r) => r.country)
    .map((r) => ({
      country: r.country as string,
      count: r._count.country,
      percentage: reachedCheckoutCount > 0 ? Number(((r._count.country / reachedCheckoutCount) * 100).toFixed(1)) : 0,
    }));

  return {
    totalVisitors,
    previousTotalVisitors,
    reachedCartCount,
    reachedCheckoutCount,
    dailyTrend,
    channelBreakdown,
    countryBreakdown,
    cartChannelBreakdown,
    cartCountryBreakdown,
    checkoutChannelBreakdown,
    checkoutCountryBreakdown,
  };
}

const LOG_PAGE_SIZE = 20;

export interface VisitorLogRow {
  id: string;
  createdAt: Date;
  channel: string;
  country: string | null;
  landingPage: string;
  reachedCheckout: boolean;
  reachedCart: boolean;
  hasOrder: boolean;
  ipAddress: string | null;
}

export interface VisitorLogPage {
  rows: VisitorLogRow[];
  totalCount: number;
  totalPages: number;
  page: number;
}

// প্রতিটা individual visitor row-এর তালিকা — pagination সহ, যাতে বড় ডেটাতেও
// একবারে সব row DB থেকে টেনে না আনতে হয় (performance)। reachedCheckoutOnly/
// reachedCartOnly দিলে শুধু সেই পেজ পর্যন্ত পৌঁছানো visitor-দের list দেখাবে —
// Overview-এর "Reached Checkout"/"Reached Cart" সংখ্যাটার প্রমাণ হিসেবে
// (ক্লিক করলে এই filtered list-এই আসবে)। searchQuery দিলে IP address বা
// channel name দিয়ে filter হয় (দুটোই indexed column-এর ওপর contains — বড়
// ডেটাতেও date-range-এর মধ্যেই সীমাবদ্ধ থাকে বলে সস্তা)।
export async function getVisitorLog(
  current: DateRange,
  page: number,
  reachedCheckoutOnly = false,
  reachedCartOnly = false,
  searchQuery?: string
): Promise<VisitorLogPage> {
  // ⚠️ FIX: Math.max(1, NaN) === NaN, ক্ল্যাম্প করে না — caller (page.tsx) নিজে
  // guard করলেও এই exported action সরাসরি অন্য কোথাও ভুল ইনপুট দিয়ে call হলে
  // যেন কখনো Prisma-তে NaN skip না পৌঁছায়।
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSearch = searchQuery?.trim();
  const where = {
    createdAt: { gte: current.from, lte: current.to },
    ...(reachedCheckoutOnly ? { reachedCheckout: true } : {}),
    ...(reachedCartOnly ? { reachedCart: true } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { ipAddress: { contains: trimmedSearch, mode: "insensitive" as const } },
            { channel: { contains: trimmedSearch, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, totalCount] = await Promise.all([
    db.siteVisit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * LOG_PAGE_SIZE,
      take: LOG_PAGE_SIZE,
      select: { id: true, createdAt: true, channel: true, country: true, landingPage: true, reachedCheckout: true, reachedCart: true, ipAddress: true, visitorId: true },
    }),
    db.siteVisit.count({ where }),
  ]);

  // "Order: Yes/No" — এই page-এর সব visitorId একসাথে batch করে ১টা query-তে
  // চেক করা হচ্ছে (N+1 এড়াতে), matching Order.visitorId থাকলেই qualifying
  // ধরা হয় (DRAFT/CANCELLED/FAILED বাদে — উপরের NON_QUALIFYING_ORDER_STATUSES)।
  const visitorIds = [...new Set(rows.map((r) => r.visitorId))];
  const convertedVisitorIds = visitorIds.length
    ? await db.order.findMany({
        where: {
          visitorId: { in: visitorIds },
          deletedAt: null,
          status: { notIn: NON_QUALIFYING_ORDER_STATUSES },
        },
        select: { visitorId: true },
        distinct: ["visitorId"],
      })
    : [];
  const orderedVisitorIdSet = new Set(convertedVisitorIds.map((o) => o.visitorId));

  return {
    rows: rows.map(({ visitorId, ...row }) => ({ ...row, hasOrder: orderedVisitorIdSet.has(visitorId) })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / LOG_PAGE_SIZE)),
    page: safePage,
  };
}

// একটা নির্দিষ্ট visitor-এর সম্পূর্ণ প্রমাণ — referrer, click ID, UTM, দেশ, ডিভাইস।
// visitorId cookie দিয়ে Order টেবিলে খুঁজে conversion (checkout করল কিনা) status-ও
// এখানে যোগ করা হচ্ছে — এই visitor পরে কখনো order বসিয়ে থাকলে সেই order-এর
// নম্বর/লিংকও দেখানো হবে (একই visitorId, যেকোনো সময় হতে পারে, ৩০ দিনের ভেতর না হলেও)।
export async function getVisitorDetail(id: string) {
  const visit = await db.siteVisit.findUnique({ where: { id } });
  if (!visit) return null;

  // list page-এর getVisitorLog()-এর সাথে সামঞ্জস্য রেখে একই qualifying filter
  // (DRAFT/CANCELLED/FAILED order-কে "converted" ধরা হয় না)
  const convertedOrder = await db.order.findFirst({
    where: {
      visitorId: visit.visitorId,
      deletedAt: null,
      status: { notIn: NON_QUALIFYING_ORDER_STATUSES },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true, createdAt: true },
  });

  return { ...visit, convertedOrder };
}
