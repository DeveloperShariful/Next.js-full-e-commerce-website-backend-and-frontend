// File Location: app/admin/orders/[orderId]/types.ts

// --- ENUMS (Mapped from Prisma Schema) ---
export type OrderStatus = 'DRAFT' | 'PENDING' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'FAILED' | 'RETURNED' | 'READY_FOR_PICKUP' | 'PARTIALLY_PAID';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'VOIDED' | 'PARTIALLY_PAID' | 'AUTHORIZED';
export type FulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'RETURNED' | 'PICKED_UP';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
export type DisputeStatus = 'WARNING_NEEDS_RESPONSE' | 'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST';

// --- JSON Address Type ---
export interface AddressJson {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

// --- RELATIONAL MODELS ---
export interface OrderUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  sku: string | null;
  isPreOrder: boolean;
  image: string | null;
  price: number;
  quantity: number;
  total: number;
  product?: {
    id: string;
    stock: number;
    name: string;
    featuredImage: string | null;
  } | null;
}

export interface OrderTransaction {
  id: string;
  gateway: string;
  paymentMethod: string | null;
  type: string;
  amount: number;
  currency: string;
  transactionId: string;
  status: string;
  createdAt: string | Date;
}

export interface OrderNote {
  id: string;
  content: string;
  isSystem: boolean;
  notify: boolean;
  createdAt: string | Date;
}

export interface OrderAffiliate {
  id: string;
  commissionRate: number | null;
  commissionType: string;
  user?: {
    name: string | null;
  } | null;
}

export interface OrderDispute {
  id: string;
  gatewayDisputeId: string;
  status: DisputeStatus;
  amount: number;
  reason: string | null;
}

export interface OrderReturn {
  id: string;
  status: ReturnStatus;
  reason: string;
  createdAt: string | Date;
}

// --- MAIN ORDER DETAILS TYPE ---
export interface OrderDetailsType {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  
  userId: string | null;
  guestEmail: string | null;
  
  // Pricing
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  refundedAmount: number;
  paymentFee: number;
  netAmount: number;
  
  // Gateway & Tracking
  paymentGateway: string | null;
  paymentMethod: string | null;
  paymentId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  capturedAt: string | Date | null;
  
  shippingMethod: string | null;
  shippingTrackingNumber: string | null;
  selectedCourierCode: string | null;
  transdirectQuoteId: string | null;
  transdirectBookingId: string | null;
  transdirectOrderStatus: string | null;
  transdirectLabelUrl: string | null;
  transdirectInvoiceUrl: string | null;
  transdirectError: string | null;
  
  // JSON Fields
  shippingAddress: AddressJson;
  billingAddress: AddressJson;
  metadata: Record<string, any> | null;
  
  // Extras
  couponCode: string | null;
  customerNote: string | null;
  adminNote: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  riskLevel: string | null;
  riskScore: number | null;
  subscriptionId: string | null;

  // 🔥 ADDED MISSING FIELDS FROM PRISMA SCHEMA TO FIX ERRORS
  hasPreOrderItems: boolean;
  isAuthorized: boolean;
  isCaptured: boolean;
  invoiceNumber: string | null;
  estimatedTransitTime: string | null;
  authorityToLeave: boolean;
  tailgateDelivery: boolean;
  deliveryInstructions: string | null;

  // UTM / Attribution
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referringSite: string | null;

  // Relations
  user: OrderUser | null;
  items: OrderItem[];
  transactions: OrderTransaction[];
  orderNotes: OrderNote[];
  affiliate: OrderAffiliate | null;
  disputes: OrderDispute[];
  returns: OrderReturn[];
  _count?: { items: number };
}

// Type for Customer History Box
export interface CustomerHistoryType {
  totalOrders: number;
  totalRevenue: number;
  avgValue: number;
}