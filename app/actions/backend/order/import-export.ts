// ============================================================
// Location: app/actions/admin/order/import-export.ts
// Version: 2.0 (Full Schema Aligned + Analytics Ready)
// Fixed By: Claude — সব column name, analytics, UTM, Transdirect
// ============================================================

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { OrderStatus, PaymentStatus, FulfillmentStatus, DiscountType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";

// ============================================================
// SECTION 1: UTILITY HELPERS
// ============================================================

const safeFloat = (val: unknown): number => {
  if (val === null || val === undefined || val === "") return 0;
  const clean = String(val).replace(/[^\d.-]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const safeInt = (val: unknown): number => {
  if (val === null || val === undefined || val === "") return 0;
  const num = parseInt(String(val), 10);
  return isNaN(num) ? 0 : num;
};

const nullIfEmpty = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
};

// ============================================================
// SECTION 1B: COUPON TYPE INFERENCE
// ============================================================

interface CouponUsage {
  discountTotal: number;
  subtotal: number;
}

function inferCouponType(
  code: string,
  usages: CouponUsage[]
): { type: DiscountType; value: number } {
  // 1. Explicit % in code name (e.g. "5%freeship")
  const explicitPct = code.match(/(\d+(?:\.\d+)?)\s*%/);
  if (explicitPct) {
    return { type: "PERCENTAGE", value: parseFloat(explicitPct[1]) };
  }

  // 2. Ratio-based inference across all orders using this coupon
  const ratios = usages
    .filter((u) => u.subtotal > 0.01)
    .map((u) => (u.discountTotal / u.subtotal) * 100);

  if (ratios.length > 0) {
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const maxDev = Math.max(...ratios.map((r) => Math.abs(r - avg)));
    // Consistent ratio within 2% deviation AND a sensible percentage (1–100)
    if (maxDev < 2 && avg >= 1 && avg <= 100) {
      const rounded = Math.round(avg * 2) / 2; // nearest 0.5
      if (Math.abs(avg - rounded) < 1.5) {
        return { type: "PERCENTAGE", value: parseFloat(rounded.toFixed(1)) };
      }
    }
  }

  // 3. Trailing number in code name matches computed ratio (e.g. gobike5 → 5%)
  const trailing = code.match(/(\d+)$/);
  if (trailing) {
    const n = parseInt(trailing[1]);
    if (n >= 1 && n <= 99 && ratios.length > 0) {
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      if (Math.abs(avg - n) < 4) {
        return { type: "PERCENTAGE", value: n };
      }
    }
  }

  // 4. Default: FIXED_AMOUNT — use average discount across orders
  const avgAmount =
    usages.length > 0
      ? usages.reduce((a, u) => a + u.discountTotal, 0) / usages.length
      : 0;
  return { type: "FIXED_AMOUNT", value: parseFloat(avgAmount.toFixed(2)) };
}

// ============================================================
// SECTION 2: STATUS MAPPERS
// ============================================================

/**
 * WooCommerce status → Prisma OrderStatus
 * v15 plugin এর post_status format: "wc-completed", "wc-processing" ইত্যাদি
 */
const mapOrderStatus = (wcStatus: string): OrderStatus => {
  const s = (wcStatus || "").toLowerCase().replace("wc-", "").trim();
  const map: Record<string, OrderStatus> = {
    completed:       "DELIVERED",
    processing:      "PROCESSING",
    "on-hold":       "AWAITING_PAYMENT",
    pending:         "PENDING",
    "pending-payment": "PENDING",
    cancelled:       "CANCELLED",
    canceled:        "CANCELLED",
    refunded:        "REFUNDED",
    failed:          "FAILED",
    shipped:         "SHIPPED",
    delivered:       "DELIVERED",
    packed:          "PACKED",
    returned:        "RETURNED",
    "ready-for-pickup": "READY_FOR_PICKUP",
    "partially-paid":   "PARTIALLY_PAID",
  };
  return map[s] ?? "PENDING";
};

/**
 * OrderStatus থেকে PaymentStatus derive করা
 */
const derivePaymentStatus = (
  orderStatus: OrderStatus,
  transactionId: string | null
): PaymentStatus => {
  if (orderStatus === "REFUNDED") return "REFUNDED";
  if (orderStatus === "CANCELLED") return "VOIDED";
  if (orderStatus === "FAILED")    return "UNPAID";
  if (orderStatus === "PARTIALLY_PAID") return "PARTIALLY_PAID";

  const paidStatuses: OrderStatus[] = [
    "DELIVERED", "PROCESSING", "SHIPPED", "PACKED",
    "READY_FOR_PICKUP", "AWAITING_PAYMENT",
  ];
  if (paidStatuses.includes(orderStatus) && transactionId) return "PAID";
  if (paidStatuses.includes(orderStatus)) return "PAID"; // WC তে processing মানেই paid
  return "UNPAID";
};

/**
 * OrderStatus থেকে FulfillmentStatus derive করা
 */
const deriveFulfillmentStatus = (orderStatus: OrderStatus): FulfillmentStatus => {
  const fulfilledStatuses: OrderStatus[] = ["DELIVERED", "SHIPPED", "PACKED", "READY_FOR_PICKUP"];
  if (fulfilledStatuses.includes(orderStatus)) return "FULFILLED";
  if (orderStatus === "PROCESSING") return "PARTIALLY_FULFILLED";
  if (orderStatus === "RETURNED")   return "RETURNED";
  return "UNFULFILLED";
};

// ============================================================
// SECTION 3: ADDRESS PARSER
// ============================================================

/**
 * "123 Main St, Sydney, NSW, 2000, AU" → structured object
 * v15 plugin: address parts comma separated
 */
const parseAddress = (
  fullAddress: string,
  name: string,
  email: string,
  phone: string
): Record<string, string> => {
  const nameParts = (name || "").trim().split(/\s+/); // multiple spaces handle করা
  const [firstName = "", ...lastParts] = nameParts;
  const lastName = lastParts.join(" ");

  if (!fullAddress || fullAddress.trim() === "") {
    return { firstName, lastName, address1: "", city: "", state: "", postcode: "", country: "AU", email: email || "", phone: phone || "" };
  }

  const parts = fullAddress.split(",").map((p) => p.trim()).filter(Boolean);

  // parts order (v15 export): address1, [address2], city, state, postcode, country
  const country  = parts.length >= 1 ? parts.pop()! : "AU";
  const postcode = parts.length >= 1 ? parts.pop()! : "";
  const state    = parts.length >= 1 ? parts.pop()! : "";
  const city     = parts.length >= 1 ? parts.pop()! : "";
  const address1 = parts.join(", "); // বাকি সব address line

  return { firstName, lastName, address1, city, state, postcode, country, email: email || "", phone: phone || "" };
};

// ============================================================
// SECTION 4: PRODUCT STRING PARSER
// ============================================================

/**
 * v15 plugin product format (updated):
 * "Product Name [SKU: ABC] [Type: variable] [Cat: Bikes] {Dims: L:10,W:5,H:3,Wt:2} [Attr: Color: Red, Size: XL] (x2) - 99.99 [Img: https://...]"
 */
interface ParsedItem {
  name:        string;
  sku:         string | null;
  productType: string; // "simple" | "variable" | "grouped" | "external" — from [Type:] or inferred
  quantity:    number;
  unitPrice:   number;
  lineTotal:   number;
  image:       string | null;
  category:    string | null;
  dims:        string | null;
  attributes:  Record<string, string>; // { Color: "Red", Size: "XL" }
}

const parseProducts = (productString: string): ParsedItem[] => {
  if (!productString || productString === "No Items") return [];

  return productString.split(" || ").map((itemStr): ParsedItem | null => {
    try {
      const namePart   = itemStr.split("[")[0].trim();

      const skuMatch   = itemStr.match(/\[SKU:\s*(.*?)\]/);
      const typeMatch  = itemStr.match(/\[Type:\s*(.*?)\]/i);
      const catMatch   = itemStr.match(/\[Cat:\s*(.*?)\]/);
      const dimsMatch  = itemStr.match(/\{Dims:\s*(.*?)\}/);
      const attrMatch  = itemStr.match(/\[Attr:\s*(.*?)\]/);
      const qtyMatch   = itemStr.match(/\(x(\d+)\)/);
      const priceMatch = itemStr.match(/\(x\d+\)\s*-\s*\$?([\d.]+)/);
      const imgMatch   = itemStr.match(/\[Img:\s*(https?:\/\/[^\]]+)\]/);

      const quantity  = qtyMatch   ? parseInt(qtyMatch[1], 10) : 1;
      const lineTotal = priceMatch ? parseFloat(priceMatch[1]) : 0;
      const unitPrice = quantity > 0 ? lineTotal / quantity    : 0;

      const attributes: Record<string, string> = {};
      if (attrMatch) {
        attrMatch[1].split(",").forEach((pair) => {
          const [key, ...valParts] = pair.split(":");
          if (key && valParts.length) {
            attributes[key.trim()] = valParts.join(":").trim();
          }
        });
      }

      // productType: use [Type:] if present, otherwise infer from attributes
      const productType = typeMatch?.[1]?.trim().toLowerCase()
        || (Object.keys(attributes).length > 0 ? "variable" : "simple");

      return {
        name:        namePart || "Imported Item",
        sku:         nullIfEmpty(skuMatch?.[1]),
        productType,
        quantity,
        unitPrice:   parseFloat(unitPrice.toFixed(2)),
        lineTotal:   parseFloat(lineTotal.toFixed(2)),
        image:       nullIfEmpty(imgMatch?.[1]),
        category:    nullIfEmpty(catMatch?.[1]),
        dims:        nullIfEmpty(dimsMatch?.[1]),
        attributes,
      };
    } catch {
      return null;
    }
  }).filter((item): item is ParsedItem => item !== null);
};

// ============================================================
// SECTION 5: COUPON PARSER
// ============================================================

interface ParsedCoupon {
  code:   string | null;
  amount: number;
}

/** "SAVE10 ($15.00)" → { code: "SAVE10", amount: 15 } */
const parseCoupon = (couponStr: string): ParsedCoupon => {
  if (!couponStr || couponStr.trim() === "") return { code: null, amount: 0 };
  // Multiple coupons: "CODE1 ($5.00), CODE2 ($10.00)" — প্রথমটা নিই, amount সব যোগ
  const entries = couponStr.split(",").map((s) => s.trim());
  let firstCode: string | null = null;
  let totalAmount = 0;

  entries.forEach((entry) => {
    const match = entry.match(/^(.+?)\s*\(\$?([\d.]+)\)$/);
    if (match) {
      if (!firstCode) firstCode = match[1].trim();
      totalAmount += parseFloat(match[2]);
    } else if (!firstCode && entry) {
      firstCode = entry;
    }
  });

  return { code: firstCode, amount: parseFloat(totalAmount.toFixed(2)) };
};

// ============================================================
// SECTION 6: MAIN IMPORT FUNCTION
// ============================================================

export interface ImportResult {
  success:      boolean;
  message?:     string;
  error?:       string;
  successCount: number;
  skipCount:    number;
  errorCount:   number;
  errors:       string[];
}

export async function importOrdersCSV(csvString: string): Promise<ImportResult> {
  const result: ImportResult = { success: false, successCount: 0, skipCount: 0, errorCount: 0, errors: [] };

  try {
    const parseResult = Papa.parse<Record<string, string>>(csvString, {
      header:         true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(), // trimHeaders এর replacement
    });
    const data        = parseResult.data;
    const parseErrors = parseResult.errors;

    if (parseErrors.length > 0) {
      console.warn("CSV parse warnings:", parseErrors);
    }

    // ── একবারে সব existing order numbers load করা (loop এ N+1 এড়ানো) ──
    const allOrderNums = data
      .map((r) => String(r["Order ID"] || "").trim())
      .filter(Boolean);

    const existingOrders = await db.order.findMany({
      where:  { orderNumber: { in: allOrderNums } },
      select: { orderNumber: true },
    });
    const existingSet = new Set(existingOrders.map((o) => o.orderNumber));

    // ── Customer lookup cache (loop এ N+1 এড়ানো) ──
    const allEmails = [...new Set(
      data.map((r) => String(r["Email"] || "").trim().toLowerCase()).filter(Boolean)
    )];
    const existingUsers = await db.user.findMany({
      where:  { email: { in: allEmails } },
      select: { id: true, email: true },
    });
    const userEmailMap = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]));

    // ── Coupon accumulator (type inference এর জন্য) ──
    const couponUsageMap = new Map<string, CouponUsage[]>();

    // ── SKU → Product/Variant lookup (analytics product linking) ──
    // Pre-scan all rows first to collect unique SKUs, then batch query once
    const allRawSkus: string[] = [];
    for (const row of data) {
      const productColScan = row["Product Details (Name | SKU | Type | Cat | Dims | Image | Attrs)"]
        || row["Product Details (Name | SKU | Cat | Dims | Image | Attrs)"]
        || row["Product Details (Name | SKU | Cat | Dims | Image)"]
        || row["Product Details"]
        || "";
      if (productColScan) {
        parseProducts(productColScan).forEach((item) => { if (item.sku) allRawSkus.push(item.sku); });
      }
    }
    const uniqueSkus = [...new Set(allRawSkus)];

    const [skuProducts, skuVariants] = uniqueSkus.length > 0
      ? await Promise.all([
          db.product.findMany({
            where:  { sku: { in: uniqueSkus }, deletedAt: null },
            select: { id: true, sku: true },
          }),
          db.productVariant.findMany({
            where:  { sku: { in: uniqueSkus } },
            select: { id: true, sku: true, productId: true },
          }),
        ])
      : ([ [], [] ] as const);

    const skuToProductId = new Map<string, string>();
    skuProducts.forEach((p) => { if (p.sku) skuToProductId.set(p.sku, p.id); });

    // First variant match per SKU wins (variant SKU is more specific than product SKU)
    const skuToVariant = new Map<string, { variantId: string; productId: string }>();
    skuVariants.forEach((v) => {
      if (v.sku && !skuToVariant.has(v.sku)) skuToVariant.set(v.sku, { variantId: v.id, productId: v.productId });
    });

    // ── Process each row ──
    for (const row of data) {
      const orderNum = String(row["Order ID"] || "").trim();
      if (!orderNum) continue;

      // Duplicate skip
      if (existingSet.has(orderNum)) {
        result.skipCount++;
        continue;
      }

      try {
        // ── 1. Basic fields ──
        const rawDate    = row["Date"] || row["Order Date"] || "";
        const orderDate  = rawDate ? new Date(rawDate) : new Date();
        const wcStatus   = row["Status"] || "pending";
        const orderStatus      = mapOrderStatus(wcStatus);
        const transactionId    = nullIfEmpty(row["Transaction ID"]);
        const paymentStatus    = derivePaymentStatus(orderStatus, transactionId);
        const fulfillmentStatus = deriveFulfillmentStatus(orderStatus);

        // ── 2. Customer ──
        const email       = nullIfEmpty((row["Email"] || "").trim().toLowerCase());
        const customerName = String(row["Customer Name"] || "").trim();
        const phone        = nullIfEmpty(row["Phone"]);

        // isFirstOrder: এই customer এর আগে কোনো order আছে কিনা চেক
        let orderUserId: string | null = null;
        let isFirstOrder = true;
        if (email) {
          orderUserId = userEmailMap.get(email) ?? null;
          if (orderUserId) {
            // existing user এর আগের order আছে কিনা
            const prevOrderCount = await db.order.count({
              where: { userId: orderUserId, orderNumber: { not: orderNum } },
            });
            isFirstOrder = prevOrderCount === 0;
          }
        }

        // ── 3. Addresses ──
        const billingAddress  = parseAddress(row["Billing Address"]  || "", customerName, email ?? "", phone ?? "");
        const shippingAddress = parseAddress(row["Shipping Address"] || "", customerName, email ?? "", phone ?? "");

        // ── 4. Financial fields (v15 plugin columns) ──
        // v15 এ: Shipping Method + Shipping Total আলাদা column
        const shippingTotal   = safeFloat(row["Shipping Total"] || row["Shipping Cost"] || 0);
        const taxTotal        = safeFloat(row["Tax Total"]      || row["Order Tax"]     || row["Total Tax"] || 0);
        const orderTotal      = safeFloat(row["Order Total"]    || row["Net Total"]     || 0);
        const discountTotal   = safeFloat(row["Discount Total"] || 0);

        // ── WooCommerce এর সঠিক calculation (schema analytics এর সাথে মিলিয়ে) ──
        // WC Order Total = subtotal(product prices) + shipping + tax - discount
        // netAmount (Net Sales) = product revenue only = total - shipping - tax
        // subtotal (Gross Sales) = netAmount + discountTotal (discount add back করা)
        const netAmount = parseFloat((orderTotal - shippingTotal - taxTotal).toFixed(2));
        const subtotal  = parseFloat((netAmount + discountTotal).toFixed(2));

        // payment fee / surcharge — v15 তে নেই, default 0
        const paymentFee  = 0;
        const surcharge   = 0;
        const totalPaid   = paymentStatus === "PAID" || paymentStatus === "PARTIALLY_PAID"
          ? orderTotal : 0;
        const totalDue    = orderTotal - totalPaid;
        const netTotal    = parseFloat((orderTotal - paymentFee).toFixed(2));

        // ── 5. Coupon ──
        const coupon = parseCoupon(row["Coupons"] || "");

        // Accumulate coupon usage for type inference (after loop)
        if (coupon.code && coupon.amount > 0) {
          if (!couponUsageMap.has(coupon.code)) couponUsageMap.set(coupon.code, []);
          couponUsageMap.get(coupon.code)!.push({ discountTotal: coupon.amount, subtotal });
        }

        // ── 6. Shipping ──
        const shippingMethod = nullIfEmpty(row["Shipping Method"]) ?? "Standard";

        // ── 7. Payment ──
        const paymentMethodTitle = nullIfEmpty(row["Payment Method"]);
        const paymentGateway     = nullIfEmpty(row["Payment Gateway"]);

        // ── 8. UTM & Marketing (v15 এ আছে) ──
        const utmSource   = nullIfEmpty(row["UTM Source"]);
        const utmMedium   = nullIfEmpty(row["UTM Medium"]);
        const utmCampaign = nullIfEmpty(row["UTM Campaign"]);
        const referringSite = nullIfEmpty(row["Referring Site"]);

        // ── 9. Transdirect Logistics (v15 এ আছে) ──
        const transdirectBookingId  = safeInt(row["Transdirect Booking ID"]) || null;
        const transdirectOrderStatus = nullIfEmpty(row["Transdirect Status"]);
        const transdirectQuoteId    = nullIfEmpty(row["Transdirect Quote ID"]);
        const transdirectBookingRef = nullIfEmpty(row["Transdirect Ref"]);
        const transdirectLabelUrl   = nullIfEmpty(row["Transdirect Label URL"]);
        const transdirectInvoiceUrl = nullIfEmpty(row["Transdirect Invoice URL"]);
        const authorityToLeave      = ["yes","true","1"].includes(String(row["Authority to Leave"] || "").toLowerCase());
        const tailgatePickup        = ["yes","true","1"].includes(String(row["Tailgate Pickup"]    || "").toLowerCase());
        const tailgateDelivery      = ["yes","true","1"].includes(String(row["Tailgate Delivery"]  || "").toLowerCase());
        const declaredValue         = safeFloat(row["Declared Value"]) || null;
        const isInsured             = ["yes","true","1"].includes(String(row["Is Insured"] || "").toLowerCase());
        const selectedCourierCode   = nullIfEmpty(row["Courier Code"]);
        const selectedCourierService = nullIfEmpty(row["Courier Service"]);
        const estimatedTransitTime  = nullIfEmpty(row["Transit Time"]);
        const shippingTrackingNumber = nullIfEmpty(row["Tracking Number"]);
        const shippingTrackingUrl   = nullIfEmpty(row["Tracking URL"]);

        // ── 10. Fraud / Risk (v15 এ Stripe fields) ──
        const riskLevel = nullIfEmpty(row["Risk Level"]);
        const riskScore = safeInt(row["Risk Score"]) || null;

        // ── 11. Misc ──
        const customerNote = nullIfEmpty(row["Customer Note"]);
        const ipAddress    = nullIfEmpty(row["Customer IP"]);
        const userAgent    = nullIfEmpty(row["Customer User Agent"]);

        // ── 12. Products parse ──
        // Supports both old header (without Type) and new header (with Type)
        const productCol = row["Product Details (Name | SKU | Type | Cat | Dims | Image | Attrs)"]
          || row["Product Details (Name | SKU | Cat | Dims | Image | Attrs)"]
          || row["Product Details (Name | SKU | Cat | Dims | Image)"]
          || row["Product Details"]
          || "";
        const parsedItems = parseProducts(productCol);

        // ── 13. paymentId uniqueness (import এ collision এড়ানো) ──
        // Transaction ID থাকলে সেটা ব্যবহার, না হলে imp_ prefix + orderNum
        let paymentId = transactionId ?? `imp_${orderNum}`;
        // Collision check
        const payIdConflict = await db.order.findFirst({ where: { paymentId }, select: { id: true } });
        if (payIdConflict) {
          paymentId = `imp_dup_${orderNum}_${Date.now()}`;
        }

        // ── 14. Create Order ──
        await db.order.create({
          data: {
            // Core
            orderNumber:       orderNum,
            orderDate:         orderDate,
            createdAt:         orderDate,  // WC original date preserve
            updatedAt:         new Date(),

            // Customer
            userId:            orderUserId,
            guestEmail:        !orderUserId ? email : null,
            isFirstOrder:      isFirstOrder,

            // Status
            status:            orderStatus,
            paymentStatus:     paymentStatus,
            fulfillmentStatus: fulfillmentStatus,

            // Financial — সবগুলো schema field সঠিকভাবে map করা হয়েছে
            subtotal:          subtotal,         // Gross Sales (product price before discount)
            discountTotal:     discountTotal,
            shippingTotal:     shippingTotal,
            taxTotal:          taxTotal,
            surcharge:         surcharge,
            total:             orderTotal,
            totalPaid:         totalPaid,
            totalDue:          totalDue,
            paymentFee:        paymentFee,
            netAmount:         netAmount,        // Net Sales (analytics এ এটা ব্যবহার হবে)
            refundedAmount:    0,
            netTotal:          netTotal,

            // Payment
            paymentMethod:     paymentMethodTitle,
            paymentGateway:    paymentGateway,
            paymentId:         paymentId,
            payerId:           null,
            paymentVerified:   paymentStatus === "PAID",

            // Coupon
            couponCode:        coupon.code,

            // Addresses
            billingAddress:    billingAddress  as unknown as Prisma.InputJsonValue,
            shippingAddress:   shippingAddress as unknown as Prisma.InputJsonValue,

            // Shipping
            shippingMethod:    shippingMethod,
            shippingTrackingNumber: shippingTrackingNumber,
            shippingTrackingUrl:    shippingTrackingUrl,

            // UTM & Marketing
            utmSource:         utmSource,
            utmMedium:         utmMedium,
            utmCampaign:       utmCampaign,
            referringSite:     referringSite,

            // Transdirect Logistics
            transdirectBookingId:   transdirectBookingId,
            transdirectOrderStatus: transdirectOrderStatus,
            transdirectQuoteId:     transdirectQuoteId,
            transdirectBookingRef:  transdirectBookingRef,
            transdirectLabelUrl:    transdirectLabelUrl,
            transdirectInvoiceUrl:  transdirectInvoiceUrl,
            authorityToLeave:       authorityToLeave,
            tailgatePickup:         tailgatePickup,
            tailgateDelivery:       tailgateDelivery,
            declaredValue:          declaredValue,
            isInsured:              isInsured,
            selectedCourierCode:    selectedCourierCode,
            selectedCourierService: selectedCourierService,
            estimatedTransitTime:   estimatedTransitTime,

            // Fraud / Risk
            riskLevel:         riskLevel,
            riskScore:         riskScore,

            // Misc
            customerNote:      customerNote,
            ipAddress:         ipAddress,
            userAgent:         userAgent,
            currency:          nullIfEmpty(row["Currency"]) ?? "AUD",
            metadata: {
              importedFrom: "woocommerce_csv_v15",
              importedAt:   new Date().toISOString(),
            },

            // Related Records
            items: {
              create: parsedItems.map((item) => {
                // Resolve productId/variantId from local catalog by SKU
                const variantMatch      = item.sku ? skuToVariant.get(item.sku)   : undefined;
                const productIdFromSku  = item.sku ? skuToProductId.get(item.sku) : undefined;
                const resolvedProductId = variantMatch?.productId ?? productIdFromSku;
                const resolvedVariantId = variantMatch?.variantId;
                return {
                  productName: item.name,
                  sku:         item.sku,
                  price:       item.unitPrice,
                  quantity:    item.quantity,
                  total:       item.lineTotal,
                  image:       item.image,
                  ...(resolvedProductId ? { productId: resolvedProductId } : {}),
                  ...(resolvedVariantId ? { variantId: resolvedVariantId } : {}),
                  metadata: {
                    productType: item.productType,
                    ...(item.category                              ? { category: item.category }       : {}),
                    ...(item.dims                                  ? { dims: item.dims }                : {}),
                    ...(Object.keys(item.attributes).length > 0   ? { attributes: item.attributes }    : {}),
                  } as unknown as Prisma.InputJsonValue,
                };
              }),
            },

            orderNotes: {
              create: {
                content:   `WooCommerce থেকে import করা হয়েছে (v15 CSV)`,
                isSystem:  true,
                createdAt: orderDate,
              },
            },
          },
        });

        // existingSet এ add করা (একই run এ duplicate avoid করতে)
        existingSet.add(orderNum);
        result.successCount++;

      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Order #${orderNum} import failed:`, errMsg);
        result.errors.push(`Order #${orderNum}: ${errMsg}`);
        result.errorCount++;
      }
    }

    // ── Coupon Upsert (type inference + save to Discount table) ──
    if (couponUsageMap.size > 0) {
      for (const [code, usages] of couponUsageMap) {
        try {
          const { type, value } = inferCouponType(code, usages);
          await db.discount.upsert({
            where: { code },
            // Already exists: increment usedCount only (don't overwrite admin's settings)
            update: { usedCount: { increment: usages.length } },
            // New coupon: create with inferred type — isActive:false (historical, not live)
            create: {
              code,
              type,
              value:        new Prisma.Decimal(value),
              usedCount:    usages.length,
              description:  "Imported from WooCommerce",
              isActive:     false,
            },
          });
        } catch {
          // Non-critical: coupon upsert failure doesn't break the import
        }
      }
    }

    // ── Activity Log ──
    if (result.successCount > 0) {
      await logActivity({
        action: "BULK_IMPORT_ORDERS",
        entityType: "Order",
        details: {
          success: result.successCount,
          skipped: result.skipCount,
          failed:  result.errorCount,
          source:  "woocommerce_csv_v15",
        },
      });
    }

    revalidatePath("/admin/orders");

    result.success = true;
    result.message = `✅ Imported: ${result.successCount} | ⏭️ Skipped: ${result.skipCount} | ❌ Failed: ${result.errorCount}`;
    return result;

  } catch (error: unknown) {
    console.error("CSV Import Critical Error:", error);
    result.error = `Critical failure: ${error instanceof Error ? error.message : "Unknown"}`;
    return result;
  }
}

