// File: app/actions/admin/settings/affiliate/_services/rule-engine-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: Dynamic Commission Rules Engine
 * Handles the logic for "If X happens, give Y commission".
 */
export const ruleEngineService = {

  /**
   * Get all rules sorted by priority (Highest first)
   * High priority rules override lower ones.
   */
  async getRules() {
    try {
      return await db.affiliateCommissionRule.findMany({
        orderBy: [
          { isActive: "desc" }, // Active rules first
          { priority: "desc" }, // Then high priority
        ],
      });
    } catch (error) {
      console.error("[RuleService] Fetch Error:", error);
      throw new Error("Failed to fetch commission rules.");
    }
  },

  /**
   * Create a Logic Rule
   */
  async createRule(data: Prisma.AffiliateCommissionRuleCreateInput) {
    try {
      // Default priority: Put it at the top if not specified
      if (!data.priority) {
        const maxPrio = await db.affiliateCommissionRule.findFirst({
          orderBy: { priority: "desc" },
          select: { priority: true },
        });
        data.priority = (maxPrio?.priority || 0) + 1;
      }

      return await db.affiliateCommissionRule.create({ data });
    } catch (error) {
      console.error("[RuleService] Create Error:", error);
      throw new Error("Failed to create rule.");
    }
  },

  /**
   * Update Logic Rule
   */
  async updateRule(id: string, data: Prisma.AffiliateCommissionRuleUpdateInput) {
    return await db.affiliateCommissionRule.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete Rule
   */
  async deleteRule(id: string) {
    return await db.affiliateCommissionRule.delete({
      where: { id },
    });
  },

  /**
   * Reorder Priorities
   * Used when drag-and-dropping rules in the UI
   */
  async reorderRules(items: { id: string; priority: number }[]) {
    try {
      const transaction = items.map((item) =>
        db.affiliateCommissionRule.update({
          where: { id: item.id },
          data: { priority: item.priority },
        })
      );
      return await db.$transaction(transaction);
    } catch (error) {
      console.error("[RuleService] Reorder Error:", error);
      throw new Error("Failed to reorder rules.");
    }
  },
};