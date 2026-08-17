// lib/mark-order-recovered.ts

import { db } from "@/lib/prisma";

// How stale a reminder can be and still get credit for a later order. The
// campaign itself only runs 7 days, so anything beyond this is almost
// certainly an unrelated old/dangling row, not something this order can
// reasonably be attributed to.
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Called whenever an order completes for a customer email that has an open
// (isRecovered: false) AbandonedCheckout row. This always closes out that
// row — the reminder sequence should stop the moment they've actually
// bought — but only tags the Order as "recovered from abandoned cart" when
// a reminder was genuinely sent recently (remindersSent > 0 AND within the
// attribution window). Without the remindersSent check, every normal
// checkout would get flagged: AbandonedCheckout rows are created the moment
// a customer types their email at checkout, even if they complete the
// purchase in the same session seconds later. Without the recency check, a
// reminder sent weeks or months ago (e.g. a dangling row from before this
// campaign existed) would wrongly get credited to an unrelated order placed
// much later.
export async function markOrderRecoveredIfAbandoned(email: string, orderId: string): Promise<boolean> {
  // Case-insensitive: emails are now lowercased at intake (lib/sanitize-email.ts),
  // but older AbandonedCheckout rows captured before that change may still hold
  // a mixed-case address — an exact match would silently miss them.
  const openRows = await db.abandonedCheckout.findMany({
    where: { email: { equals: email, mode: 'insensitive' }, isRecovered: false },
    select: { id: true, remindersSent: true, lastReminder: true },
  });

  if (openRows.length === 0) return false;

  const attributionCutoff = Date.now() - ATTRIBUTION_WINDOW_MS;
  const hadReminder = openRows.some(
    r => r.remindersSent > 0 && r.lastReminder && r.lastReminder.getTime() >= attributionCutoff
  );

  // Conditioned on isRecovered: false at write time (not just at the read
  // above) so two orders completing for the same email within milliseconds
  // of each other can't both claim the same abandoned-checkout row — only
  // whichever call's update actually lands first gets a nonzero count.
  const claimed = await db.abandonedCheckout.updateMany({
    where: { id: { in: openRows.map(r => r.id) }, isRecovered: false },
    data: { isRecovered: true, recoveredAt: new Date() },
  });

  if (claimed.count === 0) return false;

  if (hadReminder) {
    await db.order.update({
      where: { id: orderId },
      data: { recoveredFromAbandonedCart: true },
    });
  }

  return hadReminder;
}
