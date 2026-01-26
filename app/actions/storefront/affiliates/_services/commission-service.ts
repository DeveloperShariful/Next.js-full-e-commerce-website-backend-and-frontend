// app/actions/storefront/affiliates/_services/commission-service.ts

import { db } from "@/lib/prisma";
import { CommissionType } from "@prisma/client";

interface OrderContext {
  orderTotal: number;      // Shipping/Tax বাদে নিট অ্যামাউন্ট
  itemCount: number;
  isNewCustomer: boolean;
  productIds: string[];    // অর্ডারের সব প্রোডাক্ট ID
  categoryIds: string[];   // অর্ডারের সব ক্যাটাগরি ID
}

export const commissionService = {

  /**
   * Calculate Commission for an Order
   * Priority: Rule > Tier > Default
   */
  async calculateCommission(affiliateId: string, context: OrderContext) {
    
    // ১. এফিলিয়েট এবং তার টায়ার লোড করা
    const affiliate = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      include: { tier: true }
    });

    if (!affiliate || affiliate.status !== "ACTIVE") {
      return { amount: 0, rate: 0, type: CommissionType.PERCENTAGE, source: "NONE" };
    }

    // ২. স্পেশাল রুলস (Commission Rules) চেক করা
    // Priority অনুযায়ী সাজানো (High Priority First)
    const activeRules = await db.affiliateCommissionRule.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } }
        ],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }
        ]
      },
      orderBy: { priority: "desc" }
    });

    for (const rule of activeRules) {
      if (this.evaluateRule(rule.conditions, context)) {
        // রুল ম্যাচ করেছে!
        const action = rule.action as any;
        return {
          amount: this.calcAmount(action.type, action.value, context.orderTotal),
          rate: Number(action.value),
          type: action.type as CommissionType,
          source: `RULE: ${rule.name}`,
          ruleId: rule.id
        };
      }
    }

    // ৩. টায়ার (Tier) ভিত্তিক কমিশন (যদি কোনো রুল ম্যাচ না করে)
    if (affiliate.tier) {
      return {
        amount: this.calcAmount(affiliate.tier.commissionType, Number(affiliate.tier.commissionRate), context.orderTotal),
        rate: Number(affiliate.tier.commissionRate),
        type: affiliate.tier.commissionType,
        source: `TIER: ${affiliate.tier.name}`
      };
    }

    // ৪. ডিফল্ট (User Level fallback)
    return {
      amount: this.calcAmount(affiliate.commissionType, Number(affiliate.commissionRate || 0), context.orderTotal),
      rate: Number(affiliate.commissionRate || 0),
      type: affiliate.commissionType,
      source: "PERSONAL_RATE"
    };
  },

  /**
   * Helper: JSON Logic Evaluation
   */
  evaluateRule(conditions: any, context: OrderContext): boolean {
    if (!conditions) return false;

    // A. Minimum Order Amount Check
    if (conditions.minOrderAmount && context.orderTotal < conditions.minOrderAmount) {
      return false;
    }

    // B. Customer Type Check (New vs Returning)
    if (conditions.customerType) {
      if (conditions.customerType === "NEW" && !context.isNewCustomer) return false;
      if (conditions.customerType === "RETURNING" && context.isNewCustomer) return false;
    }

    // C. Specific Category Check
    if (conditions.categoryIds && Array.isArray(conditions.categoryIds)) {
      const hasMatch = context.categoryIds.some(id => conditions.categoryIds.includes(id));
      if (!hasMatch) return false;
    }

    // D. Specific Product Check
    if (conditions.productIds && Array.isArray(conditions.productIds)) {
      const hasMatch = context.productIds.some(id => conditions.productIds.includes(id));
      if (!hasMatch) return false;
    }

    return true; // সব কন্ডিশন পাস করলে True
  },

  /**
   * Helper: Math Calculation
   */
  calcAmount(type: CommissionType | string, rate: number, total: number): number {
    if (type === "FIXED") {
      return rate;
    }
    // Percentage
    return (total * rate) / 100;
  }
};