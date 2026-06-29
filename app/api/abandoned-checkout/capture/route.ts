// app/api/abandoned-checkout/capture/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, cartItems, subtotal } = body as {
      email: string;
      cartItems: unknown[];
      subtotal: number;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as { id?: string })?.id ?? null;

    const headerList = await headers();
    const ipAddress =
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerList.get('x-real-ip') ||
      null;
    const userAgent = headerList.get('user-agent') || null;

    const existing = await db.abandonedCheckout.findFirst({
      where: { email, isRecovered: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, userId: true },
    });

    let recordId: string;

    if (existing) {
      await db.abandonedCheckout.update({
        where: { id: existing.id },
        data: {
          items: cartItems as unknown as Prisma.InputJsonValue,
          subtotal,
          ...(userId && !existing.userId ? { userId } : {}),
        },
      });
      recordId = existing.id;
    } else {
      const created = await db.abandonedCheckout.create({
        data: {
          email,
          userId,
          items: cartItems as unknown as Prisma.InputJsonValue,
          subtotal,
          recoveryUrl: '',
          ipAddress,
          userAgent,
        },
        select: { id: true },
      });
      recordId = created.id;
      await db.abandonedCheckout.update({
        where: { id: recordId },
        data: { recoveryUrl: `${APP_URL}/checkout?recover=${recordId}` },
      });
    }

    return NextResponse.json({ success: true, recoveryToken: recordId });
  } catch (error) {
    console.error('[AbandonedCheckout Capture]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
