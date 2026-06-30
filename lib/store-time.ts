import { formatInTimeZone } from "date-fns-tz";
import { isToday, formatDistanceToNow } from "date-fns";

export function formatTz(date: Date | string, timezone: string, fmt: string): string {
  try {
    return formatInTimeZone(new Date(date), timezone, fmt);
  } catch {
    return String(date);
  }
}

export function formatOrderDate(date: Date | string, timezone: string): string {
  const d = new Date(date);
  if (isToday(d)) {
    return `${formatDistanceToNow(d)} ago`;
  }
  return formatTz(d, timezone, "dd MMM yyyy");
}
