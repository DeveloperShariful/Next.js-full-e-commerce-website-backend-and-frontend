// app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { Prisma, OrderStatus, PaymentStatus, TaxStatus } from '@prisma/client';
import { auth } from '@/auth';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ============================================================================
// INTERFACES
// ============================================================================
interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: number | string;
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
interface ShippingRateDTO { id: string; label: string; cost: number; isTransdirect?: boolean; tdBookingId?: number; tdCourierKey?: string; }
interface MetaDataDTO { key: string; value: string; }

const MAX_ORDER_NUMBER_RETRIES = 5;

// ============================================================================
// ORDER NUMBER GENERATOR — sequential, same logic as stripe/create-order
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
// DYNAMIC PAYPAL CREDENTIALS FROM DB
// ============================================================================
async function getPayPalCredentials() {
  const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'paypal' } });
  if (!gateway || !gateway.isEnabled || !gateway.publicKey || !gateway.encryptedSecret) {
    throw new Error('PayPal is not configured or disabled in the admin panel.');
  }
  const secret = decrypt(gateway.encryptedSecret);
  const apiUrl = gateway.mode === 'TEST'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  return { clientId: gateway.publicKey, secret, apiUrl };
}

async function generatePayPalAccessToken() {
  const { clientId, secret, apiUrl } = await getPayPalCredentials();
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!response.ok) throw new Error('Failed to authenticate with PayPal API.');
  const data = await response.json();
  return { token: String(data.access_token), apiUrl };
}

