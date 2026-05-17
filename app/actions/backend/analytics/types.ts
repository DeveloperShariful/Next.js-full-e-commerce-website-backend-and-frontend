// app/actions/admin/analytics/types.ts

export type Period = "7d" | "30d" | "90d" | "year" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// --- 1. FINANCIAL TYPES ---
export interface KPIMetric {
  value: number;
  previousValue: number;
  percentageChange: number;
  trend: "up" | "down" | "neutral";
}

export interface FinancialSummary {
  totalRevenue: KPIMetric;      
  netSales: KPIMetric;          
  grossProfit: KPIMetric;       
  totalOrders: KPIMetric;       
  averageOrderValue: KPIMetric; 
  refundedAmount: KPIMetric;    
}

export interface SalesChartData {
  date: string;       
  fullDate: string;   
  revenue: number;
  profit: number;
  orders: number;
}

// --- 2. PRODUCT & INVENTORY TYPES ---
export interface TopProductMetric {
  id: string;
  name: string;
  sku: string | null;
  revenue: number;
  quantitySold: number;
  trend: number; 
}

export interface InventoryHealthMetric {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
  image: string | null;
}

export interface CategoryPerformanceMetric {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  percentage: number; 
}

// --- 3. CUSTOMER TYPES ---
export interface CustomerDemographic {
  city: string;
  country: string;
  count: number;
  revenue: number;
}

export interface CustomerTypeBreakdown {
  newCustomers: number;
  returningCustomers: number;
  newRevenue: number;
  returningRevenue: number;
}

export interface TopCustomerMetric {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
}

// --- 4. MARKETING & OPS TYPES ---
export interface CartMetrics {
  totalLostRevenue: number;
  totalRecoveredRevenue: number;
  abandonedCount: number;
  recoveredCount: number;
  recoveryRate: number;
}

export interface CouponMetric {
  code: string;
  usageCount: number;
  totalDiscounted: number;
}

// --- 5. NEW: TRAFFIC & CONVERSION TYPES (Traffic Analytics) ---
export interface ConversionFunnelStep {
  step: string; // "Visitors" -> "Product Views" -> "Add to Cart" -> "Orders"
  count: number;
  dropOffRate: number; // Percentage of users lost from previous step
}

export interface TrafficSourceMetric {
  source: string; // e.g., "Direct", "Google", "Social" (Derived from UserAgent/Referrer logs)
  visits: number;
}

export interface MostViewedProduct {
  id: string;
  name: string;
  views: number;
  sales: number; // To calculate conversion rate per product
  conversionRate: number;
}

// --- 6. NEW: REPUTATION & BRAND TYPES (Brand Analytics) ---
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { star: number; count: number }[]; // 5 star: 100, 4 star: 20...
  recentNegativeReviews: { 
    id: string; 
    author: string; 
    rating: number; 
    comment: string; 
    productName: string 
  }[];
}

export interface BrandPerformanceMetric {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  profitEstimate: number;
}

// --- 7. NEW: FORECASTING TYPES ---
export interface SalesForecast {
  date: string;
  predictedRevenue: number;
  lowerBound: number; // Confidence interval low
  upperBound: number; // Confidence interval high
}

// --- MASTER RESPONSE TYPE (Updated) ---
export interface AnalyticsResponse {
  summary: FinancialSummary;
  salesChart: SalesChartData[];
  
  // Product & Inventory
  topProducts: TopProductMetric[];
  inventoryHealth: InventoryHealthMetric[];
  categoryPerformance: CategoryPerformanceMetric[];
  
  // Customer
  customerDemographics: CustomerDemographic[];
  customerTypeBreakdown: CustomerTypeBreakdown;
  topCustomers: TopCustomerMetric[];
  
  // Marketing & Ops
  orderStatusDistribution: { status: string; count: number }[];
  paymentMethodDistribution: { method: string; count: number; amount: number }[];
  cartMetrics: CartMetrics;
  topCoupons: CouponMetric[];

  // NEW: Traffic & Conversion
  conversionFunnel: ConversionFunnelStep[];
  mostViewedProducts: MostViewedProduct[];
  
  // NEW: Brand & Reputation
  reviewSummary: ReviewSummary;
  brandPerformance: BrandPerformanceMetric[];

  // NEW: Forecasting
  salesForecast: SalesForecast[];
}