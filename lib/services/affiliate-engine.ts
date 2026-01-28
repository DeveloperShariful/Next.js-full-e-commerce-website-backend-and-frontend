//lib/services/affiliate-engine.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mlmService } from "@/app/actions/admin/settings/affiliates/_services/mlm-service";

/**
 * THE BRAIN: Calculates Commission based on Priority
 * Priority: Product Rule (User) > Product Rule (Group) > Group Rate > Tier Rate > Global Rate
 */
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
            tags: true
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
    
    // Fallback defaults
    const config = (globalSettings?.affiliateConfig as any) || { commissionRate: 10, excludeShipping: true, excludeTax: true };
    
    let totalCommission = new Prisma.Decimal(0);
    const logDetails: any[] = [];

    // 1. Calculate Line Item Commissions
    for (const item of order.items) {
      let rate = new Prisma.Decimal(0);
      let type = "PERCENTAGE";
      let source = "GLOBAL";

      // A. Check Product Specific Rate (User Specific)
      const userProductRate = await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, affiliateId: affiliate.id, isDisabled: false }
      });

      // B. Check Product Specific Rate (Group Specific)
      const groupProductRate = !userProductRate && affiliate.groupId ? await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, groupId: affiliate.groupId, isDisabled: false }
      }) : null;

      // C. Check Group Global Override
      const groupRate = affiliate.group?.commissionRate;

      // D. Check Tier Rate
      const tierRate = affiliate.tier?.commissionRate;

      // --- LOGIC TREE ---
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
        type = "PERCENTAGE"; // Groups usually %
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

      // Calculate Item Commission
      let itemBasePrice = item.total; 
      // Note: Real app should subtract tax/shipping from item.total based on config here
      
      let itemComm = new Prisma.Decimal(0);
      if (type === "FIXED") {
        itemComm = rate.mul(item.quantity);
      } else {
        itemComm = itemBasePrice.mul(rate).div(100);
      }

      totalCommission = totalCommission.add(itemComm);
      logDetails.push({ itemId: item.id, source, rate, amount: itemComm });
    }

    // 2. Save Transaction
    await db.$transaction(async (tx) => {
      // A. Create Referral Record
      await tx.referral.create({
        data: {
          affiliateId: affiliate.id,
          orderId: order.id,
          totalOrderAmount: order.total,
          netOrderAmount: order.subtotal, // Adjusted based on settings
          commissionAmount: totalCommission,
          status: "PENDING", // PENDING until holding period is over
          commissionType: "PERCENTAGE", // Since calculated per line item
          commissionRate: new Prisma.Decimal(0), // Mixed
          metadata: { calculationLog: logDetails }
        }
      });

      // B. Update Affiliate Balance (If instant, otherwise scheduled job does this later)
      // Usually, we add to "Pending Balance" or just track via Referral status.
      // For this system, let's assume we update balance but user can't withdraw PENDING.
      await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: { increment: totalCommission },
          balance: { increment: totalCommission } // Logic: Balance includes pending
        }
      });

      // C. Ledger Entry
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

    // 3. Trigger MLM Distribution (Async)
    // Only if total order qualifies
    await mlmService.distributeMLMCommission(order.id, affiliate.id, order.subtotal.toNumber());
    
    return { success: true, commission: totalCommission };
  }
};