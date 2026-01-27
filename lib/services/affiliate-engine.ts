// File: lib/services/affiliate-engine.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mlmService } from "@/app/actions/admin/settings/affiliates/_services/mlm-service";
import { sendNotification } from "@/app/api/email/send-notification"; // Ensure correct path

export const affiliateEngine = {
  
  async processOrder(orderId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        affiliate: {
          include: {
            group: true,
            tier: true,
            tags: true,
            user: true
          }
        }
      }
    });

    if (!order || !order.affiliateId || !order.affiliate) return;

    const affiliate = order.affiliate;
    const globalSettings = await db.storeSettings.findUnique({ 
        where: { id: "settings" },
        select: { affiliateConfig: true } 
    });
    
    // Default fallback
    const config = (globalSettings?.affiliateConfig as any) || { commissionRate: 10, excludeShipping: true, excludeTax: true };
    
    let totalCommission = new Prisma.Decimal(0);
    const logDetails: any[] = [];

    // Calculate Commission per Item
    for (const item of order.items) {
      let rate = new Prisma.Decimal(0);
      let type = "PERCENTAGE";
      let source = "GLOBAL";

      // 1. User Specific Product Rate
      const userProductRate = await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, affiliateId: affiliate.id, isDisabled: false }
      });

      // 2. Group Specific Product Rate
      const groupProductRate = !userProductRate && affiliate.groupId ? await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, groupId: affiliate.groupId, isDisabled: false }
      }) : null;

      // 3. General Rules
      const groupRate = affiliate.group?.commissionRate;
      const tierRate = affiliate.tier?.commissionRate;

      if (userProductRate) {
        rate = userProductRate.rate;
        type = userProductRate.type;
        source = "PRODUCT_USER_OVERRIDE";
      } else if (groupProductRate) {
        rate = groupProductRate.rate;
        type = groupProductRate.type;
        source = "PRODUCT_GROUP_OVERRIDE";
      } else if (groupRate) {
        rate = groupRate;
        type = "PERCENTAGE";
        source = "GROUP_DEFAULT";
      } else if (tierRate) {
        rate = tierRate;
        type = affiliate.tier?.commissionType || "PERCENTAGE";
        source = "TIER_DEFAULT";
      } else {
        rate = new Prisma.Decimal(config.commissionRate || 0);
        type = "PERCENTAGE";
        source = "GLOBAL_DEFAULT";
      }

      let itemBasePrice = item.total; 
      // Note: Add logic to subtract tax/shipping here based on `config.excludeTax`
      
      let itemComm = new Prisma.Decimal(0);
      if (type === "FIXED") {
        itemComm = rate.mul(item.quantity);
      } else {
        itemComm = itemBasePrice.mul(rate).div(100);
      }

      totalCommission = totalCommission.add(itemComm);
      logDetails.push({ itemId: item.id, source, rate, amount: itemComm });
    }

    // Database Transaction
    await db.$transaction(async (tx) => {
      // 1. Create Referral Record
      await tx.referral.create({
        data: {
          affiliateId: affiliate.id,
          orderId: order.id,
          totalOrderAmount: order.total,
          netOrderAmount: order.subtotal,
          commissionAmount: totalCommission,
          status: "PENDING", // Subject to holding period
          commissionType: "PERCENTAGE", 
          commissionRate: new Prisma.Decimal(0), // Variable rates
          metadata: { calculationLog: logDetails }
        }
      });

      // 2. Update Affiliate Balance
      await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: { increment: totalCommission },
          balance: { increment: totalCommission } 
        }
      });

      // 3. Create Ledger Entry
      await tx.affiliateLedger.create({
        data: {
          affiliateId: affiliate.id,
          type: "COMMISSION",
          amount: totalCommission,
          balanceBefore: affiliate.balance,
          balanceAfter: affiliate.balance.add(totalCommission),
          description: `Commission for Order #${order.orderNumber}`,
          referenceId: order.id
        }
      });
    });

    // MLM Distribution
    await mlmService.distributeMLMCommission(order.id, affiliate.id, order.subtotal.toNumber());
    
    // Send Notification
    await sendNotification({
        trigger: "COMMISSION_EARNED",
        recipient: affiliate.user.email,
        data: {
            commission_amount: totalCommission.toString(),
            order_number: order.orderNumber
        },
        userId: affiliate.userId
    });

    return { success: true, commission: totalCommission };
  }
};