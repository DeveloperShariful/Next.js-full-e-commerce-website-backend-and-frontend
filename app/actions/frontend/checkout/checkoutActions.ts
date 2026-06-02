// app/actions/storefront/checkout/checkoutActions.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";

// ============================================================================
// 1. STRICT TYPES & INTERFACES (NO 'any' ALLOWED)
// ============================================================================

export interface AddressDTO {
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface CartItemDTO {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  key: string;
  total: number;
  weight: number;
  length?: number | null; // 🛡️ Added for exact Transdirect dimensions
  width?: number | null;  // 🛡️ Added for exact Transdirect dimensions
  height?: number | null; // 🛡️ Added for exact Transdirect dimensions
  taxStatus: string;
}

export interface ShippingRateDTO {
  id: string;
  label: string;
  cost: number;
  isTransdirect?: boolean; 
}

export interface CouponDTO {
  code: string;
  amount: number;
}

export interface CheckoutTotalsDTO {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number; 
  total: number;
}

export interface CheckoutDataResponse {
  success: boolean;
  error?: string;
  items?: CartItemDTO[];
  billingAddress?: AddressDTO | null;
  shippingAddress?: AddressDTO | null;
  availableShippingRates?: ShippingRateDTO[];
  appliedCoupons?: CouponDTO[];
  totals?: CheckoutTotalsDTO;
}

const transdirectCache = new Map<string, { timestamp: number, rates: ShippingRateDTO[] }>();
const CACHE_DURATION_MS = 15 * 60 * 1000; 

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

async function getSessionIds(): Promise<{ sessionId: string; userId: string | null }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value;
  const session = await auth();
  const userId = session?.user?.id || null;

  if (!sessionId && !userId) {
    throw new Error("No active session found.");
  }
  return { sessionId: sessionId || "", userId };
}

// 🚚 TRANSDIRECT API FETCH FUNCTION
async function fetchTransdirectQuotes(shippingAddress: AddressDTO, items: CartItemDTO[]): Promise<ShippingRateDTO[]> {
  try {
    const config = await db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } });
    if (!config || !config.isEnabled || !config.apiKey) {
        console.log("Transdirect bypassed: Disabled or missing API key.");
        return [];
    }

    const originLocation = await db.location.findFirst({ where: { isDefault: true } });
    
    const senderPostcode = config.senderPostcode || originLocation?.address?.split(',')?.pop()?.trim() || "2000"; 
    const senderSuburb = config.senderSuburb || "Sydney";

    const receiverPostcode = shippingAddress.postcode ? String(shippingAddress.postcode).trim() : "";
    const receiverSuburb = shippingAddress.city ? String(shippingAddress.city).trim().toUpperCase() : "";

    if (!receiverPostcode || !receiverSuburb) {
        return [];
    }

    // 🛡️ NO 'any' here. Using strictly typed CartItemDTO properties
    const transdirectItems = items.map((item) => {
      const length = item.length ? Number(item.length) : 20.0;
      const width = item.width ? Number(item.width) : 20.0;
      const height = item.height ? Number(item.height) : 20.0;
      const itemWeight = item.weight > 0 ? Number(item.weight.toFixed(2)) : 1.0;

      return {
          weight: itemWeight, 
          height: height, 
          width: width, 
          length: length, 
          quantity: item.quantity, 
          description: "carton" 
      };
    });

    const payload = {
      declared_value: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      items: transdirectItems, 
      sender: {
        postcode: String(senderPostcode).trim(),
        suburb: String(senderSuburb).trim().toUpperCase(),
        type: config.senderType || "business",
        country: "AU"
      },
      receiver: {
        postcode: receiverPostcode,
        suburb: receiverSuburb,
        type: "residential",
        country: "AU" 
      }
    };

    console.log("🚀 Sending Strategy-2 Payload to Transdirect:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://www.transdirect.com.au/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-key": config.apiKey,
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Transdirect API Failed with status:", response.status, errorText);
        return [];
    }

    const data = await response.json();
    
    if (data.quotes && typeof data.quotes === "object") {
      const liveRates: ShippingRateDTO[] = [];
      Object.keys(data.quotes).forEach((courier) => {
        const quote = data.quotes[courier];
        if (quote && quote.total) {
          liveRates.push({
            id: `td_${courier.toLowerCase()}`,
            label: `${courier.replace(/_/g, ' ').toUpperCase()} (Transdirect)`,
            cost: Number(quote.total),
            isTransdirect: true
          });
        }
      });
      return liveRates;
    }

    return [];
  } catch (error) {
    console.error("Transdirect Fetch Error Catch:", error);
    return [];
  }
}

