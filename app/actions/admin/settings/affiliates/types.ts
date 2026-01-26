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

// User List Table Item (UPDATED FOR SOLID AFFILIATE UI)
export interface AffiliateUserTableItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  slug: string;
  status: AffiliateStatus;
  tierName: string;
  
  // --- NEW FIELDS ADDED HERE ---
  groupName: string;          // For Group Column
  tags: string[];             // For Tags Column
  coupons: string[];          // For Coupons Column
  storeCredit: number;        // For Store Credit Column
  
  balance: number;
  totalEarnings: number;
  
  // Stats
  referralCount: number;
  visitCount: number;
  salesTotal: number;         // For "Sales: $X"
  commissionTotal: number;    // For "Comm: ($Y)"
  netRevenue: number;         // For "Net: $Z"
  
  registrationNotes: string | null;
  createdAt: Date;
  kycStatus: string;
  riskScore: number;
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
  directReferrals: number; 
  teamSize: number; 
  children?: NetworkNode[];
}

// Fraud Detection Alert
export interface FraudAlertItem {
  id: string;
  affiliateName: string;
  type: string; 
  riskScore: number;
  details: string;
  detectedAt: Date;
  status: "PENDING" | "RESOLVED" | "BLOCKED";
}

// Pixel Tracking
export interface TrackingPixelItem {
  id: string;
  affiliateName: string;
  type: string;
  pixelId: string;
  status: boolean;
  createdAt: Date;
}