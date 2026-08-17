// app/api/cron/abandoned-checkout/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification';
import { getStoreTimezone } from '@/lib/get-store-timezone';
import { formatTz } from '@/lib/store-time';

export const maxDuration = 60;

// 7-day, 2-email/day abandoned-cart sequence — Day1 AM ... Day7 PM (index 0-13).
const SEQUENCE: string[] = Array.from({ length: 7 }, (_, i) => [
  `ABANDONED_CART_D${i + 1}_AM`,
  `ABANDONED_CART_D${i + 1}_PM`,
]).flat();

export async function GET(request: Request) {
  // Auth: accepts Vercel CRON_SECRET (bearer) OR manual x-api-key
  const cronSecret  = process.env.CRON_SECRET;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (cronSecret || internalKey) {
    const authHeader   = request.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const xApiKey      = request.headers.get('x-api-key');

    const validCron   = cronSecret   && bearerSecret === cronSecret;
    const validManual = internalKey  && xApiKey === internalKey;

    if (!validCron && !validManual) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Runs hourly, but only actually does anything at the two Sydney send slots
  // (10am / 6pm) — every other hour returns immediately, before any DB call,
  // so the database stays idle (and Neon can auto-suspend) the rest of the day.
  const timezone   = await getStoreTimezone();
  const localHour  = Number(formatTz(new Date(), timezone, 'H'));

  if (localHour !== 10 && localHour !== 18) {
    return NextResponse.json({ success: true, skipped: true, localHour });
  }

  const slotIndex = localHour === 10 ? 0 : 1; // 0 = AM, 1 = PM

  try {
    // Safety net against double-processing if this run overlaps a retry.
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const checkouts = await db.abandonedCheckout.findMany({
      where: {
        isRecovered: false,
        email: { not: null },
        remindersSent: { lt: SEQUENCE.length },
        OR: [
          { lastReminder: null },
          { lastReminder: { lt: fourHoursAgo } },
        ],
      },
      include: { user: { select: { name: true } } },
      take: 50,
    });

    if (checkouts.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    // Klaviyo config (optional)
    const config = await db.marketingIntegration.findUnique({
      where: { id: 'marketing_config' },
      select: { klaviyoEnabled: true, klaviyoPrivateKey: true },
    });
    const klaviyoKey = config?.klaviyoEnabled ? config.klaviyoPrivateKey : null;

    const now = new Date();
    let processed = 0;

    for (const checkout of checkouts) {
      try {
        const email        = checkout.email!;
        const customerName = checkout.user?.name || email.split('@')[0];
        const items        = Array.isArray(checkout.items) ? checkout.items : [];
        const subtotal     = Number(checkout.subtotal).toFixed(2);
        const currency     = checkout.currency || 'AUD';

        // Each row progresses through its own step, but every row eligible on a
        // given slot only ever sends the AM or PM template for that slot — a row
        // that's behind (e.g. missed a day) just resumes at its own next step.
        const step  = checkout.remindersSent; // 0-13, index into SEQUENCE
        const trigger = SEQUENCE[step];

        // 1. Send recovery email via system queue
        const sendResult = await sendNotification({
          trigger,
          recipient: email,
          data: {
            customer_name: customerName,
            checkout_url:  checkout.recoveryUrl,
            items,
            subtotal,
            currency,
          },
        });

        // If the template is missing/disabled (or any other queueing failure),
        // don't advance remindersSent — otherwise this row silently "uses up"
        // a step with no email ever sent, and markOrderRecoveredIfAbandoned()
        // would later treat it as a genuine recovery when none happened.
        if (!sendResult.success) {
          console.error(`[AbandonedCheckout Cron] sendNotification failed for ${email} (${trigger}):`, sendResult.error);
          continue;
        }

        // 2. Fire Klaviyo "Abandoned Checkout" event (if configured)
        if (klaviyoKey) {
          fetch('https://a.klaviyo.com/api/events/', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
              'revision':      '2024-02-15',
            },
            body: JSON.stringify({
              data: {
                type: 'event',
                attributes: {
                  metric: {
                    data: { type: 'metric', attributes: { name: 'Abandoned Checkout' } },
                  },
                  profile: {
                    data: { type: 'profile', attributes: { email } },
                  },
                  properties: {
                    $value:      Number(checkout.subtotal),
                    CheckoutURL: checkout.recoveryUrl,
                    ItemCount:   items.length,
                    Items:       items,
                  },
                  value: Number(checkout.subtotal),
                  time:  checkout.createdAt.toISOString(),
                },
              },
            }),
          }).catch(err => console.error(`[AbandonedCheckout] Klaviyo failed for ${email}:`, err));
        }

        // 3. Mark reminder sent
        await db.abandonedCheckout.update({
          where: { id: checkout.id },
          data: { remindersSent: { increment: 1 }, lastReminder: now },
        });

        processed++;
      } catch (err) {
        console.error(`[AbandonedCheckout Cron] Failed for ${checkout.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, processed, slotIndex });
  } catch (error) {
    console.error('[AbandonedCheckout Cron]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
