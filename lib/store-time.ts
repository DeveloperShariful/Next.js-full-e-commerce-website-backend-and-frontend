import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { isToday, formatDistanceToNow, startOfDay } from "date-fns";

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
