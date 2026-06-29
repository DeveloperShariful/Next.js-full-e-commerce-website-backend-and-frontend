// app/api/cron/abandoned-checkout/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification';

export const maxDuration = 60;

export async function GET(request: Request) {
  // Auth: accepts Vercel CRON_SECRET (bearer) OR manual x-api-key
  const cronSecret  = process.env.CRON_SECRET;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (cronSecret || internalKey) {
    const { searchParams } = new URL(request.url);
    const querySecret  = searchParams.get('secret');
    const authHeader   = request.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const xApiKey      = request.headers.get('x-api-key');

    const validCron   = cronSecret   && (bearerSecret === cronSecret || querySecret === cronSecret);
    const validManual = internalKey  && xApiKey === internalKey;

    if (!validCron && !validManual) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const checkouts = await db.abandonedCheckout.findMany({
      where: {
        isRecovered: false,
        email: { not: null },
        remindersSent: 0,
        lastReminder: null,
        createdAt: { lte: oneHourAgo },
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

        // 1. Send recovery email via system queue
        await sendNotification({
          trigger:   'ABANDONED_CHECKOUT',
          recipient: email,
          data: {
            customer_name: customerName,
            checkout_url:  checkout.recoveryUrl,
            items,
            subtotal,
            currency,
          },
        });

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

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error('[AbandonedCheckout Cron]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