// ============================================================================
// 3. MAIN CHECKOUT ACTION
// ============================================================================

export async function getCheckoutDataAction(
  shippingAddressInput?: AddressDTO | null,
  selectedShippingRateId?: string | null
): Promise<CheckoutDataResponse> {
  try {
    const { sessionId, userId } = await getSessionIds();

    const cart = await db.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: { select: { id: true, productCode: true, name: true, slug: true, price: true, featuredImage: true, weight: true, length: true, width: true, height: true, taxStatus: true } }, // 🛡️ Added Dimensions
            variant: { select: { id: true, name: true, price: true, image: true, weight: true, length: true, width: true, height: true } } // 🛡️ Added Dimensions
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    let subtotal = 0;
    let totalWeight = 0;

    const items: CartItemDTO[] = cart.items.map((item) => {
      const isVariant = item.variant !== null;
      const rawPrice = isVariant ? Number(item.variant!.price) : Number(item.product.price);
      const rawWeight = isVariant ? Number(item.variant!.weight || 0) : Number(item.product.weight || 0);
      
      // 🛡️ Map dimensions without 'as any'
      const rawLength = isVariant ? Number(item.variant!.length || 0) : Number(item.product.length || 0);
      const rawWidth = isVariant ? Number(item.variant!.width || 0) : Number(item.product.width || 0);
      const rawHeight = isVariant ? Number(item.variant!.height || 0) : Number(item.product.height || 0);

      const itemTotal = rawPrice * item.quantity;
      subtotal += itemTotal;
      totalWeight += (rawWeight * item.quantity);

      return {
        id: item.product.id,
        databaseId: item.product.productCode,
        name: isVariant ? `${item.product.name} - ${item.variant!.name}` : item.product.name,
        slug: item.product.slug,
        price: rawPrice,
        image: isVariant && item.variant!.image ? item.variant!.image : item.product.featuredImage,
        quantity: item.quantity,
        key: item.id,
        total: itemTotal,
        weight: rawWeight,
        length: rawLength,
        width: rawWidth,
        height: rawHeight,
        taxStatus: item.product.taxStatus,
      };
    });

    let discountTotal = 0;
    const appliedCoupons: CouponDTO[] = [];
    const savedCoupons = cart.appliedCoupons as Array<{ code: string; amount: number }> | null;

    if (savedCoupons && savedCoupons.length > 0) {
      const code = savedCoupons[0].code;
      const discountRecord = await db.discount.findUnique({ where: { code } });
      const now = new Date();

      if (
        discountRecord && discountRecord.isActive && discountRecord.startDate <= now && 
        (!discountRecord.endDate || discountRecord.endDate >= now) &&
        (!discountRecord.minSpend || subtotal >= Number(discountRecord.minSpend)) &&
        (!discountRecord.usageLimit || discountRecord.usedCount < discountRecord.usageLimit)
      ) {
        if (discountRecord.type === "FIXED_CART" || discountRecord.type === "FIXED_AMOUNT") {
          discountTotal = Number(discountRecord.value);
        } else if (discountRecord.type === "PERCENTAGE") {
          discountTotal = (subtotal * Number(discountRecord.value)) / 100;
        }

        if (discountTotal > subtotal) discountTotal = subtotal; 
        appliedCoupons.push({ code: discountRecord.code, amount: discountTotal });
      } else {
        await db.cart.update({ where: { id: cart.id }, data: { appliedCoupons: [] } });
      }
    }

    let billingAddress: AddressDTO | null = null;
    let shippingAddress: AddressDTO | null = shippingAddressInput || null;

    if (userId && (!billingAddress || !shippingAddress)) {
      const dbAddresses = await db.address.findMany({ where: { userId } });
      const defaultBilling = dbAddresses.find(a => a.type === "BILLING" && a.isDefault) || dbAddresses.find(a => a.type === "BILLING");
      const defaultShipping = dbAddresses.find(a => a.type === "SHIPPING" && a.isDefault) || dbAddresses.find(a => a.type === "SHIPPING");

      if (!billingAddress && defaultBilling) {
        billingAddress = {
          firstName: defaultBilling.firstName, lastName: defaultBilling.lastName, company: defaultBilling.company,
          address1: defaultBilling.address1, address2: defaultBilling.address2, city: defaultBilling.city,
          state: defaultBilling.state || "", postcode: defaultBilling.postcode, country: defaultBilling.country,
          email: defaultBilling.email || "", phone: defaultBilling.phone
        };
      }
      if (!shippingAddress && defaultShipping) {
        shippingAddress = {
          firstName: defaultShipping.firstName, lastName: defaultShipping.lastName, company: defaultShipping.company,
          address1: defaultShipping.address1, address2: defaultShipping.address2, city: defaultShipping.city,
          state: defaultShipping.state || "", postcode: defaultShipping.postcode, country: defaultShipping.country,
          email: defaultShipping.email || "", phone: defaultShipping.phone
        };
      }
    }

    let availableShippingRates: ShippingRateDTO[] = [];
    let shippingTotal = 0;

    if (shippingAddress && shippingAddress.country && shippingAddress.postcode && shippingAddress.city) {
      
      const zones = await db.shippingZone.findMany({
        where: { countries: { has: shippingAddress.country } },
        include: { rates: true }
      });

      zones.forEach(zone => {
        zone.rates.forEach(rate => {
          const cost = Number(rate.price);
          const minWeight = rate.minWeight ? Number(rate.minWeight) : 0;
          const maxWeight = rate.maxWeight ? Number(rate.maxWeight) : 999999;
          const minPrice = rate.minPrice ? Number(rate.minPrice) : 0;

          if (rate.type === "FREE_SHIPPING" && (subtotal - discountTotal) >= minPrice) {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost: 0 });
          } 
          else if (rate.type === "FLAT_RATE" && totalWeight >= minWeight && totalWeight <= maxWeight) {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost: cost });
          }
          else if (rate.type === "LOCAL_PICKUP") {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost: 0 });
          }
        });
      });

      const currentHash = `${shippingAddress.postcode}-${shippingAddress.city}-${totalWeight}kg-$${subtotal}`;
      let transdirectRates: ShippingRateDTO[] = [];

      const cachedData = transdirectCache.get(currentHash);

      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION_MS)) {
          console.log("⚡ Serving Transdirect Quotes from Fast Memory Cache!");
          transdirectRates = cachedData.rates;
      } else {
          console.log("🌐 Fetching NEW Transdirect Quotes from API (Strategy 2)...");
          transdirectRates = await fetchTransdirectQuotes(shippingAddress, items); 
          
          if (transdirectRates.length > 0) {
             transdirectCache.set(currentHash, { timestamp: Date.now(), rates: transdirectRates });
          }
      }
      
      if (transdirectRates.length > 0) {
        availableShippingRates = [...availableShippingRates, ...transdirectRates];
      }

      availableShippingRates.sort((a, b) => a.cost - b.cost);

      if (selectedShippingRateId) {
        const matchedRate = availableShippingRates.find(r => r.id === selectedShippingRateId);
        if (matchedRate) {
          shippingTotal = matchedRate.cost;
        }
      } else if (availableShippingRates.length > 0) {
        shippingTotal = availableShippingRates[0].cost;
      }
    }

    const taxTotal = 0; 
    const finalTotal = (subtotal - discountTotal) + shippingTotal + taxTotal;

    const totals: CheckoutTotalsDTO = {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      shippingTotal: Number(shippingTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
    };

    return {
      success: true,
      items,
      billingAddress,
      shippingAddress,
      availableShippingRates,
      appliedCoupons,
      totals
    };

  } catch (error) {
    console.error("Checkout Data Error:", error);
    return { success: false, error: "An error occurred while loading checkout data." };
  }
}