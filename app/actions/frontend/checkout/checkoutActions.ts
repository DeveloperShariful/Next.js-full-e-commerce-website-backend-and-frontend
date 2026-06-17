// app/actions/frontend/checkout/checkoutActions.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";

// ============================================================================
// TYPES & INTERFACES
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
  length?: number | null;
  width?: number | null;
  height?: number | null;
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

const CACHE_DURATION_MS = 15 * 60 * 1000;

// ============================================================================
// ✅ FIX: Explicit session type — avoids Awaited<ReturnType<typeof auth>>
// which TypeScript resolves to 'NextMiddleware' (wrong overload in NextAuth v5).
// Using a plain structural type bypasses the overload resolution issue entirely.
// ============================================================================
type AuthUser = {
  id?: string | null;
  email?: string | null;
};
type AuthSession = { user?: AuthUser | null } | null;

async function resolveUserId(session: AuthSession): Promise<string | null> {
  if (!session?.user) return null;
  // Fast path: auth callbacks expose id directly (NextAuth v5 with custom callbacks)
  if (session.user.id) return session.user.id as string;
  // Standard path: look up by email (default NextAuth behaviour)
  if (session.user.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    return user?.id || null;
  }
  return null;
}

async function getSessionIds(): Promise<{ sessionId: string; userId: string | null }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session")?.value || "";
  // ✅ FIX: Cast auth() result to AuthSession to avoid NextMiddleware type conflict
  const session = (await auth()) as AuthSession;
  const userId = await resolveUserId(session);
  if (!sessionId && !userId) throw new Error("No active session found.");
  return { sessionId, userId };
}

