import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { isToday, formatDistanceToNow, startOfDay, endOfDay } from "date-fns";

export function formatTz(date: Date | string, timezone: string, fmt: string): string {
  try {
    return formatInTimeZone(new Date(date), timezone, fmt);
  } catch {
    return String(date);
  }
}

// Given any instant, returns the REAL UTC instant corresponding to the
// start of that instant's calendar day in the store's timezone. Use this
// for filtering genuine timestamp columns (e.g. Order.createdAt,
// Order.orderDate) — without it, "today" as measured by the server's UTC
// clock and "today" in the store's local timezone disagree for part of the
// day (Sydney is UTC+10/+11, so the UTC calendar day doesn't roll over to
// match Sydney's until mid-morning local time).
export function storeDayStart(date: Date | string, timezone: string): Date {
  return fromZonedTime(startOfDay(toZonedTime(new Date(date), timezone)), timezone);
}

// storeDayStart-এর সমকক্ষ — দিনের শেষ মুহূর্ত (23:59:59.999) store-এর
// timezone-এ, real UTC instant হিসেবে। একই কারণে দরকার: server-এর
// .setHours(23,59,59,999) সরাসরি ব্যবহার করলে server-এর নিজের (সাধারণত UTC)
// সময় ধরে হিসাব করে, store-এর local দিনের শেষ না।
export function storeDayEnd(date: Date | string, timezone: string): Date {
  return fromZonedTime(endOfDay(toZonedTime(new Date(date), timezone)), timezone);
}

// Given any instant, returns a Date representing that instant's calendar
// day in the store's timezone, encoded as UTC midnight of that same
// calendar date (year/month/day unchanged, time zeroed in UTC terms).
// Use this — NOT storeDayStart — for Prisma `@db.Date` columns (Analytics.date,
// ProductAnalytics.date): Postgres DATE columns hold no time-of-day or
// timezone, so writing storeDayStart's real UTC instant (e.g. Sydney
// midnight = UTC 14:00 the previous day) gets silently truncated to the
// UTC calendar date — one day off for anything before ~10am Sydney time.
export function storeDateKey(date: Date | string, timezone: string): Date {
  const zoned = toZonedTime(new Date(date), timezone);
  return new Date(Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()));
}

export function formatOrderDate(date: Date | string, timezone: string): string {
  const d = new Date(date);
  if (isToday(d)) {
    return `${formatDistanceToNow(d)} ago`;
  }
  return formatTz(d, timezone, "dd MMM yyyy");
}

// Milliseconds until the next occurrence of any of the given hours (0-23), in the
// store's timezone — e.g. msUntilNextDailyFire("Australia/Sydney", [10, 18]) for a
// twice-a-day check. Client-safe (no server-only imports), meant for scheduling a
// single setTimeout instead of a recurring setInterval, so a background badge/count
// only ever re-fetches at those fixed daily moments rather than on a tight loop.
export function msUntilNextDailyFire(timezone: string, hours: number[]): number {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  let soonest: number | null = null;
  for (const hour of hours) {
    const candidateZoned = new Date(zonedNow);
    candidateZoned.setHours(hour, 0, 0, 0);
    let candidateUtc = fromZonedTime(candidateZoned, timezone).getTime();
    if (candidateUtc <= now.getTime()) {
      candidateZoned.setDate(candidateZoned.getDate() + 1);
      candidateUtc = fromZonedTime(candidateZoned, timezone).getTime();
    }
    if (soonest === null || candidateUtc < soonest) soonest = candidateUtc;
  }

  return Math.max(0, (soonest as number) - now.getTime());
}
