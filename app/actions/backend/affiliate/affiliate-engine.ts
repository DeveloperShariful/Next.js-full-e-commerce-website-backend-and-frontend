// File: app/actions/backend/affiliate/affiliate-engine.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DecimalMath } from "@/lib/decimal-math";
import { getCachedAffiliateSettings, getCachedGlobalRules } from "@/lib/global-settings-cache";
import { detectSelfReferral, checkVelocity } from "./_services/fraud-service";
import { auditService } from "@/lib/audit-service";

interface RuleConditions {
  minOrderAmount?: number;
  maxOrderAmount?: number;
  categoryIds?: string[];
  customerType?: "ALL" | "NEW" | "RETURNING";
  productTags?: string[];
}

interface RuleAction {
  type: "PERCENTAGE" | "FIXED" | "BONUS_FIXED" | "BONUS_PERCENTAGE";
  value: number;
  tierBonus?: number;
}

interface ItemBreakdown {
  orderItemId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity?: number;
  price?: number;
  total?: number;
  rate?: string;
  type?: string;
  source?: string;
  commission: number;
  profit?: number;
  status?: string;
  isRefunded?: boolean;
}

interface ReferralMetadata extends Record<string, unknown> {
  itemsBreakdown?: ItemBreakdown[];
  attribution?: string;
  totalProfit?: string;
  isGiftCard?: boolean;
}

