import { ShippingMethodType } from "@prisma/client";

// ✅ ShippingRate আপডেট করা হয়েছে (createdAt, updatedAt, carrierServiceId যোগ করা হয়েছে)
export interface ShippingRate {
    id: string;
    name: string;
    type: ShippingMethodType | string; // ✅ String Allow করা হয়েছে যাতে UI-তে কাস্টম টাইপ সাপোর্ট করে
    price: number;
    minPrice?: number | null;
    minWeight?: number | null;
    maxWeight?: number | null;
    taxStatus?: string; 
    freeShippingRequirement?: string | null;
    carrierServiceId?: string | null; // ✅ নতুন ফিল্ড
    
    createdAt: Date; // ✅ মিসিং ছিল
    updatedAt: Date; // ✅ মিসিং ছিল
}

// ✅ ShippingZone আপডেট করা হয়েছে
export interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    rates: ShippingRate[];
    
    createdAt: Date; // ✅ মিসিং ছিল
    updatedAt: Date; // ✅ মিসিং ছিল
}

export interface ShippingClass {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    _count?: {
        products: number;
    };
}

export interface ShippingOptionsData {
    enableShippingCalc: boolean;
    hideShippingCosts: boolean;
    shippingDestination: string;
    
    sellingLocation: string;
    sellingCountries: string[];
    shippingLocation: string;
    shippingCountries: string[];
}

export interface ComponentProps {
    zones: ShippingZone[];
    classes: ShippingClass[];
    options: ShippingOptionsData;
    refreshData: () => void;
}

// Transdirect Types (নিচে যা আছে ঠিক আছে)...
export interface TransdirectItem {
  weight: number;
  length: number;
  width: number;
  height: number;
  quantity: number;
  description: string;
}

export interface TransdirectAddress {
  company_name?: string;
  address?: string;
  suburb: string;
  postcode: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  name?: string;
  type: "business" | "residential";
}

export interface QuoteRequest {
  declared_value: string;
  insured: boolean;
  items: TransdirectItem[];
  sender: TransdirectAddress;
  receiver: TransdirectAddress;
  dangerous_goods?: boolean;
}

export interface QuoteResponse {
  quotes: {
    [key: string]: {
      total: number;
      price_insurance_ex: number;
      service: string;
      transit_time: string;
      eta_dates?: {
        start: string;
        end: string;
      };
      carrier_id: number;
    };
  };
}

export interface BookingRequest {
  quote_id?: string;
  selected_courier: string;
  declared_value: string;
  insured: boolean;
  items: TransdirectItem[];
  sender: TransdirectAddress;
  receiver: TransdirectAddress;
  pickup_date?: string;
  pickup_window_start?: string;
  pickup_window_end?: string;
  instructions?: string;
  reference?: string;
}

export interface BookingResponse {
  id: number;
  job_id: string;
  reference: string;
  consignment_note: string;
  label: string;
  invoice: string;
  status: string;
}