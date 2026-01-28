// File: app/actions/admin/settings/affiliate/_services/affiliate-engine.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { getCachedAffiliateSettings, getCachedGlobalRules } from "@/lib/services/settings-cache";
import { distributeMLMCommission } from "./mlm-service";

export async function processOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { categoryId: true, category: true }
          }
        }
      },
      affiliate: {
        include: {
          group: true,
          tier: true,
          tags: true,
          user: true,
        },
      },
      user: {
        include: {
          orders: {
            select: { id: true },
            take: 2
          }
        }
      },
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
  
  const isNewCustomer = !order.user || order.user.orders.length <= 1;

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
        if (!item.product || !item.product.categoryId || !conditions.categoryIds.includes(item.product.categoryId)) {
          isMatch = false;
        }
      }

      if (conditions.customerType) {
        if (conditions.customerType === "NEW" && !isNewCustomer) isMatch = false;
        if (conditions.customerType === "RETURNING" && isNewCustomer) isMatch = false;
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
    const availableDate = new Date();
    availableDate.setDate(availableDate.getDate() + (config.holdingPeriod || 14));

    await tx.referral.create({
      data: {
        affiliateId: affiliate.id,
        orderId: order.id,
        totalOrderAmount: orderTotal,
        netOrderAmount: orderSubtotal,
        commissionAmount: totalCommission,
        status: "PENDING",
        commissionType: "PERCENTAGE", 
        commissionRate: new Prisma.Decimal(0), 
        availableAt: availableDate,
        metadata: { 
          calculationLog: logDetails, 
          attribution: attributionSource 
        }
      }
    });

    if (order.userId && config.isLifetimeLinkOnPurchase && !affiliate.user.referredByAffiliateId) {
      await tx.affiliateAccount.update({
         where: { id: affiliate.id },
         data: { customerReferrals: { connect: { id: order.userId } } }
      });
    }
  });

  await distributeMLMCommission(order.id, affiliate.id, orderSubtotal, config.holdingPeriod || 14);

  await sendNotification({
      trigger: "REFERRAL_PENDING",
      recipient: affiliate.user.email,
      data: {
          commission_amount: totalCommission.toFixed(2),
          order_number: order.orderNumber,
          holding_period: (config.holdingPeriod || 14).toString()
      },
      userId: affiliate.userId
  });

  return { success: true, commission: totalCommission };
}