"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role === Role.CUSTOMER || user.role === Role.SUBSCRIBER) throw new Error("Unauthorized");
  return user;
}

export async function getWalletList(page = 1, search = "") {
  await requireAdmin();
  const ITEMS_PER_PAGE = 20;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where = search
    ? {
        user: {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      }
    : {};

  const [wallets, total] = await Promise.all([
    db.wallet.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { balance: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, role: true } },
        _count: { select: { transactions: true } },
      },
    }),
    db.wallet.count({ where }),
  ]);

  return { wallets, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) };
}

export async function getWalletByUserId(userId: string) {
  await requireAdmin();
  return db.wallet.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function adjustWalletBalance(
  userId: string,
  amount: number,
  type: "ADD" | "DEDUCT",
  description: string
) {
  await requireAdmin();

  if (!amount || amount <= 0) return { success: false, message: "Invalid amount." };
  if (!description.trim()) return { success: false, message: "Description is required." };

  const finalAmount = type === "DEDUCT" ? -Math.abs(amount) : Math.abs(amount);

  try {
    await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: 0, points: 0 },
        update: {},
      });

      const newBalance = Number(wallet.balance) + finalAmount;
      if (newBalance < 0) throw new Error("Insufficient balance.");

      await tx.wallet.update({
        where: { userId },
        data: { balance: new Prisma.Decimal(newBalance) },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(Math.abs(finalAmount)),
          type: "ADJUSTMENT",
          description: `[Admin] ${description}`,
        },
      });
    });

    revalidatePath(`/admin/wallet/${userId}`);
    revalidatePath("/admin/wallet");
    return { success: true, message: `Balance ${type === "ADD" ? "added" : "deducted"} successfully.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to adjust balance." };
  }
}
