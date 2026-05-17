// File Location: app/admin/coupons/types.ts

// Enum mapped from Prisma Schema
export type DiscountTypeEnum = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y' | 'FIXED_CART' | 'FIXED_PRODUCT';

// ==========================================
// DB MODEL TYPE (Kept exactly as you provided)
// ==========================================
export interface CouponType {
  id: string;
  code: string;
  description: string | null;
  type: DiscountTypeEnum;
  value: number; // Decimal in DB, parsed to number
  minSpend: number | null;
  maxSpend: number | null;
  minQty: number | null;
  startDate: string | Date;
  endDate: string | Date | null;
  usageLimit: number | null;
  usagePerUser: number | null;
  usedCount: number;
  excludeSaleItems: boolean;
  productIds: string[];
  categoryIds: string[];
  ruleLogic: Record<string, unknown> | null; // Json field
  isActive: boolean;
  affiliateCommissionRate: number | null;
  affiliateId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null; 
}

// ==========================================
// COUNTS TYPE (Kept exactly as you provided)
// ==========================================
export interface CouponCountsType {
  all: number;
  published: number;
  affiliate: number;
  mine: number;
  trash: number;
}

// ==========================================
// FORM TYPE FOR CREATE/EDIT PAGE (NEWLY ADDED)
// ==========================================
export interface CouponFormType {
  id?: string;
  code: string;
  description: string;
  
  // General Tab
  type: DiscountTypeEnum;
  value: number | "";
  allowFreeShipping: boolean;
  endDate: string; // YYYY-MM-DD format
  
  // Usage Restriction Tab
  minSpend: number | "";
  maxSpend: number | "";
  individualUse: boolean; // Saved inside ruleLogic JSON
  excludeSaleItems: boolean;
  productIds: string[];
  excludeProductIds: string[]; // Saved inside ruleLogic JSON
  categoryIds: string[];
  excludeCategoryIds: string[]; // Saved inside ruleLogic JSON
  allowedEmails: string; // Saved inside ruleLogic JSON
  
  // Usage Limits Tab
  usageLimit: number | ""; 
  usagePerUser: number | ""; 
  
  // Status
  isActive: boolean;
}