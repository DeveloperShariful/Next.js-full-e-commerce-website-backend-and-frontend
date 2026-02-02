// File: app/actions/admin/settings/affiliate/affiliate-engine.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { getCachedAffiliateSettings, getCachedGlobalRules } from "@/lib/services/settings-cache";
import { distributeMLMCommission } from "./_services/mlm-network-service";
import { detectSelfReferral, checkVelocity } from "./_services/fraud-service";
import { auditService } from "@/lib/services/audit-service";

export async function processOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId, deletedAt: null }, 
    include: {
      items: {
        include: {
          product: {
            select: { 
              id: true, 
              categoryId: true, 
              name: true,
              costPerItem: true,
              affiliateCommissionRate: true,
              affiliateCommissionType: true,
              disableAffiliate: true 
            }
          }
        }
      },
      discount: true, 
      user: {
        include: {
          orders: { select: { id: true }, take: 2 } 
        }
      }
    },
  });

  if (!order) return { success: false, error: "ORDER_NOT_FOUND" };

  const existingReferral = await db.referral.findFirst({
    where: { orderId: orderId }
  });

  if (existingReferral) {
    return { success: false, error: "ALREADY_PROCESSED" };
  }

  let affiliateId = order.affiliateId;
  let attributionSource = "COOKIE";

  if (order.discount && order.discount.affiliateId) {
    affiliateId = order.discount.affiliateId;
    attributionSource = "COUPON";
  } else if (!affiliateId && order.userId) {
    const user = await db.user.findUnique({
      where: { id: order.userId, deletedAt: null },
      select: { referredByAffiliateId: true }
    });
    if (user?.referredByAffiliateId) {
      affiliateId = user.referredByAffiliateId;
      attributionSource = "LIFETIME";
    }
  }

  if (!affiliateId) return { success: false, error: "NO_AFFILIATE" };

  const affiliate = await db.affiliateAccount.findFirst({
    where: { id: affiliateId, deletedAt: null },
    include: { group: true, tier: true, user: true }
  });

  if (!affiliate || affiliate.status !== "ACTIVE") return { success: false, error: "AFFILIATE_INACTIVE" };

  const config = await getCachedAffiliateSettings();
  if (!config || !config.isActive) return { success: false, error: "PROGRAM_DISABLED" };

  const buyerEmail = order.guestEmail || order.user?.email;
  const buyerIp = order.ipAddress || "0.0.0.0";

  if (buyerEmail) {
    const [isSelf, isHighVelocity] = await Promise.all([
      detectSelfReferral(affiliateId, buyerEmail, buyerIp),
      checkVelocity(affiliateId)
    ]);

    if ((isSelf && !config.allowSelfReferral) || isHighVelocity) {
      await auditService.systemLog("WARN", "AFFILIATE_ENGINE", `Commission Blocked: Fraud Rules`, {
        order: order.orderNumber,
        reason: isHighVelocity ? "VELOCITY_LIMIT" : "SELF_REFERRAL"
      });
      return { success: false, error: isHighVelocity ? "VELOCITY_BLOCKED" : "SELF_REFERRAL_BLOCKED" };
    }
  }

  const isGiftCardPayment = order.paymentMethod === "GIFT_CARD"; 

  const productIds = order.items.map(i => i.productId).filter(Boolean) as string[];
  
  const [userRates, groupRates] = await Promise.all([
    db.affiliateProductRate.findMany({
      where: { 
        productId: { in: productIds }, 
        affiliateId: affiliate.id
      }
    }),
    affiliate.groupId ? db.affiliateProductRate.findMany({
      where: { 
        productId: { in: productIds }, 
        groupId: affiliate.groupId
      }
    }) : Promise.resolve([])
  ]);

  const userRateMap = new Map(userRates.map(r => [r.productId, r]));
  const groupRateMap = new Map(groupRates.map(r => [r.productId, r]));

  let totalCommission = new Prisma.Decimal(0);
  let totalProfit = new Prisma.Decimal(0);
  let matchedRuleId: string | null = null; 
  const itemsBreakdown: any[] = [];
  const globalRules = await getCachedGlobalRules();
  
  const orderSubtotal = DecimalMath.toDecimal(order.subtotal);
  const orderTotal = DecimalMath.toDecimal(order.total);
  const isNewCustomer = !order.user || order.user.orders.length <= 1;

  for (const item of order.items) {
    if (!item.productId) continue;

    const cost = item.product?.costPerItem ? DecimalMath.toDecimal(item.product.costPerItem) : new Prisma.Decimal(0);
    const itemProfit = DecimalMath.sub(item.total, DecimalMath.mul(cost, item.quantity));
    totalProfit = DecimalMath.add(totalProfit, itemProfit);

    if (item.product?.disableAffiliate) {
      itemsBreakdown.push({
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        commission: 0,
        status: "EXCLUDED_BY_PRODUCT",
        profit: itemProfit
      });
      continue;
    }

    let rate = new Prisma.Decimal(0);
    let type = "PERCENTAGE";
    let source = "GLOBAL_DEFAULT";
    let isExcluded = false;

    const userProductRate = userRateMap.get(item.productId);
    const groupProductRate = groupRateMap.get(item.productId);

    if (userProductRate && userProductRate.isDisabled) {
        isExcluded = true;
        source = "USER_OVERRIDE_DISABLED";
    } else if (!userProductRate && groupProductRate && groupProductRate.isDisabled) {
        isExcluded = true;
        source = "GROUP_OVERRIDE_DISABLED";
    }

    if (isExcluded) {
      itemsBreakdown.push({
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        commission: 0,
        status: "EXCLUDED",
        source,
        profit: itemProfit 
      });
      continue;
    }

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
      rate = userProductRate.rate;
      type = userProductRate.type;
      source = "PRODUCT_USER_OVERRIDE";
    } else if (groupProductRate) {
      rate = groupProductRate.rate;
      type = groupProductRate.type;
      source = "PRODUCT_GROUP_OVERRIDE";
    } else if (matchedRule) {
      const action = matchedRule.action as any;
      rate = DecimalMath.toDecimal(action.value);
      type = action.type;
      source = `RULE: ${matchedRule.name}`;
      matchedRuleId = matchedRule.id; 
    } else if (order.discount?.affiliateCommissionRate) {
      rate = order.discount.affiliateCommissionRate;
      if (order.discount.type === 'FIXED_AMOUNT' || order.discount.type === 'FIXED_CART' || order.discount.type === 'FIXED_PRODUCT') {
         type = "FIXED";
      } else {
         type = "PERCENTAGE";
      }
      source = "COUPON_RATE";
    } else if (item.product?.affiliateCommissionRate) {
        rate = item.product.affiliateCommissionRate;
        type = item.product.affiliateCommissionType || "PERCENTAGE";
        source = "PRODUCT_DEFAULT";
    } else if (affiliate.group?.commissionRate) {
      rate = affiliate.group.commissionRate;
      type = affiliate.group.commissionType;
      source = "GROUP_DEFAULT";
    } else if (affiliate.tier?.commissionRate) {
      rate = affiliate.tier.commissionRate;
      type = affiliate.tier.commissionType;
      source = "TIER_DEFAULT";
    } else {
      rate = new Prisma.Decimal(config.commissionRate || 10);
      type = config.commissionType || "PERCENTAGE";
      source = "GLOBAL_DEFAULT";
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
    
    itemsBreakdown.push({
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      rate: rate.toString(),
      type,
      source,
      commission: itemComm,
      profit: itemProfit, 
      isRefunded: false
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
        commissionRuleId: matchedRuleId, 
        isRecurring: false, 
        metadata: {
          itemsBreakdown,
          attribution: attributionSource,
          totalProfit: totalProfit,
          isGiftCard: isGiftCardPayment
        }
      }
    });

    if (order.userId && config.isLifetimeLinkOnPurchase && !affiliate.user.referredByAffiliateId) {
      await tx.user.update({
        where: { id: order.userId },
        data: { referredByAffiliateId: affiliate.id }
      });
    }

    await distributeMLMCommission(tx, order.id, affiliate.id, orderSubtotal, totalProfit, config.holdingPeriod || 14);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await tx.affiliateAnalyticsSummary.upsert({
      where: {
        affiliateId_date: {
          affiliateId: affiliate.id,
          date: today
        }
      },
      create: {
        affiliateId: affiliate.id,
        date: today,
        conversions: 1,
        revenue: orderTotal,
        commission: totalCommission
      },
      update: {
        conversions: { increment: 1 },
        revenue: { increment: orderTotal },
        commission: { increment: totalCommission }
      }
    });

    // Notification
    await tx.notificationQueue.create({
      data: {
        channel: "EMAIL",
        recipient: affiliate.user.email,
        templateSlug: "REFERRAL_PENDING",
        status: "PENDING",
        userId: affiliate.userId,
        content: "",
        metadata: {
          commission_amount: totalCommission.toFixed(2),
          order_number: order.orderNumber,
          holding_period: (config.holdingPeriod || 14).toString()
        }
      }
    });
  });

  return { success: true, commission: totalCommission };
}

