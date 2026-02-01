"use server";

import { db } from "@/lib/prisma";
import { CommissionType } from "@prisma/client";

interface OrderContext {
  orderTotal: number;      
  itemCount: number;
  isNewCustomer: boolean;
  productIds: string[];    
  categoryIds: string[];   
}

// ==========================================
// CORE CALCULATION LOGIC
// ==========================================

export async function calculateCommission(affiliateId: string, context: OrderContext) {
  
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    include: { tier: true }
  });

  if (!affiliate || affiliate.status !== "ACTIVE") {
    return { amount: 0, rate: 0, type: CommissionType.PERCENTAGE, source: "NONE" };
  }

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
    if (evaluateRule(rule.conditions, context)) {
      const action = rule.action as any;
      return {
        amount: calcAmount(action.type, Number(action.value), context.orderTotal),
        rate: Number(action.value),
        type: action.type as CommissionType,
        source: `RULE: ${rule.name}`,
        ruleId: rule.id
      };
    }
  }

  if (affiliate.tier) {
    return {
      amount: calcAmount(affiliate.tier.commissionType, Number(affiliate.tier.commissionRate), context.orderTotal),
      rate: Number(affiliate.tier.commissionRate),
      type: affiliate.tier.commissionType,
      source: `TIER: ${affiliate.tier.name}`
    };
  }

  return {
    amount: calcAmount(affiliate.commissionType, Number(affiliate.commissionRate || 0), context.orderTotal),
    rate: Number(affiliate.commissionRate || 0),
    type: affiliate.commissionType,
    source: "PERSONAL_RATE"
  };
}

// ==========================================
// INTERNAL HELPERS
// ==========================================

function evaluateRule(conditions: any, context: OrderContext): boolean {
  if (!conditions) return false;
  
  if (conditions.minOrderAmount && context.orderTotal < conditions.minOrderAmount) {
    return false;
  }
  
  if (conditions.customerType) {
    if (conditions.customerType === "NEW" && !context.isNewCustomer) return false;
    if (conditions.customerType === "RETURNING" && context.isNewCustomer) return false;
  }
  
  if (conditions.categoryIds && Array.isArray(conditions.categoryIds)) {
    const hasMatch = context.categoryIds.some(id => conditions.categoryIds.includes(id));
    if (!hasMatch) return false;
  }
  
  if (conditions.productIds && Array.isArray(conditions.productIds)) {
    const hasMatch = context.productIds.some(id => conditions.productIds.includes(id));
    if (!hasMatch) return false;
  }

  return true; 
}

function calcAmount(type: CommissionType | string, rate: number, total: number): number {
  if (type === "FIXED") {
    return rate;
  }
  return (total * rate) / 100;
}