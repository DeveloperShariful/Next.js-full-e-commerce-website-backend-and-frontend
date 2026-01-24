// File: app/actions/admin/settings/affiliate/schemas.ts

import { z } from "zod";

/**
 * ------------------------------------------------------------------
 * ENTERPRISE AFFILIATE CONFIGURATION SCHEMA
 * Matches "Solid Affiliate" Logic & UI Groups
 * ------------------------------------------------------------------
 */
export const affiliateGeneralSchema = z.object({
  // --- 1. General / Identity ---
  isActive: z.boolean().default(false),
  programName: z
    .string()
    .min(3, { message: "Program name must be at least 3 characters." })
    .default("GoBike Partner Program"),
  
  termsUrl: z.string().url().optional().or(z.literal("")),

  // --- 2. Commission Calculation Logic ---
  excludeShipping: z.boolean().default(true), // Solid Affiliate default: On
  excludeTax: z.boolean().default(true),      // Solid Affiliate default: On
  autoApplyCoupon: z.boolean().default(false),
  zeroValueReferrals: z.boolean().default(false),

  // --- 3. Affiliate Links & Slugs ---
  referralParam: z
    .string()
    .min(1, { message: "Parameter required." })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Alphanumeric only (e.g. 'ref')." })
    .default("ref"),
  
  customSlugsEnabled: z.boolean().default(false), // Allow users to create "ref/myname"
  autoCreateSlug: z.boolean().default(false),     // Generate slug on signup
  slugLimit: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(5),

  // --- 4. Tracking & Lifetime ---
  cookieDuration: z.coerce
    .number()
    .min(1, { message: "Minimum 1 day." })
    .max(365, { message: "Maximum 365 days." })
    .default(30),
    
  allowSelfReferral: z.boolean().default(false),

  isLifetimeLinkOnPurchase: z.boolean().default(false), // Link customer permanently after purchase
  lifetimeDuration: z.coerce
    .number()
    .nullable()
    .optional(), // Null means "Forever"

  // --- 5. Payouts & Finance ---
  holdingPeriod: z.coerce
    .number()
    .min(0, { message: "Cannot be negative." })
    .max(180, { message: "Max holding period is 180 days." })
    .default(14),
    
  autoApprovePayout: z.boolean().default(false),

  minimumPayout: z.coerce
    .number()
    .min(1, { message: "Minimum payout must be at least $1." })
    .default(50),
    
  payoutMethods: z
    .array(z.string())
    .refine((value) => value.length > 0, {
      message: "You must select at least one payout method.",
    }),
});