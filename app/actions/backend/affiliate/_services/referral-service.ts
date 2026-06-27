// app/actions/backend/affiliate/_services/referral-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { protectAction } from "@/app/actions/backend/affiliate/permission-service";
import { auditService } from "@/lib/audit-service";
import { processPendingReferrals } from "@/app/actions/backend/affiliate/cron-service";

export interface ReferralItem {
  id: string;
  orderId: string | null;
  affiliateId: string;
  commissionAmount: number;
  netOrderAmount: number;
  status: string;
  isManual: boolean;
  adminNote: string | null;
  availableAt: string | null;
  paidAt: string | null;
  createdAt: string;
  affiliate: {
    slug: string;
    user: { name: string | null; email: string };
  } | null;
  order: { orderNumber: string } | null;
}

export interface ReferralsPageData {
  items: ReferralItem[];
  total: number;
  totalPages: number;
  pendingCount: number;
  readyCount: number;
}

// ─── LIST ────────────────────────────────────────────────────────────────────

export async function getReferrals(
  page = 1,
  limit = 20,
  status?: string,
  search?: string
): Promise<ReferralsPageData> {
  await protectAction("VIEW_ANALYTICS");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } },
      { affiliate: { user: { email: { contains: search, mode: "insensitive" } } } },
      { order: { orderNumber: { contains: search, mode: "insensitive" } } },
    ];
  }

  const now = new Date();
  const [items, total, pendingCount, readyCount] = await Promise.all([
    db.referral.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: { select: { slug: true, user: { select: { name: true, email: true } } } },
        order: { select: { orderNumber: true } },
      },
    }),
    db.referral.count({ where }),
    db.referral.count({ where: { status: "PENDING" } }),
    db.referral.count({ where: { status: "PENDING", availableAt: { lte: now } } }),
  ]);

  return {
    items: items.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      affiliateId: r.affiliateId,
      commissionAmount: Number(r.commissionAmount),
      netOrderAmount: Number(r.netOrderAmount),
      status: r.status,
      isManual: r.isManual,
      adminNote: r.adminNote,
      availableAt: r.availableAt?.toISOString() ?? null,
      paidAt: r.paidAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      affiliate: r.affiliate
        ? { slug: r.affiliate.slug, user: { name: r.affiliate.user.name, email: r.affiliate.user.email } }
        : null,
      order: r.order ? { orderNumber: r.order.orderNumber } : null,
    })),
    total,
    totalPages: Math.ceil(total / limit),
    pendingCount,
    readyCount,
  };
}

// ─── APPROVE (SINGLE) ────────────────────────────────────────────────────────

export async function approveReferralManually(referralId: string): Promise<{ success: boolean; message: string }> {
  const actor = await protectAction("MANAGE_FINANCE");

  const ref = await db.referral.findUnique({
    where: { id: referralId },
    include: { affiliate: { include: { user: true } } },
  });

  if (!ref) return { success: false, message: "Referral not found" };
  if (ref.status !== "PENDING") return { success: false, message: `Cannot approve — status is ${ref.status}` };
  if (!ref.affiliate) return { success: false, message: "Affiliate not found" };

  await db.$transaction(async (tx) => {
    // 1. Add commission to affiliate balance
    await tx.affiliateAccount.update({
      where: { id: ref.affiliateId },
      data: {
        balance: { increment: ref.commissionAmount },
        totalEarnings: { increment: ref.commissionAmount },
      },
    });

    // 2. Mark referral APPROVED
    await tx.referral.update({
      where: { id: referralId },
      data: { status: "APPROVED", paidAt: new Date(), adminNote: `Manually approved by admin (${actor.email})` },
    });

    // 3. Wallet transaction
    const wallet = await tx.wallet.upsert({
      where: { userId: ref.affiliate!.userId },
      create: { userId: ref.affiliate!.userId, balance: 0 },
      update: {},
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "AFFILIATE_COMMISSION",
        amount: ref.commissionAmount,
        description: `Commission Manually Approved: #${ref.orderId}`,
        reference: `MANUAL-${ref.id}`,
      },
    });

    // 4. Email notification
    if (ref.affiliate!.user.email) {
      await tx.notificationQueue.create({
        data: {
          channel: "EMAIL",
          recipient: ref.affiliate!.user.email,
          templateSlug: "commission_earned",
          status: "PENDING",
          userId: ref.affiliate!.userId,
          content: "",
          metadata: { amount: ref.commissionAmount.toString(), order_id: ref.orderId ?? "" },
        },
      });
    }
  });

  await auditService.log({
    userId: actor.id,
    action: "UPDATE",
    entity: "Referral",
    entityId: referralId,
    oldData: { status: "PENDING" },
    newData: { status: "APPROVED" },
    meta: { action: "MANUAL_APPROVE" },
  });

  revalidatePath("/admin/affiliate");
  return { success: true, message: "Referral approved and commission added to balance." };
}

// ─── REJECT (SINGLE) ─────────────────────────────────────────────────────────

export async function rejectReferralManually(referralId: string, reason: string): Promise<{ success: boolean; message: string }> {
  const actor = await protectAction("MANAGE_FINANCE");

  const ref = await db.referral.findUnique({ where: { id: referralId } });
  if (!ref) return { success: false, message: "Referral not found" };
  if (ref.status !== "PENDING") return { success: false, message: `Cannot reject — status is ${ref.status}` };

  await db.referral.update({
    where: { id: referralId },
    data: { status: "REJECTED", adminNote: reason || `Rejected by admin (${actor.email})` },
  });

  await auditService.log({
    userId: actor.id,
    action: "UPDATE",
    entity: "Referral",
    entityId: referralId,
    oldData: { status: "PENDING" },
    newData: { status: "REJECTED" },
    meta: { action: "MANUAL_REJECT", reason },
  });

  revalidatePath("/admin/affiliate");
  return { success: true, message: "Referral rejected." };
}

// ─── BULK APPROVE (only referrals past holding period) ───────────────────────

export async function runReadyReferrals(): Promise<{ success: boolean; message: string; approved: number }> {
  await protectAction("MANAGE_FINANCE");

  await processPendingReferrals();

  const approved = await db.referral.count({ where: { status: "APPROVED", paidAt: { gte: new Date(Date.now() - 60_000) } } });

  revalidatePath("/admin/affiliate");
  return { success: true, message: "Processed all referrals past holding period.", approved };
}

// ─── BULK MANUAL APPROVE (force-approve regardless of holding period) ─────────

export async function bulkApproveReferrals(referralIds: string[]): Promise<{ success: boolean; message: string; approved: number }> {
  const actor = await protectAction("MANAGE_FINANCE");

  let approved = 0;

  for (const id of referralIds) {
    const result = await approveReferralManually(id);
    if (result.success) approved++;
  }

  await auditService.log({
    userId: actor.id,
    action: "BULK_UPDATE",
    entity: "Referral",
    entityId: "bulk",
    oldData: {},
    newData: { status: "APPROVED", count: approved },
    meta: { action: "BULK_MANUAL_APPROVE", referralIds },
  });

  revalidatePath("/admin/affiliate");
  return { success: true, message: `Approved ${approved} of ${referralIds.length} referrals.`, approved };
}
