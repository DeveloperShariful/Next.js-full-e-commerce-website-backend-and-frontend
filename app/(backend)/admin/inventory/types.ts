//app/(backend)/admin/inventory/types.ts

export interface InventoryLevelData {
  id: string;
  productId: string;
  variantId: string | null;
  locationId: string;
  quantity: number;
  reserved: number; // 🚀 New: Calculated from InventoryReservation
  available: number; // 🚀 New: quantity - reserved
  
  product: {
    id: string;
    name: string;
    sku: string | null;
    featuredImage: string | null;
    trackQuantity: boolean;
  };
  variant: {
    id: string;
    name: string;
    sku: string | null;
    image: string | null;
    trackQuantity: boolean;
  } | null;
  location: {
    id: string;
    name: string;
  };
}

export interface StockHistoryData {
  id: string;
  productId: string;
  variantId: string | null;
  locationId: string | null;
  change: number;
  finalStock: number;
  reason: string | null;
  userId: string | null;
  createdAt: Date;
  product: { name: string };
}

export interface SupplierData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  contactPerson: string | null;
  createdAt: Date;
  _count?: { purchaseOrders: number };
}

export interface PurchaseOrderData {
  id: string;
  poNumber: string;
  supplierId: string;
  status: string;
  totalCost: number;
  notes: string | null;
  createdAt: Date;
  supplier: { name: string; email: string | null };
}

export interface LocationData {
  id: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  _count?: {
    inventoryLevels: number;
    stockTransfers: number;
    stockReceived: number;
  };
}

export interface StockTransferData {
  id: string;
  reference: string;
  fromLocationId: string;
  toLocationId: string;
  status: string;
  items: any;
  createdAt: Date;
  fromLocation: { name: string };
  toLocation: { name: string };
}