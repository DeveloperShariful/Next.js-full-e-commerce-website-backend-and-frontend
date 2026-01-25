// File: app/actions/admin/settings/affiliate/types.ts

import { z } from "zod";
import { affiliateGeneralSchema } from "./schemas";
import { AffiliateStatus, PayoutStatus, PayoutMethod, MediaType } from "@prisma/client";

/**
 * ==================================================================
 * 1. SHARED TYPES (COMMON)
 * ==================================================================
 */

export type ActionResponse<T = null> = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: T;
};

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * ==================================================================
 * 2. SETTINGS TYPES (CONFIGURATION)
 * ==================================================================
 */

export type AffiliateGeneralSettings = z.infer<typeof affiliateGeneralSchema>;

export interface AffiliateConfigDTO {
  programName?: string;
  termsUrl?: string;
  excludeShipping?: boolean;
  excludeTax?: boolean;
  autoApplyCoupon?: boolean;
  zeroValueReferrals?: boolean;
  referralParam?: string;
  customSlugsEnabled?: boolean;
  autoCreateSlug?: boolean;
  slugLimit?: number;
  cookieDuration?: number;
  allowSelfReferral?: boolean;
  isLifetimeLinkOnPurchase?: boolean;
  lifetimeDuration?: number | null;
  holdingPeriod?: number;
  minimumPayout?: number;
  payoutMethods?: string[];
  autoApprovePayout?: boolean;
}

/**
 * ==================================================================
 * 3. MANAGEMENT TYPES (DASHBOARD, USERS, PAYOUTS)
 * ==================================================================
 */

// Dashboard KPIs
export interface DashboardKPI {
  revenue: number;
  commission: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  activeAffiliates: number;
  pendingApprovals: number;
  payoutsPending: number;
}

// Chart Data
export interface ChartDataPoint {
  date: string;
  revenue: number;
  commission: number;
  clicks: number;
}

// User List Table Item
export interface AffiliateUserTableItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  slug: string;
  status: AffiliateStatus;
  tierName: string | null;
  balance: number;
  totalEarnings: number;
  referralCount: number;
  visitCount: number;
  createdAt: Date;
  kycStatus: string;
  riskScore: number; // New for Ultra Level
}

// Payout List Item
export interface PayoutQueueItem {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  requestedAt: Date;
  bankDetails?: any;
  paypalEmail?: string | null;
}

/**
 * ==================================================================
 * 4. ULTRA FEATURES TYPES (MLM, FRAUD, CONTESTS)
 * ==================================================================
 */

// MLM Network Tree Node
export interface NetworkNode {
  id: string;
  name: string;
  avatar: string | null;
  tier: string;
  totalEarnings: number;
  directReferrals: number; // Count of direct children
  teamSize: number; // Total downline count (recursive)
  children?: NetworkNode[]; // Recursive children
}

// Fraud Detection Alert
export interface FraudAlertItem {
  id: string;
  affiliateName: string;
  type: string; // e.g., "SELF_REFERRAL", "IP_DUPLICATE"
  riskScore: number;
  details: string;
  detectedAt: Date;
  status: "PENDING" | "RESOLVED" | "BLOCKED";
}

// Pixel Tracking
export interface TrackingPixelItem {
  id: string;
  affiliateName: string;
  type: string; // "FACEBOOK", "GOOGLE", "TIKTOK"
  pixelId: string;
  status: boolean; // Enabled/Disabled
  createdAt: Date;
}