// app/api/offline/create-order/route.ts
// Handles ONLY offline payment methods: Cash on Delivery (cod) and Bank Transfer (bank_transfer).
// Completely isolated from Stripe / PayPal — no payment gateway logic here.

import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/prisma';
import { Prisma, OrderStatus, PaymentStatus, TaxStatus, ShippingMethodType } from '@prisma/client';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import type { ShippingRateDTO } from '@/app/actions/frontend/checkout/checkoutActions';
import { sendNotification } from '@/app/api/email/send-notification';
import { logActivity } from '@/lib/activity-logger';
import { queueAndSyncTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';
import { sanitizeEmail } from '@/lib/sanitize-email';
import { markOrderRecoveredIfAbandoned } from '@/lib/mark-order-recovered';
import { getStoreTimezone } from '@/lib/get-store-timezone';
import { storeDateKey } from '@/lib/store-time';

// ============================================================================
// TYPES
// ============================================================================
interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: string;
  variationId?: string;
}

interface AddressDTO {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
  email: string;
  phone: string;
  country?: string;
}

interface CouponDTO { code: string; amount?: number; }
interface MetaDataDTO { key: string; value: string; }

// ============================================================================
// CONSTANTS
// ============================================================================
const OFFLINE_METHODS = ['cod', 'bank_transfer'] as const;
type OfflineMethod = typeof OFFLINE_METHODS[number];

const MAX_ORDER_NUMBER_RETRIES = 5;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// ORDER NUMBER GENERATOR (same logic as stripe/create-order)
// ============================================================================
async function generateNextOrderNumber(): Promise<string> {
  const recentOrders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
    take: 20,
  });
  let maxNumber = 999;
  for (const order of recentOrders) {
    if (order.orderNumber) {
      const num = parseInt(order.orderNumber.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num < 9_000_000 && num > maxNumber) maxNumber = num;
    }
  }
  return String(maxNumber + 1);
}

