//lib/services/affiliate-engine.ts
/*
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mlmService } from "@/app/actions/admin/settings/affiliates/_services/mlm-service";
import { sendNotification } from "@/app/api/email/send-notification";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { getCachedAffiliateSettings, getCachedGlobalRules } from "@/lib/services/settings-cache";

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
            user: true,
          },
        },
        user: true,
        referral: true, 
      },
    });

    if (!order) return { success: false, error: "ORDER_NOT_FOUND" };
    if (order.referral) return { success: false, error: "ALREADY_PROCESSED" };

    let affiliateId = order.affiliateId;
    let attributionSource = "COOKIE";

    if (!affiliateId && order.userId) {
      const user = await db.user.findUnique({
        where: { id: order.userId },
        select: { referredByAffiliateId: true }
      });
      if (user?.referredByAffiliateId) {
        affiliateId = user.referredByAffiliateId;
        attributionSource = "LIFETIME";
      }
    }

    if (!affiliateId) return { success: false, error: "NO_AFFILIATE" };

    const affiliate = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      include: {
        group: true,
        tier: true,
        user: true
      }
    });

    if (!affiliate || affiliate.status !== "ACTIVE") return { success: false, error: "AFFILIATE_INACTIVE" };

    const config = await getCachedAffiliateSettings();
    if (!config || !config.isActive) return { success: false, error: "PROGRAM_DISABLED" };

    if (!config.allowSelfReferral && order.userId === affiliate.userId) {
      return { success: false, error: "SELF_REFERRAL_BLOCKED" };
    }

    let totalCommission = new Prisma.Decimal(0);
    const logDetails: any[] = [];
    const globalRules = await getCachedGlobalRules();

    const orderSubtotal = DecimalMath.toDecimal(order.subtotal);
    const orderTotal = DecimalMath.toDecimal(order.total);

    for (const item of order.items) {
      let rate = new Prisma.Decimal(0);
      let type = "PERCENTAGE";
      let source = "GLOBAL_DEFAULT";
      let isExcluded = false;

      const userProductRate = await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, affiliateId: affiliate.id }
      });

      const groupProductRate = !userProductRate && affiliate.groupId ? await db.affiliateProductRate.findFirst({
        where: { productId: item.productId!, groupId: affiliate.groupId }
      }) : null;

      let matchedRule = null;
      for (const rule of globalRules) {
        const conditions = rule.conditions as any;
        let isMatch = true;

        if (conditions.minOrderAmount && DecimalMath.lt(orderTotal, conditions.minOrderAmount)) isMatch = false;
        if (conditions.categoryIds && conditions.categoryIds.length > 0) {
           // Category check logic would require fetching product categories here
           // Assuming optimized via query or cache in real scenario
        }
        if (conditions.customerType) {
           // New vs Returning check logic
        }

        if (isMatch) {
          matchedRule = rule;
          break; 
        }
      }

      if (userProductRate) {
        if (userProductRate.isDisabled) isExcluded = true;
        rate = userProductRate.rate;
        type = userProductRate.type;
        source = "PRODUCT_USER_OVERRIDE";
      } else if (groupProductRate) {
        if (groupProductRate.isDisabled) isExcluded = true;
        rate = groupProductRate.rate;
        type = groupProductRate.type;
        source = "PRODUCT_GROUP_OVERRIDE";
      } else if (matchedRule) {
        const action = matchedRule.action as any;
        rate = DecimalMath.toDecimal(action.value);
        type = action.type;
        source = `RULE: ${matchedRule.name}`;
      } else if (affiliate.group?.commissionRate) {
        rate = affiliate.group.commissionRate;
        type = "PERCENTAGE";
        source = "GROUP_DEFAULT";
      } else if (affiliate.tier?.commissionRate) {
        rate = affiliate.tier.commissionRate;
        type = affiliate.tier.commissionType;
        source = "TIER_DEFAULT";
      } else {
        rate = new Prisma.Decimal(config.commissionRate);
        type = "PERCENTAGE";
        source = "GLOBAL_DEFAULT";
      }

      if (isExcluded) {
        logDetails.push({ itemId: item.id, status: "EXCLUDED" });
        continue;
      }

      let itemBasePrice = DecimalMath.fromOrder(
        item.total, 
        item.tax, 
        0, 
        config.excludeTax, 
        config.excludeShipping
      );

      let itemComm = new Prisma.Decimal(0);
      
      if (type === "FIXED") {
        itemComm = DecimalMath.mul(rate, item.quantity);
      } else {
        itemComm = DecimalMath.percent(itemBasePrice, rate);
      }

      totalCommission = DecimalMath.add(totalCommission, itemComm);
      logDetails.push({ 
        itemId: item.id, 
        productName: item.productName,
        source, 
        rate: rate.toString(), 
        type, 
        basePrice: itemBasePrice.toString(), 
        commission: itemComm.toString() 
      });
    }

    if (DecimalMath.isZero(totalCommission) && !config.zeroValueReferrals) {
       return { success: true, message: "ZERO_COMMISSION_IGNORED" };
    }

    await db.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          affiliateId: affiliate.id,
          orderId: order.id,
          totalOrderAmount: orderTotal,
          netOrderAmount: orderSubtotal,
          commissionAmount: totalCommission,
          status: "PENDING", 
          commissionType: "PERCENTAGE",
          commissionRate: new Prisma.Decimal(0),
          metadata: { 
            calculationLog: logDetails, 
            attribution: attributionSource 
          }
        }
      });

      await tx.affiliateAccount.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: { increment: totalCommission },
          balance: { increment: totalCommission },
          ...(order.userId && config.isLifetimeLinkOnPurchase && !affiliate.user.referredByAffiliateId ? {
             customerReferrals: { connect: { id: order.userId } } 
          } : {})
        }
      });

      await tx.affiliateLedger.create({
        data: {
          affiliateId: affiliate.id,
          type: "COMMISSION",
          amount: totalCommission,
          balanceBefore: affiliate.balance,
          balanceAfter: DecimalMath.add(affiliate.balance, totalCommission),
          description: `Commission for Order #${order.orderNumber}`,
          referenceId: referral.id
        }
      });
    });

    await mlmService.distributeMLMCommission(order.id, affiliate.id, orderSubtotal);

    await sendNotification({
        trigger: "COMMISSION_EARNED",
        recipient: affiliate.user.email,
        data: {
            commission_amount: totalCommission.toFixed(2),
            order_number: order.orderNumber
        },
        userId: affiliate.userId
    });

    return { success: true, commission: totalCommission };
  }
};*/