export async function processOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId, deletedAt: null }, 
    include: {
      items: {
        include: {
          product: {
            select: { 
              id: true, 
              categories: { select: { id: true } },
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
  let couponOverrideRate: Prisma.Decimal | null = null;

  if (order.discount && order.discount.affiliateId) {
    affiliateId = order.discount.affiliateId;
    attributionSource = "COUPON";
    // Coupon-এর custom commission rate থাকলে সংরক্ষণ করো
    if (order.discount.affiliateCommissionRate) {
      couponOverrideRate = order.discount.affiliateCommissionRate;
    }
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

  // ✅ FIXED: Removed 'group' inclusion because Group table was deleted
  const affiliate = await db.affiliateAccount.findFirst({
    where: { id: affiliateId, deletedAt: null },
    include: { tier: true, user: true }
  });

  if (!affiliate || affiliate.status !== "ACTIVE") return { success: false, error: "AFFILIATE_INACTIVE" };

  const config = await getCachedAffiliateSettings();
  if (!config || !config.isActive) return { success: false, error: "PROGRAM_DISABLED" };

  // Coupon attribution হলে একটা synthetic click তৈরি করো
  if (attributionSource === "COUPON") {
    await db.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: order.ipAddress || "coupon",
        userAgent: "COUPON_REDEMPTION",
        referrer: "",
        landingPage: `order:${order.orderNumber}`,
        deviceType: "unknown",
        utmSource: "coupon",
        utmCampaign: order.discount?.code || undefined,
      }
    }).catch(() => {});

    await auditService.systemLog("INFO", "AFFILIATE_ENGINE", `Coupon Attribution: ${order.discount?.code}`, {
      affiliateId: affiliate.id,
      orderId: order.id,
      couponCode: order.discount?.code,
      couponRate: couponOverrideRate?.toString() ?? "default",
    });
  }

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
  
  // Query affiliate-specific and tier-specific product rates
  const [userRates, tierRates] = await Promise.all([
    db.affiliateProductRate.findMany({
      where: { productId: { in: productIds }, affiliateId: affiliate.id }
    }),
    affiliate.tierId
      ? db.affiliateProductRate.findMany({
          where: { productId: { in: productIds }, tierId: affiliate.tierId }
        })
      : Promise.resolve([])
  ]);

  const userRateMap = new Map(userRates.map(r => [r.productId, r]));
  const tierRateMap = new Map(tierRates.map(r => [r.productId, r]));

  let totalCommission = new Prisma.Decimal(0);
  let totalProfit = new Prisma.Decimal(0);
  let matchedRuleId: string | null = null; 
  const itemsBreakdown: ItemBreakdown[] = [];
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
        profit: DecimalMath.toNumber(itemProfit)
      });
      continue;
    }

    let rate = new Prisma.Decimal(0);
    let type = "PERCENTAGE";
    let source = "GLOBAL_DEFAULT";
    let isExcluded = false;

    const userProductRate = userRateMap.get(item.productId);

    if (userProductRate && userProductRate.isDisabled) {
      isExcluded = true;
      source = "USER_OVERRIDE_DISABLED";
    } else if (!userProductRate && tierRateMap.get(item.productId)?.isDisabled) {
      isExcluded = true;
      source = "TIER_OVERRIDE_DISABLED";
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
        profit: DecimalMath.toNumber(itemProfit)
      });
      continue;
    }

    let matchedRule = null;
    let matchedBonusRule = null;

    for (const rule of globalRules) {
      const conditions = rule.conditions as unknown as RuleConditions;
      let isMatch = true;

      if (conditions.minOrderAmount && DecimalMath.lt(orderTotal, conditions.minOrderAmount)) isMatch = false;
      if (conditions.maxOrderAmount && DecimalMath.lt(new Prisma.Decimal(conditions.maxOrderAmount), orderTotal)) isMatch = false;

      if (conditions.categoryIds && conditions.categoryIds.length > 0) {
        if (!item.product || !item.product.categories || item.product.categories.length === 0) {
          isMatch = false;
        } else {
          const productCategoryIds = item.product.categories.map((c) => c.id);
          const hasMatchingCategory = productCategoryIds.some((id) => conditions.categoryIds!.includes(id));
          if (!hasMatchingCategory) isMatch = false;
        }
      }

      if (conditions.customerType) {
        if (conditions.customerType === "NEW" && !isNewCustomer) isMatch = false;
        if (conditions.customerType === "RETURNING" && isNewCustomer) isMatch = false;
      }

      if (isMatch) {
        const ruleAction = rule.action as unknown as RuleAction;
        const isBonus = ruleAction.type === "BONUS_FIXED" || ruleAction.type === "BONUS_PERCENTAGE";
        if (isBonus && !matchedBonusRule) {
          matchedBonusRule = rule;
        } else if (!isBonus && !matchedRule) {
          matchedRule = rule;
        }
      }

      if (matchedRule && matchedBonusRule) break;
    }

    // Priority (COUPON attribution): Coupon Rate > Product Exclusions only
    // Priority (normal):            User Product Rate > Tier Product Rate > Global Rule > Product Default > Tier Default > Partner > Global
    const tierProductRate = tierRateMap.get(item.productId);

    if (couponOverrideRate) {
      // Coupon-এ explicit rate দেওয়া আছে — সব global rule / tier / product rate bypass
      rate   = couponOverrideRate;
      type   = "PERCENTAGE";
      source = `COUPON_RATE:${order.discount?.code ?? ""}`;
    } else if (userProductRate) {
      rate = userProductRate.rate;
      type = userProductRate.type;
      source = "PRODUCT_USER_OVERRIDE";
    } else if (tierProductRate && !tierProductRate.isDisabled) {
      rate = tierProductRate.rate;
      type = tierProductRate.type;
      source = "PRODUCT_TIER_OVERRIDE";
    } else if (matchedRule) {
      const action = matchedRule.action as unknown as RuleAction;
      rate = DecimalMath.toDecimal(action.value);
      type = action.type;
      source = `RULE: ${matchedRule.name}`;
      matchedRuleId = matchedRule.id;
    } else if (item.product?.affiliateCommissionRate) {
      rate = item.product.affiliateCommissionRate;
      type = item.product.affiliateCommissionType || "PERCENTAGE";
      source = "PRODUCT_DEFAULT";
    } else if (affiliate.tier?.commissionRate) {
      rate = affiliate.tier.commissionRate;
      type = affiliate.tier.commissionType;
      source = "TIER_DEFAULT";
    } else if (affiliate.commissionRate && !DecimalMath.isZero(affiliate.commissionRate)) {
      rate = affiliate.commissionRate;
      type = affiliate.commissionType || "PERCENTAGE";
      source = "PARTNER_INDIVIDUAL";
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

    if (matchedBonusRule) {
      const bonusAction = matchedBonusRule.action as unknown as RuleAction;
      let bonusComm = new Prisma.Decimal(0);
      if (bonusAction.type === "BONUS_FIXED") {
        bonusComm = DecimalMath.mul(DecimalMath.toDecimal(bonusAction.value), item.quantity);
      } else {
        bonusComm = DecimalMath.percent(itemBasePrice, bonusAction.value);
      }
      itemComm = DecimalMath.add(itemComm, bonusComm);
      if (!matchedRuleId) matchedRuleId = matchedBonusRule.id;
      source = `${source} + BONUS:${matchedBonusRule.name}`;
    }

    totalCommission = DecimalMath.add(totalCommission, itemComm);
    
    itemsBreakdown.push({
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      price: DecimalMath.toNumber(item.price),
      total: DecimalMath.toNumber(item.total),
      rate: rate.toString(),
      type,
      source,
      commission: DecimalMath.toNumber(itemComm),
      profit: DecimalMath.toNumber(itemProfit),
      isRefunded: false
    });
  }

  if (DecimalMath.isZero(totalCommission) && !config.zeroValueReferrals) {
    return { success: true, message: "ZERO_COMMISSION_IGNORED" };
  }

  await db.$transaction(async (tx) => {
    const availableDate = new Date();
    availableDate.setDate(availableDate.getDate() + (config.holdingPeriod || 14));

    // Determine overall commission type/rate from the first non-excluded item for record-keeping
    const firstItem = itemsBreakdown.find((i) => i.commission > 0);
    const overallType  = (firstItem?.type  ?? config.commissionType  ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED";
    const overallRate  = new Prisma.Decimal(firstItem?.rate ?? config.commissionRate ?? 0);

    await tx.referral.create({
      data: {
        affiliateId: affiliate.id,
        orderId: order.id,
        totalOrderAmount: orderTotal,
        netOrderAmount: orderSubtotal,
        commissionAmount: totalCommission,
        status: "PENDING",
        availableAt: availableDate,
        commissionType: overallType,
        commissionRate: overallRate,
        commissionRuleId: matchedRuleId,
        isRecurring: false,
        metadata: {
          itemsBreakdown,
          attribution: attributionSource,
          totalProfit: totalProfit.toString(),
          isGiftCard: isGiftCardPayment
        } as unknown as Prisma.InputJsonValue
      }
    });

    if (order.userId && config.isLifetimeLinkOnPurchase && !affiliate.user.referredByAffiliateId) {
      await tx.user.update({
        where: { id: order.userId },
        data: { referredByAffiliateId: affiliate.id }
      });
    }

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

  const breakdown = (referral.metadata as unknown as ReferralMetadata)?.itemsBreakdown || [];
  let refundDeduction = new Prisma.Decimal(0);
  let updatedBreakdown = [...breakdown];

  refundedItemIds.forEach(itemId => {
    const itemIndex = updatedBreakdown.findIndex((i) => i.orderItemId === itemId);
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
          data: { status: "REJECTED", metadata: { ...(referral.metadata as unknown as ReferralMetadata), itemsBreakdown: updatedBreakdown } as unknown as Prisma.InputJsonValue }
        });
      } else {
        await tx.referral.update({
          where: { id: referral.id },
          data: { commissionAmount: newCommission, metadata: { ...(referral.metadata as unknown as ReferralMetadata), itemsBreakdown: updatedBreakdown } as unknown as Prisma.InputJsonValue }
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
        
        // ✅ FIXED: Replaced deleted AffiliateLedger with Wallet & WalletTransaction
        const userWallet = await tx.wallet.upsert({
          where: { userId: affiliate.userId },
          create: { userId: affiliate.userId, balance: 0 },
          update: {}
        });

        await tx.walletTransaction.create({
          data: {
            walletId: userWallet.id,
            type: "PAYOUT_DEDUCTION",
            amount: refundDeduction,
            description: `Clawback for Refunded Items: Order #${orderId}`,
            reference: orderId
          }
        });
      }
      await tx.referral.update({
        where: { id: referral.id },
        data: { metadata: { ...(referral.metadata as unknown as ReferralMetadata), itemsBreakdown: updatedBreakdown } as unknown as Prisma.InputJsonValue }
      });
    }
  });

  return { success: true, deduction: refundDeduction };
}