// ============================================================================
// MAIN POST REQUEST
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const cookieAffiliateId = request.cookies.get('solid_affiliate_id')?.value ?? null;
    const cookieVisitId = request.cookies.get('solid_affiliate_visit_id')?.value ?? null;
    const cookieVisitorId = request.cookies.get('gb_visitor_id')?.value ?? null;
    const rawForwardedFor = request.headers.get('x-forwarded-for');
    const checkoutIp = rawForwardedFor ? rawForwardedFor.split(',')[0].trim() || null : null;
    const checkoutUserAgent = request.headers.get('user-agent') || null;

    const body = await request.json();
    const {
      cartItems,
      customerInfo,
      shippingInfo,
      selectedShipping,
      shippingRates,
      appliedCoupons,
      orderNotes,
      selectedPaymentMethod,
      affiliateMetaData,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = body as {
      cartItems: CartItemDTO[];
      customerInfo: AddressDTO;
      shippingInfo: AddressDTO;
      selectedShipping: string;
      shippingRates: ShippingRateDTO[];
      appliedCoupons: CouponDTO[];
      orderNotes: string;
      selectedPaymentMethod: string;
      affiliateMetaData: MetaDataDTO[];
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
    };

    // ── Guard: only offline methods reach this route ─────────────
    if (!OFFLINE_METHODS.includes(selectedPaymentMethod as OfflineMethod)) {
      return NextResponse.json({ error: 'Invalid payment method for offline route.' }, { status: 400 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Cannot create order.' }, { status: 400 });
    }
    if (!customerInfo?.email || !customerInfo?.firstName) {
      return NextResponse.json({ error: 'Billing details (Name and Email) are required.' }, { status: 400 });
    }
    customerInfo.email = sanitizeEmail(customerInfo.email);

    const isCoD = selectedPaymentMethod === 'cod';
    const paymentMethodTitle = isCoD ? 'Cash on Delivery' : 'Bank Transfer';
    const country = customerInfo.country || 'AU';
    const couponCode = appliedCoupons?.[0]?.code;

    // ── Session user ─────────────────────────────────────────────
    const session = await auth();
    const sessionUserId = session?.user?.email
      ? (await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
      : null;

    // ── Parallel DB lookups ──────────────────────────────────────
    const [rawProductResults, discountRecord, activeTaxRate] = await Promise.all([
      Promise.all(
        cartItems.map(async (item) => {
          const [product, variant] = await Promise.all([
            db.product.findUnique({
              where: { id: item.id },
              select: {
                id: true, name: true, price: true, salePrice: true,
                taxStatus: true, stock: true, isPreOrder: true, preOrderReleaseDate: true,
              },
            }),
            item.variationId
              ? db.productVariant.findUnique({ where: { id: item.variationId } })
              : Promise.resolve(null),
          ]);
          return { item, product, variant };
        })
      ),
      couponCode ? db.discount.findUnique({ where: { code: couponCode } }) : Promise.resolve(null),
      db.taxRate.findFirst({ where: { country, isActive: true } }),
    ]);

    // ── Build order items + subtotal (server-side prices) ────────
    let subtotal = 0;
    const validOrderItems: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string | null;
      price: number;
      quantity: number;
      total: number;
      taxStatus: TaxStatus;
      isPreOrder: boolean;
      preOrderReleaseDate: Date | null;
      metadata: Record<string, unknown> | null;
    }> = [];

    for (const { item, product, variant } of rawProductResults) {
      if (!product) throw new Error('Product missing or unavailable.');

      const dbRegularPrice = variant ? Number(variant.price) : Number(product.price);
      const dbSalePrice = variant
        ? (variant.salePrice ? Number(variant.salePrice) : null)
        : (product.salePrice ? Number(product.salePrice) : null);
      const dbEffectivePrice = (dbSalePrice && dbSalePrice > 0 && dbSalePrice < dbRegularPrice)
        ? dbSalePrice
        : dbRegularPrice;

      const rawCartStr = String(item.price ?? '').replace(/[^0-9.]/g, '');
      const cartItemPrice = rawCartStr ? Math.round(Number(rawCartStr) * 100) / 100 : null;
      const matchesRegular = cartItemPrice !== null && Math.abs(cartItemPrice - dbRegularPrice) < 0.01;
      const matchesSale    = cartItemPrice !== null && dbSalePrice !== null && Math.abs(cartItemPrice - dbSalePrice) < 0.01;
      const price = (matchesRegular || matchesSale) ? cartItemPrice! : dbEffectivePrice;

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      validOrderItems.push({
        productId: product.id,
        variantId: item.variationId || null,
        productName: product.name,
        variantName: variant?.name || null,
        sku: variant?.sku || null,
        price,
        quantity: item.quantity,
        total: itemTotal,
        taxStatus: product.taxStatus,
        isPreOrder: variant ? variant.isPreOrder : product.isPreOrder,
        preOrderReleaseDate: variant ? variant.preOrderReleaseDate : product.preOrderReleaseDate,
        metadata: variant?.attributes
          ? { attributes: variant.attributes as unknown as Record<string, string> }
          : null,
      });
    }

    // ── Shipping ─────────────────────────────────────────────────
    let shippingCost = 0;
    let shippingMethodLabel = 'Standard Shipping';
    let tdBookingId: string | undefined;
    let tdCourierKey: string | undefined;
    let tdCourierPrice: number | undefined;
    let isLocalPickup = false;

    if (selectedShipping) {
      const matchedRate = shippingRates?.find(r => r.id === selectedShipping);
      if (matchedRate) {
        shippingCost = Number(matchedRate.cost);
        shippingMethodLabel = matchedRate.label;
        if (matchedRate.isLocalPickup) {
          isLocalPickup = true;
        } else if (matchedRate.isTransdirect) {
          tdBookingId  = matchedRate.tdBookingId ? String(matchedRate.tdBookingId) : undefined;
          tdCourierKey = matchedRate.tdCourierKey ?? undefined;
        } else {
          // Free/flat shipping selected — still pick cheapest Transdirect rate for fulfilment.
          // Its quoted price (tdCourierPrice) is carried via metadata so sync-time doesn't
          // need to re-fetch a quote (avoids latency + declared_value mismatches).
          const cheapestTd = shippingRates
            ?.filter(r => r.isTransdirect && r.tdBookingId && r.tdCourierKey)
            .sort((a, b) => a.cost - b.cost)[0];
          if (cheapestTd) {
            tdBookingId    = cheapestTd.tdBookingId ? String(cheapestTd.tdBookingId) : undefined;
            tdCourierKey   = cheapestTd.tdCourierKey;
            tdCourierPrice = cheapestTd.cost;
          }
        }
      } else {
        const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
        if (shippingRate) {
          shippingCost = Number(shippingRate.price);
          shippingMethodLabel = shippingRate.name;
          if (shippingRate.type === 'LOCAL_PICKUP') isLocalPickup = true;
        }
      }
    }

    // ── Discount ─────────────────────────────────────────────────
    let discountTotal = 0;
    let discountId: string | undefined;
    if (discountRecord?.isActive) {
      discountId = discountRecord.id;
      if (discountRecord.type === 'FIXED_CART') discountTotal = Number(discountRecord.value);
      else if (discountRecord.type === 'PERCENTAGE') discountTotal = (subtotal * Number(discountRecord.value)) / 100;
      if (discountTotal > subtotal) discountTotal = subtotal;
    }

    // ── GST (tax-inclusive — extract) ────────────────────────────
    let taxTotal = 0;
    if (activeTaxRate) {
      const rate = Number(activeTaxRate.rate);
      const shippingIsTaxable = activeTaxRate.shipping ?? true;
      let taxableSubtotal = 0;
      for (const item of validOrderItems) {
        if (item.taxStatus !== TaxStatus.NONE) taxableSubtotal += item.total;
      }
      const taxableProportion    = subtotal > 0 ? taxableSubtotal / subtotal : 1;
      const discountOnTaxable    = discountTotal * taxableProportion;
      const taxableAfterDiscount = Math.max(0, taxableSubtotal - discountOnTaxable);
      const taxableShipping      = shippingIsTaxable ? shippingCost : 0;
      taxTotal = (taxableAfterDiscount + taxableShipping) * rate / (100 + rate);
    }

    const secureOrderTotal = (subtotal - discountTotal) + shippingCost;
    if (secureOrderTotal <= 0) throw new Error('Order total must be greater than zero.');

    // ── First order check ────────────────────────────────────────
    const previousOrderCount = await db.order.count({
      where: {
        OR: [
          { guestEmail: { equals: customerInfo.email, mode: 'insensitive' } },
          ...(sessionUserId ? [{ userId: sessionUserId }] : []),
        ],
        paymentStatus: PaymentStatus.PAID,
      },
    });
    const isFirstOrder = previousOrderCount === 0;

    // ── Metadata ─────────────────────────────────────────────────
    const metaDataArray = Array.isArray(affiliateMetaData) ? [...affiliateMetaData] : [];
    metaDataArray.push({ key: '_payment_method', value: selectedPaymentMethod });
    metaDataArray.push({ key: '_created_via', value: 'Offline_Payment_Create_Order_API' });
    if (cookieAffiliateId) metaDataArray.push({ key: 'solid_affiliate_id', value: cookieAffiliateId });
    if (cookieVisitId) metaDataArray.push({ key: 'solid_affiliate_visit_id', value: cookieVisitId });
    if (tdCourierPrice !== undefined) metaDataArray.push({ key: '_td_courier_price', value: String(tdCourierPrice) });

    const hasPreOrderItems = validOrderItems.some(i => i.isPreOrder);
    const dbOrderItems = validOrderItems.map(({ taxStatus: _ts, ...rest }) => rest);
    const billingJson  = JSON.parse(JSON.stringify(customerInfo));
    const shippingJson = JSON.parse(JSON.stringify(shippingInfo || customerInfo));
    const metadataJson = JSON.parse(JSON.stringify(metaDataArray));

    // COD → PROCESSING (order confirmed, ship and collect on delivery)
    // Bank Transfer → AWAITING_PAYMENT (admin confirms receipt, then processes)
    const orderStatus: OrderStatus = isCoD ? OrderStatus.PROCESSING : OrderStatus.AWAITING_PAYMENT;

    const baseOrderData = {
      status: orderStatus,
      paymentStatus: PaymentStatus.UNPAID,
      currency: 'AUD',
      subtotal,
      discountTotal,
      shippingTotal: shippingCost,
      taxTotal: Number(taxTotal.toFixed(2)),
      total: secureOrderTotal,
      totalDue: secureOrderTotal,
      guestEmail: customerInfo.email,
      userId:      sessionUserId     || undefined,
      affiliateId: cookieAffiliateId || undefined,
      visitorId: cookieVisitorId || undefined,
      ipAddress: checkoutIp,
      userAgent: checkoutUserAgent,
      billingAddress: billingJson,
      shippingAddress: shippingJson,
      shippingMethod: shippingMethodLabel,
      paymentGateway: selectedPaymentMethod,
      paymentMethod: paymentMethodTitle,
      discountId,
      couponCode: couponCode || null,
      customerNote: orderNotes,
      metadata: metadataJson,
      isFirstOrder,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
      ...(isLocalPickup && { shippingType: ShippingMethodType.LOCAL_PICKUP }),
      transdirectQuoteId: tdBookingId ?? null,
      selectedCourierCode: tdCourierKey ?? null,
      hasPreOrderItems,
      items: { create: dbOrderItems },
    };

    const noteContent = isCoD
      ? '🚚 Cash on Delivery order placed. Payment to be collected on delivery.'
      : '🏦 Bank Transfer order placed. Awaiting payment from customer.';

    // ── Atomic transaction: create order + stock decrement + coupon + note ──
    // Everything in one transaction — if stock decrement fails, order is NOT created.
    const runTransaction = async (orderNumber: string) =>
      db.$transaction(async (tx) => {
        const order = await tx.order.create({ data: { orderNumber, ...baseOrderData } as Prisma.OrderUncheckedCreateInput });

        if (discountId) {
          await tx.discount.update({
            where: { id: discountId },
            data: { usedCount: { increment: 1 } },
          });
        }

        for (const item of validOrderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                soldCount: { increment: item.quantity },
              },
            });
          }
        }

        await tx.orderNote.create({
          data: { orderId: order.id, content: noteContent, isSystem: true },
        });

        return order;
      });

    let newOrder: Awaited<ReturnType<typeof db.order.create>> | null = null;

    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      const nextOrderNumber = await generateNextOrderNumber();
      try {
        newOrder = await runTransaction(nextOrderNumber);
        break;
      } catch (err) {
        const isP2002 = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (isP2002 && attempt < MAX_ORDER_NUMBER_RETRIES - 1) {
          console.warn(`⚠️ [Offline Order] Order number collision on ${nextOrderNumber}, retrying...`);
          continue;
        }
        if (isP2002) {
          newOrder = await runTransaction(String(Date.now()));
          break;
        }
        throw err;
      }
    }

    if (!newOrder?.id) throw new Error('Failed to create order in database.');

    const orderId = newOrder.id;

    console.log(
      `✅ [Offline Order] #${newOrder.orderNumber} | ${paymentMethodTitle} | ` +
      `Total: $${secureOrderTotal.toFixed(2)} | GST: $${taxTotal.toFixed(2)}`
    );

    // ── Clear cart ───────────────────────────────────────────────
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('cart_session')?.value;
      const cartWhere = newOrder.userId
        ? { userId: newOrder.userId }
        : sessionId ? { sessionId } : null;

      if (cartWhere) {
        const cart = await db.cart.findFirst({ where: cartWhere, select: { id: true } });
        if (cart) {
          await db.inventoryReservation.deleteMany({ where: { cartId: cart.id } });
          await db.cartItem.deleteMany({ where: { cartId: cart.id } });
          await db.cart.update({
            where: { id: cart.id },
            data: {
              appliedCoupons: Prisma.JsonNull,
              shippingHash: null,
              shippingQuotes: Prisma.JsonNull,
            },
          });
        }
      }
    } catch (cartErr) {
      console.error('[Offline Order] Cart clear failed (non-critical):', cartErr);
    }

    // ── Activity log (deferred with after() so it survives past the response) ─
    after(async () => {
      await logActivity({
        action: 'CHECKOUT_ORDER_PLACED',
        entityType: 'Order',
        entityId: orderId,
        details: { gateway: selectedPaymentMethod, amount: secureOrderTotal },
        userId: newOrder.userId ?? undefined,
      }).catch(() => {});
    });

    // ── Transdirect: COD only (Bank Transfer: admin ships after confirming payment) ─
    // Awaited directly (not after()) — queueAndSyncTransdirect's own internal
    // steps are already wrapped in try/catch, so it won't throw synchronously.
    if (isCoD) {
      await queueAndSyncTransdirect(orderId, 'offline-cod');
    }

    // ── Emails (fire-and-forget) ─────────────────────────────────
    const customerEmail = customerInfo.email;
    const emailTrigger = isCoD ? 'ORDER_PROCESSING' : 'ORDER_ON_HOLD';

    // Stop the abandoned-cart reminder sequence — order completed.
    if (customerEmail) {
      markOrderRecoveredIfAbandoned(customerEmail, orderId)
        .catch(err => console.error('[Offline Order] AbandonedCheckout recovery mark failed:', err));
    }

    sendNotification({ trigger: emailTrigger, recipient: customerEmail, orderId })
      .catch(err => console.error('[Offline Order] Customer email failed:', err));
    sendNotification({ trigger: 'ORDER_CREATED_ADMIN', recipient: '', orderId })
      .catch(err => console.error('[Offline Order] Admin email failed:', err));

    db.orderNote.create({
      data: {
        orderId,
        content: `📧 Email queued — customer: ${customerEmail}, admin: ✓`,
        isSystem: true,
      },
    }).catch(() => {});

    // ── Affiliate commission (fire-and-forget) ───────────────────
    if (process.env.INTERNAL_API_KEY) {
      fetch(`${APP_URL}/api/affiliate/process-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ orderId }),
      }).catch(err => console.error('[Offline Order] Affiliate trigger failed:', err));
    }

    // ── Analytics (fire-and-forget) ──────────────────────────────
    // Only COD orders are confirmed/PROCESSING immediately — Bank Transfer
    // orders start AWAITING_PAYMENT/UNPAID and shouldn't count as a sale
    // until payment is actually confirmed (a later status-change path).
    if (isCoD) {
      const totalItemsSold = validOrderItems.reduce((sum, i) => sum + i.quantity, 0);

      getStoreTimezone().then(analyticsTimezone => {
        const today = storeDateKey(new Date(), analyticsTimezone);
        return Promise.allSettled([
          db.analytics.upsert({
            where: { date: today },
            create: {
              date: today,
              grossSales: subtotal,
              netSales: subtotal - discountTotal,
              totalTax: taxTotal,
              totalShipping: shippingCost,
              totalDiscounts: discountTotal,
              totalOrders: 1,
              productsSold: totalItemsSold,
              newCustomers: isFirstOrder ? 1 : 0,
              returningCustomers: isFirstOrder ? 0 : 1,
            },
            update: {
              grossSales:         { increment: subtotal },
              netSales:           { increment: subtotal - discountTotal },
              totalTax:           { increment: taxTotal },
              totalShipping:      { increment: shippingCost },
              totalDiscounts:     { increment: discountTotal },
              totalOrders:        { increment: 1 },
              productsSold:       { increment: totalItemsSold },
              newCustomers:       { increment: isFirstOrder ? 1 : 0 },
              returningCustomers: { increment: isFirstOrder ? 0 : 1 },
            },
          }),
          ...validOrderItems
            .filter(i => !!i.productId)
            .map(({ productId, quantity, total }) =>
              db.productAnalytics.upsert({
                where: { date_productId: { date: today, productId } },
                create: { date: today, productId, itemsSold: quantity, netSales: Number(total) },
                update: {
                  itemsSold: { increment: quantity },
                  netSales:  { increment: Number(total) },
                },
              })
            ),
        ]);
      }).catch(err => console.error('[Offline Order] Analytics update failed:', err));
    }

    return NextResponse.json({
      success: true,
      wcOrderId: newOrder.id,
      wcOrderKey: newOrder.orderNumber,
    });

  } catch (error: unknown) {
    console.error('❌ [Offline Create Order Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
