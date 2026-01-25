//app/actions/admin/settings/affiliate/_services/fraud-rule-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: DYNAMIC FRAUD RULES
 * Allows Admin to define custom security logic without coding.
 */
export const fraudRuleService = {

  /**
   * Get All Active Fraud Rules
   */
  async getRules() {
    try {
      return await db.affiliateFraudRule.findMany({
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error("[FraudRuleService] Fetch Error:", error);
      throw new Error("Failed to load fraud rules.");
    }
  },

  /**
   * Create a New Security Rule
   */
  async createRule(data: Prisma.AffiliateFraudRuleCreateInput) {
    // Basic validation logic could go here
    return await db.affiliateFraudRule.create({ data });
  },

  /**
   * Delete Rule
   */
  async deleteRule(id: string) {
    return await db.affiliateFraudRule.delete({
      where: { id }
    });
  }
};