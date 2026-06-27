// app/api/log/payment-error/route.ts
// Client components cannot call auditService directly (it uses Next.js server APIs).
// This lightweight endpoint bridges client-side checkout errors into the DB SystemLog
// so admins can see payment failure details in the audit panel.

import { NextResponse } from 'next/server';
import { auditService } from '@/lib/audit-service';

interface PaymentErrorPayload {
  step: string;
  error: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as PaymentErrorPayload;
    const { step, error, metadata } = body;

    if (!step || !error || typeof step !== 'string' || typeof error !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    await auditService.systemLog(
      'ERROR',
      `CHECKOUT_${step.toUpperCase().replace(/\s/g, '_')}`,
      error.slice(0, 500),
      metadata ?? null,
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
