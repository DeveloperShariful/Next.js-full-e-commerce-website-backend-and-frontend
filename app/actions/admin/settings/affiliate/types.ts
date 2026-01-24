// File: app/actions/admin/settings/affiliate/types.ts

import { z } from "zod";
import { affiliateGeneralSchema } from "./schemas";

/**
 * Standard API Response Structure for Server Actions
 */
export type ActionResponse<T = null> = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>; // Validation errors mapped by field
  data?: T; // Optional returned data
};

/**
 * Type Inference from Zod Schemas
 * Used by React Hook Form in the UI
 */
export type AffiliateGeneralSettings = z.infer<typeof affiliateGeneralSchema>;

/**
 * DTO (Data Transfer Object) for internal service usage
 * Maps exactly to the Prisma JSON structure in `StoreSettings.affiliateConfig`
 */
export interface AffiliateConfigDTO {
  // Identity
  programName?: string;
  termsUrl?: string;
  
  // Commission Logic
  excludeShipping?: boolean;
  excludeTax?: boolean;
  autoApplyCoupon?: boolean;
  zeroValueReferrals?: boolean;

  // Links
  referralParam?: string;
  customSlugsEnabled?: boolean;
  autoCreateSlug?: boolean;
  slugLimit?: number;

  // Tracking
  cookieDuration?: number;
  allowSelfReferral?: boolean;
  isLifetimeLinkOnPurchase?: boolean;
  lifetimeDuration?: number | null;

  // Finance
  holdingPeriod?: number;
  minimumPayout?: number;
  payoutMethods?: string[];
  autoApprovePayout?: boolean;
}