export async function processRefund(orderId: string, refundedItemIds: string[]) {
  const referral = await db.referral.findFirst({ where: { orderId } });
  if (!referral) return { success: false, error: "NO_REFERRAL_FOUND" };
  if (referral.status === "REJECTED") return { success: true, message: "ALREADY_REJECTED" };

  const breakdown = (referral.metadata as any)?.itemsBreakdown || [];
  let refundDeduction = new Prisma.Decimal(0);
  let updatedBreakdown = [...breakdown];

  refundedItemIds.forEach(itemId => {
    const itemIndex = updatedBreakdown.findIndex((i: any) => i.orderItemId === itemId);
    if (itemIndex > -1 && !updatedBreakdown[itemIndex].isRefunded) {
      const amount = new Prisma.Decimal(updatedBreakdown[itemIndex].commission);
      refundDeduction = DecimalMath.add(refundDeduction, amount);
      updatedBreakdown[itemIndex].isRefunded = true;
    }
  });

  if (DecimalMath.isZero(refundDeduction)) return { success: true, message: "NO_COMMISSION_TO_REFUND" };

  await db.$transaction(async (tx) => {
    if (referral.status === "PENDING") {
      const newCommission = DecimalMath.sub(referral.commissionAmount, refundDeduction);
      if (DecimalMath.lte(newCommission, 0)) {
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: "REJECTED", metadata: { ...referral.metadata as any, itemsBreakdown: updatedBreakdown } }
        });
      } else {
        await tx.referral.update({
          where: { id: referral.id },
          data: { commissionAmount: newCommission, metadata: { ...referral.metadata as any, itemsBreakdown: updatedBreakdown } }
        });
      }
    } else if (referral.status === "PAID" || referral.status === "APPROVED") {
      const affiliate = await tx.affiliateAccount.findUnique({ where: { id: referral.affiliateId! }});
      if(affiliate) {
        await tx.affiliateAccount.update({
          where: { id: affiliate.id },
          data: { 
            balance: { decrement: refundDeduction }, 
            totalEarnings: { decrement: refundDeduction } 
          }
        });
        
        await tx.affiliateLedger.create({
          data: {
            affiliateId: affiliate.id,
            type: "REFUND_DEDUCTION",
            amount: refundDeduction,
            balanceBefore: affiliate.balance,
            balanceAfter: DecimalMath.sub(affiliate.balance, refundDeduction),
            description: `Clawback for Refunded Items: Order #${orderId}`,
            referenceId: orderId
          }
        });
      }
      await tx.referral.update({
        where: { id: referral.id },
        data: { metadata: { ...referral.metadata as any, itemsBreakdown: updatedBreakdown } }
      });
    }
  });

  return { success: true, deduction: refundDeduction };
}