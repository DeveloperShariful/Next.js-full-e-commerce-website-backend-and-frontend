//app/actions/storefront/affiliates/types.ts

import { AffiliateStatus, CommissionType } from "@prisma/client";

export interface AffiliateProfileDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  slug: string;
  status: AffiliateStatus;
  tier: {
    name: string;
    icon?: string | null;
    commissionRate: number;
    commissionType: CommissionType;
  } | null;
  balance: number;
}

export interface DashboardStats {
  clicks: number;
  referrals: number;
  conversionRate: number;
  unpaidEarnings: number;
  totalEarnings: number;
  nextPayoutDate?: Date | null;
}

export interface RecentActivityItem {
  id: string;
  type: "CLICK" | "REFERRAL" | "PAYOUT";
  description: string;
  amount?: number;
  date: Date;
  status?: string;
}

export interface ChartData {
  date: string;
  earnings: number;
  clicks: number;
}