// File: app/actions/admin/settings/affiliate/types.ts

import { z } from "zod";
import { affiliateGeneralSchema } from "./schemas";
import { AffiliateStatus, PayoutStatus, PayoutMethod, MediaType, Role, DiscountType } from "@prisma/client";

// ... (KEEP ALL PREVIOUS TYPES AS IS - DO NOT REMOVE) ...

/**
 * ==================================================================
 * 3. ENTERPRISE EVENT BUS TYPES (NEW)
 * ==================================================================
 */
export type EventType = 
  | "ORDER_CREATED" 
  | "COMMISSION_EARNED" 
  | "TIER_UPGRADE_CHECK" 
  | "FRAUD_ALERT" 
  | "PAYOUT_REQUESTED"
  | "MLM_BONUS_TRIGGER";

export interface AffiliateEventPayload {
  orderId?: string;
  affiliateId?: string;
  userId?: string;
  amount?: number;
  meta?: Record<string, any>;
  timestamp: number;
}

/**
 * ==================================================================
 * 4. ADVANCED MLM & COMMISSION TYPES (NEW)
 * ==================================================================
 */
export interface MLMConfigDTO {
  isEnabled: boolean;
  maxLevels: number;
  commissionBasis: "SALES_AMOUNT" | "PROFIT_MARGIN" | "CV"; // Enhanced basis
  levelRates: Record<string, number>;
}

export interface CommissionCalculationResult {
  amount: number;
  source: string; // 'GLOBAL', 'TIER', 'PRODUCT_OVERRIDE', 'MLM'
  calculationLog: string[];
  profitMarginCheck?: {
    cost: number;
    profit: number;
    isLoss: boolean;
  };
}

/**
 * ==================================================================
 * 5. SECURITY & COMPLIANCE TYPES (NEW)
 * ==================================================================
 */
export interface TaxComplianceStatus {
  isFormSubmitted: boolean;
  taxFormUrl?: string;
  taxId?: string;
  verifiedAt?: Date;
}

export type IdempotencyScope = "ORDER_PROCESS" | "PAYOUT_RELEASE";

// Extend existing config DTO
export interface AffiliateConfigDTOExtended extends AffiliateConfigDTO {
  requireTaxFormForPayout?: boolean;
  taxFormThreshold?: number; // e.g. $600
  enableProfitMarginProtection?: boolean;
  minProfitMargin?: number; // e.g. 5%
  postbackUrlSecret?: string; // For S2S Postbacks
}
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
  | "MANAGE_FRAUD"; 

  
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
  groupRate?: number | null;
  tierRate?: number | null;
  tierType?: "PERCENTAGE" | "FIXED";
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