// ============================================================================
// HELPERS
// ============================================================================
async function fetchTransdirectQuotes(
  shippingAddress: AddressDTO,
  items: CartItemDTO[],
  config: {
    apiKey: string;
    senderPostcode?: string | null;
    senderSuburb?: string | null;
    senderType?: string | null;
  }
): Promise<ShippingRateDTO[]> {
  try {
    const senderPostcode = config.senderPostcode || "2000";
    const senderSuburb = (config.senderSuburb || "Sydney").trim().toUpperCase();
    const receiverPostcode = String(shippingAddress.postcode).trim();
    const receiverSuburb = String(shippingAddress.city).trim().toUpperCase();

    if (!receiverPostcode || !receiverSuburb) return [];

    const transdirectItems = items.map((item) => ({
      weight: item.weight > 0 ? Number(item.weight.toFixed(2)) : 1.0,
      height: item.height ? Number(item.height) : 20.0,
      width: item.width ? Number(item.width) : 20.0,
      length: item.length ? Number(item.length) : 20.0,
      quantity: item.quantity,
      description: "carton",
    }));

    const payload = {
      declared_value: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      items: transdirectItems,
      sender: {
        postcode: String(senderPostcode).trim(),
        suburb: senderSuburb,
        type: config.senderType || "business",
        country: "AU",
      },
      receiver: {
        postcode: receiverPostcode,
        suburb: receiverSuburb,
        type: "residential",
        country: "AU",
      },
    };

    const response = await fetch("https://www.transdirect.com.au/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-key": config.apiKey,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data.quotes && typeof data.quotes === "object") {
      const rates: ShippingRateDTO[] = [];
      Object.keys(data.quotes).forEach((courier) => {
        const quote = data.quotes[courier];
        if (quote?.total) {
          rates.push({
            id: `td_${courier.toLowerCase()}`,
            label: `${courier.replace(/_/g, " ").toUpperCase()} (Transdirect)`,
            cost: Number(quote.total),
            isTransdirect: true,
          });
        }
      });
      return rates;
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================================================
// MAIN ACTION
// ============================================================================
export async function getCheckoutDataAction(
  shippingAddressInput?: AddressDTO | null,
  selectedShippingRateId?: string | null
): Promise<CheckoutDataResponse> {
  try {
    const { sessionId, userId } = await getSessionIds();
    const country = shippingAddressInput?.country || "AU";

    // ✅ PERF: All independent DB queries fire in parallel
    const [cart, zones, activeTaxRate, transdirectConfig] = await Promise.all([
      db.cart.findFirst({
        where: userId ? { userId } : { sessionId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true, productCode: true, name: true, slug: true, price: true,
                  featuredImage: true, weight: true, length: true, width: true,
                  height: true, taxStatus: true,
                },
              },
              variant: {
                select: {
                  id: true, name: true, price: true, image: true,
                  weight: true, length: true, width: true, height: true,
                },
              },
            },
          },
        },
      }),
      shippingAddressInput?.country
        ? db.shippingZone.findMany({
            where: { countries: { has: shippingAddressInput.country } },
            include: { rates: true },
          })
        : Promise.resolve([]),
      db.taxRate.findFirst({ where: { country, isActive: true } }),
      db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } }),
    ]);

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    // Build cart items + subtotal
    let subtotal = 0;
    let totalWeight = 0;

    const items: CartItemDTO[] = cart.items.map((item) => {
      const isVariant = item.variant !== null;
      const rawPrice  = isVariant ? Number(item.variant!.price)  : Number(item.product.price);
      const rawWeight = isVariant ? Number(item.variant!.weight || 0) : Number(item.product.weight || 0);
      const rawLength = isVariant ? Number(item.variant!.length || 0) : Number(item.product.length || 0);
      const rawWidth  = isVariant ? Number(item.variant!.width  || 0) : Number(item.product.width  || 0);
      const rawHeight = isVariant ? Number(item.variant!.height || 0) : Number(item.product.height || 0);
      const itemTotal = rawPrice * item.quantity;

      subtotal     += itemTotal;
      totalWeight  += rawWeight * item.quantity;

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

    // Coupon validation (runs after subtotal is computed)
    let discountTotal = 0;
    const appliedCoupons: CouponDTO[] = [];
    const savedCoupons = cart.appliedCoupons as Array<{ code: string; amount: number }> | null;

    if (savedCoupons && savedCoupons.length > 0) {
      const code = savedCoupons[0].code;
      const discountRecord = await db.discount.findUnique({ where: { code } });
      const now = new Date();

      if (
        discountRecord &&
        discountRecord.isActive &&
        !discountRecord.deletedAt &&
        discountRecord.startDate <= now &&
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

    // Saved addresses for logged-in users
    let billingAddress: AddressDTO | null = null;
    let shippingAddress: AddressDTO | null = shippingAddressInput || null;

    if (userId) {
      const dbAddresses = await db.address.findMany({ where: { userId } });
      const defaultBilling =
        dbAddresses.find((a) => a.type === "BILLING" && a.isDefault) ||
        dbAddresses.find((a) => a.type === "BILLING");
      const defaultShipping =
        dbAddresses.find((a) => a.type === "SHIPPING" && a.isDefault) ||
        dbAddresses.find((a) => a.type === "SHIPPING");

      if (!billingAddress && defaultBilling) {
        billingAddress = {
          firstName: defaultBilling.firstName, lastName: defaultBilling.lastName,
          company: defaultBilling.company, address1: defaultBilling.address1,
          address2: defaultBilling.address2, city: defaultBilling.city,
          state: defaultBilling.state || "", postcode: defaultBilling.postcode,
          country: defaultBilling.country, email: defaultBilling.email || "", phone: defaultBilling.phone,
        };
      }
      if (!shippingAddress && defaultShipping) {
        shippingAddress = {
          firstName: defaultShipping.firstName, lastName: defaultShipping.lastName,
          company: defaultShipping.company, address1: defaultShipping.address1,
          address2: defaultShipping.address2, city: defaultShipping.city,
          state: defaultShipping.state || "", postcode: defaultShipping.postcode,
          country: defaultShipping.country, email: defaultShipping.email || "", phone: defaultShipping.phone,
        };
      }
    }

    // Shipping rates
    let availableShippingRates: ShippingRateDTO[] = [];
    let shippingTotal = 0;

    if (shippingAddress?.postcode && shippingAddress.city && shippingAddress.country) {
      zones.forEach((zone) => {
        zone.rates.forEach((rate) => {
          const cost      = Number(rate.price);
          const minWeight = rate.minWeight ? Number(rate.minWeight) : 0;
          const maxWeight = rate.maxWeight ? Number(rate.maxWeight) : 999_999;
          const minPrice  = rate.minPrice  ? Number(rate.minPrice)  : 0;

          if (rate.type === "FREE_SHIPPING" && subtotal - discountTotal >= minPrice) {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost: 0 });
          } else if (rate.type === "FLAT_RATE" && totalWeight >= minWeight && totalWeight <= maxWeight) {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost });
          } else if (rate.type === "LOCAL_PICKUP") {
            availableShippingRates.push({ id: rate.id, label: rate.name, cost: 0 });
          }
        });
      });

      // Transdirect — DB cache first
      const currentHash = `${shippingAddress.postcode}-${shippingAddress.city.toUpperCase()}-${totalWeight.toFixed(1)}kg`;
      let transdirectRates: ShippingRateDTO[] = [];

      if (cart.shippingHash === currentHash && cart.shippingQuotes) {
        const cached = cart.shippingQuotes as unknown as { timestamp: number; rates: ShippingRateDTO[] } | null;
        if (cached?.timestamp && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
          transdirectRates = cached.rates;
        }
      }

      if (transdirectRates.length === 0 && transdirectConfig?.isEnabled && transdirectConfig.apiKey) {
        transdirectRates = await fetchTransdirectQuotes(shippingAddress, items, {
          apiKey: transdirectConfig.apiKey!,
          senderPostcode: transdirectConfig.senderPostcode,
          senderSuburb: transdirectConfig.senderSuburb,
          senderType: transdirectConfig.senderType,
        });

        if (transdirectRates.length > 0) {
          await db.cart.update({
            where: { id: cart.id },
            data: {
              shippingHash: currentHash,
              shippingQuotes: JSON.parse(JSON.stringify({ timestamp: Date.now(), rates: transdirectRates })),
            },
          });
        }
      }

      if (transdirectRates.length > 0) {
        availableShippingRates = [...availableShippingRates, ...transdirectRates];
      }
      availableShippingRates.sort((a, b) => a.cost - b.cost);

      if (selectedShippingRateId) {
        const matched = availableShippingRates.find((r) => r.id === selectedShippingRateId);
        if (matched) shippingTotal = matched.cost;
      } else if (availableShippingRates.length > 0) {
        shippingTotal = availableShippingRates[0].cost;
      }
    }

    // GST (tax-inclusive — extract)
    let taxTotal = 0;
    if (activeTaxRate) {
      const rate = Number(activeTaxRate.rate);
      const shippingIsTaxable = activeTaxRate.shipping ?? true;
      let taxableSubtotal = 0;
      for (const item of items) {
        if (item.taxStatus !== "NONE") taxableSubtotal += item.total;
      }
      const taxableProportion      = subtotal > 0 ? taxableSubtotal / subtotal : 1;
      const taxableAfterDiscount   = Math.max(0, taxableSubtotal - discountTotal * taxableProportion);
      const taxableShipping        = shippingIsTaxable ? shippingTotal : 0;
      taxTotal = ((taxableAfterDiscount + taxableShipping) * rate) / (100 + rate);
    }

    const finalTotal = subtotal - discountTotal + shippingTotal;

    return {
      success: true,
      items,
      billingAddress,
      shippingAddress,
      availableShippingRates,
      appliedCoupons,
      totals: {
        subtotal:      Number(subtotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        shippingTotal: Number(shippingTotal.toFixed(2)),
        taxTotal:      Number(taxTotal.toFixed(2)),
        total:         Number(finalTotal.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("[getCheckoutDataAction]", error);
    return { success: false, error: "An error occurred while loading checkout data." };
  }
}