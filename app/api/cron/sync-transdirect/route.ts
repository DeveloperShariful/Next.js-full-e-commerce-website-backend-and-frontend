// app/api/cron/sync-transdirect/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { syncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';

const MAX_ATTEMPTS = 3;
const STUCK_MINUTES = 10;
const BATCH_SIZE = 5;

function getAttempts(errorStr: string | null): number {
  const match = (errorStr || '').match(/^\[attempt:(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
}

function buildError(attempt: number, msg: string): string {
  return `[attempt:${attempt}] ${msg}`;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const bearer = (req.headers instanceof Headers ? req.headers.get('authorization') : null)
      ?.replace('Bearer ', '');
    if (bearer !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // ── 1. Stuck recovery: "processing" > STUCK_MINUTES → reset to "queued" ──
    const stuckCutoff = new Date(Date.now() - STUCK_MINUTES * 60 * 1000);
    const recovered = await db.order.updateMany({
      where: { transdirectOrderStatus: 'processing', updatedAt: { lt: stuckCutoff } },
      data: { transdirectOrderStatus: 'queued' },
    });
    if (recovered.count > 0) {
      console.log(`[TDQueue] Recovered ${recovered.count} stuck orders → queued`);
    }

    // ── 2. Fetch queued orders (oldest first) ────────────────────────────────
    const orders = await db.order.findMany({
      where: { transdirectOrderStatus: 'queued', paymentStatus: 'PAID', deletedAt: null },
      select: { id: true, orderNumber: true, transdirectError: true },
      take: BATCH_SIZE,
      orderBy: { updatedAt: 'asc' },
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: 'No orders to sync.' });
    }

    const results: { orderId: string; orderNumber: string; result: string }[] = [];

    for (const order of orders) {
      const attempts = getAttempts(order.transdirectError);

      // ── Permanently fail after MAX_ATTEMPTS ──────────────────────────────
      if (attempts >= MAX_ATTEMPTS) {
        await db.order.update({
          where: { id: order.id },
          data: { transdirectOrderStatus: 'failed' },
        });
        await db.orderNote.create({
          data: {
            orderId: order.id,
            content: `❌ Transdirect auto-sync permanently failed after ${MAX_ATTEMPTS} attempts. Use "Recalculate & Send" to retry manually.`,
            isSystem: true,
          },
        });
        results.push({ orderId: order.id, orderNumber: order.orderNumber, result: 'permanently_failed' });
        continue;
      }

      // ── Lock: mark as "processing" — prevents double-sync if cron overlaps ─
      try {
        await db.order.update({
          where: { id: order.id, transdirectOrderStatus: 'queued' },
          data: { transdirectOrderStatus: 'processing' },
        });
      } catch {
        // Another cron instance already locked this order — skip it
        results.push({ orderId: order.id, orderNumber: order.orderNumber, result: 'skipped_locked' });
        continue;
      }

      // ── Sync to Transdirect ───────────────────────────────────────────────
      const currentAttempt = attempts + 1;
      const cronSource = `cron (attempt ${currentAttempt}/${MAX_ATTEMPTS})`;
      const res = await syncOrderToTransdirect(order.id, cronSource);

      if (res.success) {
        if (res.message === 'Already synced to TransDirect') {
          // Edge case: order was synced by capture-order/webhook between cron fetch and lock
          const priorNote = await db.orderNote.findFirst({
            where: { orderId: order.id, content: { contains: '✅ Synced to Transdirect via' } },
            orderBy: { createdAt: 'desc' },
          });
          const priorSource = priorNote?.content.match(/via ([^.]+)\./)?.[1] ?? 'capture-order or webhook';
          await db.orderNote.create({
            data: {
              orderId: order.id,
              content: `✅ Transdirect: Cron checked — already synced via ${priorSource}. No action needed.`,
              isSystem: true,
            },
          });
        }
        // else: syncOrderToTransdirect already wrote the success note with source
        results.push({ orderId: order.id, orderNumber: order.orderNumber, result: 'booked' });
      } else {
        const isLastAttempt = currentAttempt >= MAX_ATTEMPTS;

        await db.order.update({
          where: { id: order.id },
          data: {
            transdirectOrderStatus: isLastAttempt ? 'failed' : 'queued',
            transdirectError: buildError(currentAttempt, res.error || 'Unknown error'),
          },
        });

        await db.orderNote.create({
          data: {
            orderId: order.id,
            content: isLastAttempt
              ? `❌ Transdirect auto-sync permanently failed (attempt ${currentAttempt}/${MAX_ATTEMPTS}). Use "Recalculate & Send" to retry manually.`
              : `🔄 Transdirect auto-sync attempt ${currentAttempt}/${MAX_ATTEMPTS} failed — will retry next hour.`,
            isSystem: true,
          },
        });

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          result: isLastAttempt ? 'failed_permanent' : `retry_${currentAttempt}`,
        });
      }
    }

    console.log('[TDQueue] Done:', results);
    return NextResponse.json({ processed: results.length, results });

  } catch (err) {
    console.error('[TDQueue] Cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