// ============================================================
// SECTION 7: EXPORT FUNCTION (Re-import capable — সব column সহ)
// ============================================================

export interface ExportFilters {
  status?:        string;
  startDate?:     string;
  endDate?:       string;
  paymentMethod?: string;
  query?:         string;
}

export async function exportOrdersCSV(filters?: ExportFilters): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const whereCondition: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(filters?.status && filters.status !== "all" ? { status: filters.status as OrderStatus } : {}),
      ...(filters?.startDate || filters?.endDate ? {
        orderDate: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate   ? { lte: new Date(filters.endDate + "T23:59:59Z") } : {}),
        },
      } : {}),
      ...(filters?.paymentMethod && filters.paymentMethod !== "all"
        ? { paymentGateway: filters.paymentMethod } : {}),
      ...(filters?.query ? {
        OR: [
          { orderNumber:  { contains: filters.query, mode: "insensitive" } },
          { guestEmail:   { contains: filters.query, mode: "insensitive" } },
          { user: { name: { contains: filters.query, mode: "insensitive" } } },
        ],
      } : {}),
    };

    const orders = await db.order.findMany({
      where:   whereCondition,
      include: {
        user:  { select: { name: true, email: true, phone: true } },
        items: true,
      },
      orderBy: { orderDate: "desc" },
      take:    10000,
    });

    const csvRows: Record<string, unknown>[] = [];

    for (const order of orders) {
      const billing  = (order.billingAddress  ?? {}) as Record<string, string>;
      const shipping = (order.shippingAddress ?? {}) as Record<string, string>;

      const billingFull  = [billing.address1,  billing.city,  billing.state,  billing.postcode,  billing.country].filter(Boolean).join(", ");
      const shippingFull = [shipping.address1, shipping.city, shipping.state, shipping.postcode, shipping.country].filter(Boolean).join(", ");
      const customerName = order.user?.name ?? `${billing.firstName ?? ""} ${billing.lastName ?? ""}`.trim();
      const email        = order.user?.email ?? order.guestEmail ?? billing.email ?? "";
      const phone        = billing.phone ?? order.user?.phone ?? "";

      // Product details string (v15 import এর সাথে compatible)
      let productStr = "No Items";
      if (order.items.length > 0) {
        productStr = order.items.map((item) => {
          const meta = (item.metadata ?? {}) as Record<string, unknown>;
          let str = item.productName;
          if (item.sku)          str += ` [SKU: ${item.sku}]`;
          if (meta.productType)  str += ` [Type: ${meta.productType}]`;
          if (meta.category)     str += ` [Cat: ${meta.category}]`;
          if (meta.dims)         str += ` {Dims: ${meta.dims}}`;
          const attrs = meta.attributes as Record<string, unknown> | undefined;
          if (attrs && Object.keys(attrs).length > 0) {
            const attrStr = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(", ");
            str += ` [Attr: ${attrStr}]`;
          }
          str += ` (x${item.quantity}) - ${item.total}`;
          if (item.image) str += ` [Img: ${item.image}]`;
          return str;
        }).join(" || ");
      }

      const couponStr = order.couponCode
        ? `${order.couponCode} ($${Number(order.discountTotal).toFixed(2)})`
        : "";

      csvRows.push({
        // ── Core ──
        "Order ID":          order.orderNumber,
        "Date":              order.orderDate.toISOString().replace("T", " ").substring(0, 19),
        "Status":            order.status,
        "Customer Name":     customerName,
        "Phone":             phone,
        "Email":             email,
        "Billing Address":   billingFull,
        "Shipping Address":  shippingFull,
        "Customer IP":       order.ipAddress ?? "",
        "Customer User Agent": order.userAgent ?? "",
        "Customer Note":     order.customerNote ?? "",
        // ── Payment ──
        "Payment Method":    order.paymentMethod  ?? "",
        "Payment Gateway":   order.paymentGateway ?? "",
        "Transaction ID":    order.paymentId ?? "",
        "Coupons":           couponStr,
        // ── Products ──
        "Product Details (Name | SKU | Type | Cat | Dims | Image | Attrs)": productStr,
        // ── Shipping ──
        "Shipping Method":   order.shippingMethod   ?? "",
        "Shipping Total":    Number(order.shippingTotal).toFixed(2),
        "Tax Total":         Number(order.taxTotal).toFixed(2),
        "Discount Total":    Number(order.discountTotal).toFixed(2),
        "Net Total":         Number(order.netAmount).toFixed(2),
        "Order Total":       Number(order.total).toFixed(2),
        "Currency":          order.currency,
        // ── UTM ──
        "UTM Source":        order.utmSource    ?? "",
        "UTM Medium":        order.utmMedium    ?? "",
        "UTM Campaign":      order.utmCampaign  ?? "",
        "Referring Site":    order.referringSite ?? "",
        // ── Transdirect ──
        "Transdirect Booking ID":  order.transdirectBookingId   ?? "",
        "Transdirect Status":      order.transdirectOrderStatus ?? "",
        "Transdirect Quote ID":    order.transdirectQuoteId     ?? "",
        "Transdirect Ref":         order.transdirectBookingRef  ?? "",
        "Transdirect Label URL":   order.transdirectLabelUrl    ?? "",
        "Transdirect Invoice URL": order.transdirectInvoiceUrl  ?? "",
        "Authority to Leave":      order.authorityToLeave ? "yes" : "no",
        "Tailgate Pickup":         order.tailgatePickup   ? "yes" : "no",
        "Tailgate Delivery":       order.tailgateDelivery ? "yes" : "no",
        "Declared Value":          order.declaredValue != null ? Number(order.declaredValue).toFixed(2) : "",
        "Is Insured":              order.isInsured ? "yes" : "no",
        "Courier Code":            order.selectedCourierCode    ?? "",
        "Courier Service":         order.selectedCourierService ?? "",
        "Transit Time":            order.estimatedTransitTime   ?? "",
        "Tracking Number":         order.shippingTrackingNumber ?? "",
        "Tracking URL":            order.shippingTrackingUrl    ?? "",
        // ── Fraud ──
        "Risk Level":              order.riskLevel ?? "",
        "Risk Score":              order.riskScore ?? "",
      });
    }

    const csvString = Papa.unparse(csvRows);
    return { success: true, csv: csvString };

  } catch (error: unknown) {
    console.error("Export Error:", error);
    return { success: false, error: `Export failed: ${error instanceof Error ? error.message : "Unknown"}` };
  }
}