// File: app/actions/backend/affiliate/schemas.ts

import { z } from "zod";

export const affiliateGeneralSchema = z.object({

  // ===== TAB 1: PROGRAM =====
  isActive:              z.boolean().default(false),
  programName:           z.string().min(3, { message: "Program name must be at least 3 characters." }).default("GoBike Partner Program"),
  termsUrl:              z.union([z.url({ error: "Must be a valid URL." }), z.literal("")]).optional(),
  registrationEnabled:   z.boolean().default(true),
  autoApprove:           z.boolean().default(false),
  maxAffiliatesLimit:    z.coerce.number().int().positive().nullable().optional(),
  requireTermsAccept:    z.boolean().default(true),
  welcomeEmailEnabled:   z.boolean().default(true),

  // ===== TAB 2: COMMISSION =====
  commissionRate:        z.coerce.number().min(0).max(100).default(10),
  commissionType:        z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  excludeShipping:       z.boolean().default(true),
  excludeTax:            z.boolean().default(true),
  autoApplyCoupon:       z.boolean().default(false),
  zeroValueReferrals:    z.boolean().default(false),
  maxCommissionCap:      z.coerce.number().nonnegative().nullable().optional(),
  enableProfitMarginProtection: z.boolean().default(false),
  minProfitMargin:       z.coerce.number().min(0).max(100).default(20),
  firstReferralBonus:    z.boolean().default(false),
  firstReferralBonusAmount: z.coerce.number().nonnegative().default(5),
  firstReferralBonusType:   z.enum(["PERCENTAGE", "FIXED"]).default("FIXED"),

  // ===== TAB 3: TRACKING =====
  referralParam:         z.string().min(1, { message: "Parameter required." }).regex(/^[a-zA-Z0-9_-]+$/, { message: "Alphanumeric only (e.g. 'ref')." }).default("ref"),
  customSlugsEnabled:    z.boolean().default(false),
  autoCreateSlug:        z.boolean().default(false),
  slugLimit:             z.coerce.number().min(1).max(100).default(5),
  cookieDuration:        z.coerce.number().min(1, { message: "Minimum 1 day." }).max(365, { message: "Maximum 365 days." }).default(30),
  allowSelfReferral:     z.boolean().default(false),
  isLifetimeLinkOnPurchase: z.boolean().default(false),
  lifetimeDuration:      z.coerce.number().nullable().optional(),
  attributionModel:      z.enum(["LAST_CLICK", "FIRST_CLICK"]).default("LAST_CLICK"),
  trackCancelledOrders:  z.boolean().default(true),
  trackRefundedOrders:   z.boolean().default(true),

  // ===== TAB 4: PAYOUTS =====
  holdingPeriod:         z.coerce.number().min(0, { message: "Cannot be negative." }).max(180, { message: "Max 180 days." }).default(14),
  autoApprovePayout:     z.boolean().default(false),
  minimumPayout:         z.coerce.number().min(1, { message: "Minimum payout must be at least $1." }).default(50),
  payoutMethods:         z.array(z.string()).refine((v) => v.length > 0, { message: "Select at least one payout method." }),
  requireKycForPayout:   z.boolean().default(false),

  // ===== TAB 5: COMPLIANCE =====
  kycRequiredDocuments:  z.array(z.string()).default(["NATIONAL_ID"]),
  taxFormRequired:       z.boolean().default(false),
  taxFormThreshold:      z.coerce.number().positive().default(600),

  // ===== TAB 6: AUTOMATION =====
  tierAutoUpgrade:          z.boolean().default(false),
  tierEvaluationFrequency:  z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("MONTHLY"),
  commissionEmailEnabled:   z.boolean().default(true),
  payoutEmailEnabled:       z.boolean().default(true),

  // ===== TAB 7: INTEGRATIONS =====
  postbackGlobalUrl: z.union([z.url({ error: "Must be a valid URL." }), z.literal("")]).optional(),
  postbackSecret:    z.string().max(256).optional().or(z.literal("")),
});

export const couponAssignmentSchema = z.object({
  affiliateId: z.uuid(),
  code:  z.string().min(3, "Code must be at least 3 chars").regex(/^[A-Z0-9_-]+$/, "Uppercase alphanumeric only"),
  value: z.coerce.number().min(0),
  type:  z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
});
