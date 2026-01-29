// File: app/actions/admin/settings/affiliate/types.ts

import { z } from "zod";
import { affiliateGeneralSchema } from "./schemas";
import { AffiliateStatus, PayoutStatus, PayoutMethod, MediaType, Role } from "@prisma/client";

/**
 * ==================================================================
 * 1. SECURITY TYPES (UPDATED)
 * ==================================================================
 */
export type AffiliatePermission = 
  | "VIEW_ANALYTICS"
  | "MANAGE_PARTNERS"
  | "MANAGE_FINANCE"
  | "MANAGE_CONFIGURATION"
  | "MANAGE_NETWORK"
  | "MANAGE_FRAUD"; // ✅ ADDED THIS MISSING TYPE

/**
 * ==================================================================
 * 2. SHARED TYPES
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
  commissionRate?: number; 
  commissionType?: "PERCENTAGE" | "FIXED"; 
}

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

export interface ChartDataPoint {
  date: string;
  revenue: number;
  commission: number;
  clicks: number;
}

export interface AffiliateUserTableItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  slug: string;
  status: AffiliateStatus;
  tierName: string;
  groupName: string;
  tags: string[];
  coupons: string[];
  storeCredit: number;
  balance: number;
  totalEarnings: number;
  referralCount: number;
  visitCount: number;
  salesTotal: number;
  commissionTotal: number;
  netRevenue: number;
  registrationNotes: string | null;
  createdAt: Date;
  kycStatus: string;
  riskScore: number;
  paymentReady?: boolean;
  commissionRate: number | null;
  commissionType?: "PERCENTAGE" | "FIXED";
}

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
  riskScore?: number; 
}

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

export interface FraudAlertItem {
  id: string;
  affiliateName: string;
  type: string; 
  riskScore: number;
  details: string;
  detectedAt: Date;
  status: "PENDING" | "RESOLVED" | "BLOCKED";
}

export interface TrackingPixelItem {
  id: string;
  affiliateName: string;
  type: string;
  pixelId: string;
  status: boolean;
  createdAt: Date;
}

