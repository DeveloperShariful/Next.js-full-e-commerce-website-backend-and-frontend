// File Location: app/admin/orders/create/types.ts

export interface AddressType {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface CartItemType {
  productId: string | null;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  image: string | null;
  weight: number;
}

export interface CustomFieldType {
  key: string;
  value: string;
}

export interface CustomerType {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  addresses?: any[]; 
}

export interface OrderDataType {
  createdAt: Date;
  status: string;
  customer: CustomerType | null;
  guestEmail: string;
  guestPhone: string;
  
  billing: AddressType;
  shipping: AddressType;
  
  items: CartItemType[];
  shippingCost: number;
  shippingMethod: string;
  discountCode: string;
  discountAmount: number;
  taxRate: number;
  taxName: string;
  
  customerNote: string;
  adminNote: string;
  customFields: CustomFieldType[];
}

export interface OrderTotalsType {
  subtotal: number;
  taxTotal: number;
  finalTotal: number;
}

export interface OrderDataType {
  createdAt: Date;
  status: string;
  customer: CustomerType | null;
  guestEmail: string;
  guestPhone: string;
  
  billing: AddressType;
  shipping: AddressType;
  
  items: CartItemType[];
  shippingCost: number;
  shippingMethod: string;
  
  // Transdirect Tracking Variables
  selectedCourierCode: string;
  transdirectBookingId: string;
  
  discountCode: string;
  discountAmount: number;
  taxRate: number;
  taxName: string;
  
  customerNote: string;
  adminNote: string;
  customFields: CustomFieldType[];
}

export interface OrderTotalsType {
  subtotal: number;
  taxTotal: number;
  finalTotal: number;
}