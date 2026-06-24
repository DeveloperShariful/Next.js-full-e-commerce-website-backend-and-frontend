// app/api/stripe/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { Prisma, OrderStatus, PaymentStatus, TaxStatus } from '@prisma/client';
import { auth } from '@/auth';
import type { ShippingRateDTO } from '@/app/actions/frontend/checkout/checkoutActions';

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

const MAX_ORDER_NUMBER_RETRIES = 5;

// ============================================================================
// ORDER NUMBER GENERATOR
// ============================================================================
async function generateNextOrderNumber(): Promise<string> {
  const lastOrder = await db.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });
  if (!lastOrder?.orderNumber) return '1000';
  const numericPart = lastOrder.orderNumber.replace(/[^0-9]/g, '');
  if (!numericPart) return '1000';
  return String(parseInt(numericPart, 10) + 1);
}

// ============================================================================
// MAIN POST REQUEST
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    // Read affiliate cookies server-side (HttpOnly — cannot be read by client JS)
    const cookieAffiliateId = request.cookies.get('solid_affiliate_id')?.value ?? null;
    const cookieVisitId = request.cookies.get('solid_affiliate_visit_id')?.value ?? null;

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
    };

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Cannot create order.' }, { status: 400 });
    }
    if (!customerInfo?.email || !customerInfo?.firstName) {
      return NextResponse.json({ error: 'Billing details (Name and Email) are required.' }, { status: 400 });
    }

    // Resolve session user
    const session = await auth();
    const sessionUserId = session?.user?.email
      ? (await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
      : null;

    // Payment method title
    let paymentMethodTitle = 'Credit / Debit Card (Stripe)';
    if (selectedPaymentMethod === 'stripe_klarna') paymentMethodTitle = 'Klarna';
    if (selectedPaymentMethod === 'stripe_afterpay') paymentMethodTitle = 'Afterpay / Clearpay';
    if (selectedPaymentMethod === 'stripe_zip') paymentMethodTitle = 'Zip Pay';

    const country = customerInfo.country || 'AU';
    const couponCode = appliedCoupons?.[0]?.code;

    // ✅ PERF: Parallel DB lookups
    const [rawProductResults, discountRecord, activeTaxRate] = await Promise.all([
      Promise.all(
        cartItems.map(async (item) => {
          const [product, variant] = await Promise.all([
            db.product.findUnique({
              where: { id: item.id },
              select: { id: true, name: true, price: true, salePrice: true, taxStatus: true, stock: true, isPreOrder: true, preOrderReleaseDate: true },
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

    // Build order items + subtotal (server-side prices)
    let subtotal = 0;
    const validOrderItems: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      price: number;
      quantity: number;
      total: number;
      taxStatus: TaxStatus;
      isPreOrder: boolean;
      preOrderReleaseDate: Date | null;
    }> = [];

    for (const { item, product, variant } of rawProductResults) {
      if (!product) throw new Error(`Product missing or unavailable.`);
      const dbRegularPrice = variant ? Number(variant.price) : Number(product.price);
      const dbSalePrice = variant
        ? (variant.salePrice ? Number(variant.salePrice) : null)
        : (product.salePrice ? Number(product.salePrice) : null);
      // Lowest valid price according to DB
      const dbEffectivePrice = (dbSalePrice && dbSalePrice > 0 && dbSalePrice < dbRegularPrice)
        ? dbSalePrice
        : dbRegularPrice;

      // Cart price (what the customer was shown, as a formatted string e.g. "$19.99")
      const rawCartStr = String(item.price ?? '').replace(/[^0-9.]/g, '');
      const cartItemPrice = rawCartStr ? Math.round(Number(rawCartStr) * 100) / 100 : null;

      // Accept cart price only if it EXACTLY matches the DB regular or sale price (±1 cent).
      // Rejects manipulated values that don't correspond to a real DB price point.
      const matchesRegular = cartItemPrice !== null && Math.abs(cartItemPrice - dbRegularPrice) < 0.01;
      const matchesSale    = cartItemPrice !== null && dbSalePrice !== null && Math.abs(cartItemPrice - dbSalePrice) < 0.01;
      const price = (matchesRegular || matchesSale) ? cartItemPrice! : dbEffectivePrice;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      validOrderItems.push({
        productId: product.id,
        variantId: item.variationId || null,
        productName: product.name,
        price,
        quantity: item.quantity,
        total: itemTotal,
        taxStatus: product.taxStatus,
        isPreOrder: variant ? variant.isPreOrder : product.isPreOrder,
        preOrderReleaseDate: variant ? variant.preOrderReleaseDate : product.preOrderReleaseDate,
      });
    }

    // Shipping
    let shippingCost = 0;
    let shippingMethodLabel = 'Standard Shipping';
    let tdBookingId: string | undefined;
    let tdCourierKey: string | undefined;
    if (selectedShipping) {
      const matchedRate = shippingRates?.find(r => r.id === selectedShipping);
      if (matchedRate) {
        shippingCost = Number(matchedRate.cost);
        shippingMethodLabel = matchedRate.label;
        if (matchedRate.isTransdirect) {
          tdBookingId  = matchedRate.tdBookingId ? String(matchedRate.tdBookingId) : undefined;
          tdCourierKey = matchedRate.tdCourierKey ?? undefined;
          console.log(`[Stripe Order] TransDirect: bookingId=${tdBookingId}, courier=${tdCourierKey}`);
        }
      } else {
        const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
        if (shippingRate) {
          shippingCost = Number(shippingRate.price);
          shippingMethodLabel = shippingRate.name;
        }
      }
    }

    // Discount
    let discountTotal = 0;
    let discountId: string | undefined;
    if (discountRecord?.isActive) {
      discountId = discountRecord.id;
      if (discountRecord.type === 'FIXED_CART') discountTotal = Number(discountRecord.value);
      else if (discountRecord.type === 'PERCENTAGE') discountTotal = (subtotal * Number(discountRecord.value)) / 100;
      if (discountTotal > subtotal) discountTotal = subtotal;
    }

    // GST (tax-inclusive — extract)
    let taxTotal = 0;
    if (activeTaxRate) {
      const rate = Number(activeTaxRate.rate);
      const shippingIsTaxable = activeTaxRate.shipping ?? true;
      let taxableSubtotal = 0;
      for (const item of validOrderItems) {
        if (item.taxStatus !== TaxStatus.NONE) taxableSubtotal += item.total;
      }
      const taxableProportion = subtotal > 0 ? taxableSubtotal / subtotal : 1;
      const discountOnTaxable = discountTotal * taxableProportion;
      const taxableAfterDiscount = Math.max(0, taxableSubtotal - discountOnTaxable);
      const taxableShipping = shippingIsTaxable ? shippingCost : 0;
      taxTotal = (taxableAfterDiscount + taxableShipping) * rate / (100 + rate);
    }

    const secureOrderTotal = (subtotal - discountTotal) + shippingCost;
    if (secureOrderTotal <= 0) throw new Error('Order total must be greater than zero.');

    // First order check
    const previousOrderCount = await db.order.count({
      where: {
        OR: [
          { guestEmail: customerInfo.email },
          ...(sessionUserId ? [{ userId: sessionUserId }] : []),
        ],
        paymentStatus: PaymentStatus.PAID,
      },
    });
    const isFirstOrder = previousOrderCount === 0;

    const metaDataArray = Array.isArray(affiliateMetaData) ? [...affiliateMetaData] : [];
    metaDataArray.push({ key: '_stripe_payment_method', value: selectedPaymentMethod || 'stripe' });
    metaDataArray.push({ key: '_created_via', value: 'Headless_Stripe_Create_Order_API' });
    if (cookieAffiliateId) metaDataArray.push({ key: 'solid_affiliate_id', value: cookieAffiliateId });
    if (cookieVisitId) metaDataArray.push({ key: 'solid_affiliate_visit_id', value: cookieVisitId });

    const hasPreOrderItems = validOrderItems.some(i => i.isPreOrder);
    const dbOrderItems = validOrderItems.map(({ taxStatus: _ts, ...rest }) => rest);
    const billingJson = JSON.parse(JSON.stringify(customerInfo));
    const shippingJson = JSON.parse(JSON.stringify(shippingInfo || customerInfo));
    const metadataJson = JSON.parse(JSON.stringify(metaDataArray));

    const orderData = {
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      currency: 'AUD',
      subtotal,
      discountTotal,
      shippingTotal: shippingCost,
      taxTotal: Number(taxTotal.toFixed(2)),
      total: secureOrderTotal,
      totalDue: secureOrderTotal,
      guestEmail: customerInfo.email,
      userId: sessionUserId || undefined,
      affiliateId: cookieAffiliateId || undefined,
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
      transdirectQuoteId: tdBookingId ?? null,
      selectedCourierCode: tdCourierKey ?? null,
      hasPreOrderItems,
      items: { create: dbOrderItems },
    };

    // Create order with duplicate order number retry
    let newOrder: Awaited<ReturnType<typeof db.order.create>> | null = null;

    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      const nextOrderNumber = await generateNextOrderNumber();
      try {
        newOrder = await db.order.create({ data: { orderNumber: nextOrderNumber, ...orderData } });
        break;
      } catch (err) {
        const isP2002 = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (isP2002 && attempt < MAX_ORDER_NUMBER_RETRIES - 1) {
          console.warn(`⚠️ Order number collision on ${nextOrderNumber}, retrying...`);
          continue;
        }
        if (isP2002) {
          const fallback = `${Date.now()}`;
          newOrder = await db.order.create({ data: { orderNumber: fallback, ...orderData } });
          break;
        }
        throw err;
      }
    }

    if (!newOrder?.id) throw new Error('Failed to create pending order in Database.');

    // ✅ FIX: Stock is NO LONGER decremented here.
    //
    // BEFORE (the bug):
    //   Stock was decremented at order CREATION — before payment is confirmed.
    //   If user abandons checkout, closes tab, or card is declined, the stock
    //   was permanently lost. Over time, repeated failed payments drain real inventory.
    //
    // AFTER (the fix):
    //   Stock is decremented in stripe/capture-order (inside the DB transaction)
    //   ONLY when Stripe confirms payment_intent.succeeded.
    //   During checkout, stock is held via InventoryReservation (set in cartActions
    //   when items are added to cart — 15 min soft hold).
    //
    // Only coupon usedCount is incremented here (soft usage tracking during checkout window).
    await Promise.allSettled([
      discountId
        ? db.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } })
        : Promise.resolve(),
    ]);

    console.log(
      `✅ [Create Order] #${newOrder.orderNumber} | ` +
      `Total: $${secureOrderTotal.toFixed(2)} | GST: $${taxTotal.toFixed(2)} | ` +
      `Method: ${selectedPaymentMethod} | First Order: ${isFirstOrder}`
    );

    return NextResponse.json({
      success: true,
      wcOrderId: newOrder.id,
      wcOrderKey: newOrder.orderNumber,
      status: newOrder.status,
    });

  } catch (error: unknown) {
    console.error('❌ [Stripe Create Order Error]:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to create draft order before payment.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}