// ============================================================================
// MAIN POST REQUEST
// ============================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cartItems,
      customerInfo,
      shippingInfo,
      selectedShipping,
      shippingRates,
      appliedCoupons,
      orderNotes,
      affiliateMetaData,
      utmSource,
      utmMedium,
      utmCampaign,
      referringSite,
    } = body as {
      cartItems: CartItemDTO[];
      customerInfo: AddressDTO;
      shippingInfo?: AddressDTO;
      selectedShipping: string;
      shippingRates: ShippingRateDTO[];
      appliedCoupons: CouponDTO[];
      orderNotes?: string;
      affiliateMetaData?: MetaDataDTO[];
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      referringSite?: string;
    };

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Cannot create order.' }, { status: 400 });
    }
    if (!customerInfo?.email || !customerInfo?.firstName) {
      return NextResponse.json({ error: 'Billing details (Name and Email) are required.' }, { status: 400 });
    }

    // Auth — resolve logged-in user if any
    const session = await auth();
    const sessionUserId = session?.user?.email
      ? (await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
      : null;

    const country = customerInfo.country || 'AU';
    const couponCode = appliedCoupons?.[0]?.code;

    // ── Parallel DB lookups ────────────────────────────────────
    const [rawProductResults, discountRecord, activeTaxRate] = await Promise.all([
      Promise.all(
        cartItems.map(async (item) => {
          const [product, variant] = await Promise.all([
            db.product.findUnique({
              where: { id: item.id },
              select: { id: true, name: true, price: true, taxStatus: true, stock: true },
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

    // ── Build order items + subtotal (server-side prices — never trust client) ──
    let subtotal = 0;
    const validOrderItems: Array<{
      productId: string;
      variantId: string | null;
      productName: string;
      price: number;
      quantity: number;
      total: number;
      taxStatus: TaxStatus;
    }> = [];

    for (const { item, product, variant } of rawProductResults) {
      if (!product) throw new Error(`Product missing or unavailable.`);
      const price = variant ? Number(variant.price) : Number(product.price);
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
      });
    }

    // ── Shipping ──────────────────────────────────────────────
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
          console.log(`[PayPal Order] TransDirect: bookingId=${tdBookingId}, courier=${tdCourierKey}`);
        }
      } else {
        const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
        if (shippingRate) {
          shippingCost = Number(shippingRate.price);
          shippingMethodLabel = shippingRate.name;
        }
      }
    }

    // ── Discount ──────────────────────────────────────────────
    let discountTotal = 0;
    let discountId: string | undefined;
    if (discountRecord?.isActive) {
      discountId = discountRecord.id;
      if (discountRecord.type === 'FIXED_CART') discountTotal = Number(discountRecord.value);
      else if (discountRecord.type === 'PERCENTAGE') discountTotal = (subtotal * Number(discountRecord.value)) / 100;
      if (discountTotal > subtotal) discountTotal = subtotal;
    }

    // ── GST (tax-inclusive — extract amount) ──────────────────
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
    if (secureOrderTotal <= 0) throw new Error('Order total is zero. Invalid for PayPal.');

    // ── First order check ─────────────────────────────────────
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

    // ── Build metadata ────────────────────────────────────────
    const metaDataArray = Array.isArray(affiliateMetaData) ? [...affiliateMetaData] : [];
    metaDataArray.push({ key: '_payment_method', value: 'paypal' });
    metaDataArray.push({ key: '_created_via', value: 'Headless_PayPal_Create_Order_API' });

    const billingJson = JSON.parse(JSON.stringify(customerInfo));
    const shippingJson = JSON.parse(JSON.stringify(shippingInfo || customerInfo));
    const metadataJson = JSON.parse(JSON.stringify(metaDataArray));
    const dbOrderItems = validOrderItems.map(({ taxStatus: _ts, ...rest }) => rest);

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
      billingAddress: billingJson,
      shippingAddress: shippingJson,
      shippingMethod: shippingMethodLabel,
      paymentGateway: 'paypal',
      paymentMethod: 'PayPal',
      discountId,
      customerNote: orderNotes || '',
      metadata: metadataJson,
      isFirstOrder,
      utmSource:     utmSource     || null,
      utmMedium:     utmMedium     || null,
      utmCampaign:   utmCampaign   || null,
      referringSite: referringSite || null,
      transdirectQuoteId: tdBookingId ?? null,
      selectedCourierCode: tdCourierKey ?? null,
      items: { create: dbOrderItems },
    };

    // ── Create DB order with duplicate-number retry ───────────
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

    if (!newOrder?.id) throw new Error('Failed to create pending order in database.');

    // ── Coupon usage tracking ─────────────────────────────────
    await Promise.allSettled([
      discountId
        ? db.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } })
        : Promise.resolve(),
    ]);

    // ── Create PayPal order ───────────────────────────────────
    const { token, apiUrl } = await generatePayPalAccessToken();

    const paypalItems = validOrderItems.map(({ productName, price, quantity }) => ({
      name: productName.slice(0, 127),
      quantity: String(quantity),
      unit_amount: { currency_code: 'AUD', value: price.toFixed(2) },
    }));

    const paypalPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: newOrder.id,
        custom_id: newOrder.id,
        invoice_id: `${newOrder.orderNumber}-${Date.now().toString().slice(-4)}`,
        description: `Order ${newOrder.orderNumber} from GoBike`,
        amount: {
          currency_code: 'AUD',
          value: secureOrderTotal.toFixed(2),
          breakdown: {
            item_total: { currency_code: 'AUD', value: subtotal.toFixed(2) },
            shipping: { currency_code: 'AUD', value: shippingCost.toFixed(2) },
            discount: { currency_code: 'AUD', value: discountTotal.toFixed(2) },
          },
        },
        items: paypalItems,
      }],
    };

    const paypalResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'PayPal-Request-Id': `create_order_${newOrder.id}`,
      },
      body: JSON.stringify(paypalPayload),
    });

    const paypalOrder = await paypalResponse.json();

    if (!paypalResponse.ok) {
      await db.order.update({ where: { id: newOrder.id }, data: { status: OrderStatus.FAILED } });
      throw new Error(paypalOrder.message || 'PayPal rejected the order initialization.');
    }

    console.log(
      `✅ [PayPal Create Order] #${newOrder.orderNumber} | ` +
      `Total: $${secureOrderTotal.toFixed(2)} | GST: $${taxTotal.toFixed(2)}`
    );

    return NextResponse.json({
      id: paypalOrder.id,
      wcOrderId: newOrder.id,
      wcOrderKey: newOrder.orderNumber,
    });

  } catch (error: unknown) {
    console.error('[PayPal Create Order Error]:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
