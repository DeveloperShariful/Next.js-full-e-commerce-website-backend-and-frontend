// File: app/actions/backend/affiliate/types.ts

import { z } from "zod";
import { affiliateGeneralSchema } from "./schemas";
import { AffiliateStatus, PayoutStatus, PayoutMethod, MediaType, Role, DiscountType } from "@prisma/client";

/**
 * ==================================================================
 * 🌟 STRICT JSON TYPES FOR OPTIMIZED SCHEMA (NEW)
 * ==================================================================
 */
export interface AffiliateKycDocument {
  type: "PASSPORT" | "DRIVING_LICENSE" | "NATIONAL_ID" | "TAX_FORM";
  url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentNumber?: string;
  rejectionReason?: string;
  verifiedAt?: Date | string;
}

export interface AffiliateFraudRuleData {
  type: "IP_CLICK_LIMIT" | "CONVERSION_RATE_LIMIT" | "ORDER_VALUE_LIMIT" | "BLACKLIST_COUNTRY";
  value: string;
  action: "BLOCK" | "FLAG" | "SUSPEND";
  reason?: string;
}

export interface AffiliateCreativeData {
  title: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  url: string;
}

export interface AffiliateAnnouncementData {
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "SUCCESS";
  date: Date | string;
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
  // Program
  programName?: string;
  termsUrl?: string;
  registrationEnabled?: boolean;
  autoApprove?: boolean;
  maxAffiliatesLimit?: number | null;
  requireTermsAccept?: boolean;
  welcomeEmailEnabled?: boolean;

  // Commission
  commissionRate?: number;
  commissionType?: "PERCENTAGE" | "FIXED";
  excludeShipping?: boolean;
  excludeTax?: boolean;
  autoApplyCoupon?: boolean;
  zeroValueReferrals?: boolean;
  maxCommissionCap?: number | null;
  enableProfitMarginProtection?: boolean;
  minProfitMargin?: number;
  firstReferralBonus?: boolean;
  firstReferralBonusAmount?: number;
  firstReferralBonusType?: "PERCENTAGE" | "FIXED";

  // Tracking
  referralParam?: string;
  customSlugsEnabled?: boolean;
  autoCreateSlug?: boolean;
  slugLimit?: number;
  cookieDuration?: number;
  allowSelfReferral?: boolean;
  isLifetimeLinkOnPurchase?: boolean;
  lifetimeDuration?: number | null;
  attributionModel?: "LAST_CLICK" | "FIRST_CLICK";
  trackCancelledOrders?: boolean;
  trackRefundedOrders?: boolean;

  // Payouts
  holdingPeriod?: number;
  minimumPayout?: number;
  payoutMethods?: string[];
  autoApprovePayout?: boolean;
  requireKycForPayout?: boolean;

  // Compliance
  kycRequiredDocuments?: string[];
  taxFormRequired?: boolean;
  taxFormThreshold?: number;

  // Automation
  tierAutoUpgrade?: boolean;
  tierEvaluationFrequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  commissionEmailEnabled?: boolean;
  payoutEmailEnabled?: boolean;

  // Integrations
  postbackGlobalUrl?: string;
  postbackSecret?: string;
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
  tags: string[];         // Removed groupName/groupRate as Tags handles this now
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
  kycDocuments?: AffiliateKycDocument[];
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
  bankDetails?: Record<string, string>; // Strictly typed JSON
  paypalEmail?: string | null;
  riskScore?: number; 
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

/**
 * ==================================================================
 * 3. ENTERPRISE EVENT BUS TYPES
 * ==================================================================
 */
export type EventType = 
  | "ORDER_CREATED" 
  | "COMMISSION_EARNED" 
  | "TIER_UPGRADE_CHECK" 
  | "FRAUD_ALERT" 
  | "PAYOUT_REQUESTED"
  ;

export interface AffiliateEventPayload {
  orderId?: string;
  affiliateId?: string;
  userId?: string;
  amount?: number;
  meta?: Record<string, unknown>; // Replaced any with unknown for safety
  timestamp: number;
}

export interface CommissionCalculationResult {
  amount: number;
  source: string; // 'GLOBAL', 'TIER', 'PRODUCT_OVERRIDE'
  calculationLog: string[];
  profitMarginCheck?: {
    cost: number;
    profit: number;
    isLoss: boolean;
  };
}

/**
 * ==================================================================
 * 5. SECURITY & COMPLIANCE TYPES
 * ==================================================================
 */
export interface TaxComplianceStatus {
  isFormSubmitted: boolean;
  taxFormUrl?: string;
  taxId?: string;
  verifiedAt?: Date;
}

export type IdempotencyScope = "ORDER_PROCESS" | "PAYOUT_RELEASE";

