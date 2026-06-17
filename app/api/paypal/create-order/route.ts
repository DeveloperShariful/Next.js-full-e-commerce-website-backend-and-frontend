// app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TaxStatus } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ============================================================================
// INTERFACES
// ============================================================================
interface CartItemDTO {
  id: string;
  databaseId: number;
  name: string;
  quantity: number;
  price: number;
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
interface CouponDTO { code: string; amount: number; }
interface ShippingRateDTO { id: string; label: string; cost: number; }

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
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { Authorization: `Basic ${auth}` },
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
      orderId,
      cartItems,
      customerInfo,
      shippingInfo,
      selectedShipping,
      shippingRates,
      appliedCoupons,
    } = body as {
      orderId: string;
      cartItems: CartItemDTO[];
      customerInfo: AddressDTO;
      shippingInfo: AddressDTO;
      selectedShipping: string;
      shippingRates: ShippingRateDTO[];
      appliedCoupons: CouponDTO[];
    };

    if (!orderId) return NextResponse.json({ error: 'Store Order ID is required.' }, { status: 400 });
    if (!cartItems || cartItems.length === 0) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    if (!customerInfo?.email || !customerInfo?.firstName) return NextResponse.json({ error: 'Missing billing details.' }, { status: 400 });

    const country = customerInfo.country || 'AU';
    const couponCode = appliedCoupons?.[0]?.code;

    // ✅ PERF: Parallel DB lookups
    const [rawProductResults, discountRecord, activeTaxRate] = await Promise.all([
      Promise.all(
        cartItems.map(async (item) => {
          const product = await db.product.findUnique({
            where: { id: item.id },
            select: { id: true, name: true, price: true, taxStatus: true },
          });
          return { item, product };
        })
      ),
      couponCode ? db.discount.findUnique({ where: { code: couponCode } }) : Promise.resolve(null),
      db.taxRate.findFirst({ where: { country, isActive: true } }),
    ]);

    // Build order items + subtotal (server-side prices — not trusting frontend)
    let subtotal = 0;
    const validOrderItems: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      total: number;
      taxStatus: TaxStatus;
    }> = [];

    for (const { item, product } of rawProductResults) {
      if (!product) throw new Error(`Product '${item.name}' no longer exists.`);
      const price = Number(product.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      validOrderItems.push({
        productId: product.id,
        productName: product.name,
        price,
        quantity: item.quantity,
        total: itemTotal,
        taxStatus: product.taxStatus,
      });
    }

    // Shipping cost
    let shippingCost = 0;
    let shippingMethodLabel = 'Standard Shipping';
    if (selectedShipping) {
      const matchedRate = shippingRates?.find(r => r.id === selectedShipping);
      if (matchedRate) {
        shippingCost = Number(matchedRate.cost);
        shippingMethodLabel = matchedRate.label;
      } else {
        const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
        if (!shippingRate) throw new Error('Invalid shipping method selected.');
        shippingCost = Number(shippingRate.price);
        shippingMethodLabel = shippingRate.name;
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

    // GST (tax-inclusive prices — extract amount)
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

    const billingJson = JSON.parse(JSON.stringify(customerInfo));
    const shippingJson = JSON.parse(JSON.stringify(shippingInfo || customerInfo));
    const dbOrderItems = validOrderItems.map(({ taxStatus: _ts, ...rest }) => rest);

    // Update order with server-verified amounts (replaces placeholder from stripe/create-order)
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
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
        billingAddress: billingJson,
        shippingAddress: shippingJson,
        shippingMethod: shippingMethodLabel,
        paymentGateway: 'paypal',
        paymentMethod: 'PayPal',
        discountId,
        items: { deleteMany: {}, create: dbOrderItems },
      },
    });

    // ✅ FIX: Removed two bugs that caused double-application:
    //
    // BUG 1 — Double coupon usedCount increment:
    //   stripe/create-order ALREADY increments usedCount when the order is first created.
    //   paypal/create-order was incrementing again → coupon quota consumed 2× per order.
    //   Fix: removed the usedCount increment from this route entirely.
    //
    // BUG 2 — Double stock decrement:
    //   stripe/create-order ALREADY decrements stock when the order is first created.
    //   paypal/create-order was decrementing again → stock went negative on PayPal orders.
    //   Fix: removed stock decrement from this route.
    //   Stock is now managed solely by the capture route (paypal/capture-order)
    //   and the initial stripe/create-order call.
    //
    // NOTE: stripe/create-order has the same premature-decrement issue (stock reduced before
    //   payment is confirmed). That route should be updated separately to use
    //   InventoryReservation at creation and only hard-decrement at payment capture.

    const { token, apiUrl } = await generatePayPalAccessToken();

    // Build PayPal items for the payment popup
    const paypalItems = validOrderItems.map(({ productName, price, quantity }) => ({
      name: productName.slice(0, 127),
      quantity: String(quantity),
      unit_amount: { currency_code: 'AUD', value: price.toFixed(2) },
    }));

    const paypalPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: updatedOrder.id,
        custom_id: updatedOrder.id,
        invoice_id: `${updatedOrder.orderNumber}-${Date.now().toString().slice(-4)}`,
        description: `Order ${updatedOrder.orderNumber} from GoBike`,
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
        'PayPal-Request-Id': `create_order_${updatedOrder.id}`,
      },
      body: JSON.stringify(paypalPayload),
    });

    const paypalOrder = await paypalResponse.json();

    if (!paypalResponse.ok) {
      await db.order.update({ where: { id: updatedOrder.id }, data: { status: OrderStatus.FAILED } });
      throw new Error(paypalOrder.message || 'PayPal rejected the order initialization.');
    }

    console.log(
      `✅ [PayPal Create Order] #${updatedOrder.orderNumber} | ` +
      `Total: $${secureOrderTotal.toFixed(2)} | GST: $${taxTotal.toFixed(2)}`
    );

    return NextResponse.json({
      id: paypalOrder.id,
      wcOrderId: updatedOrder.id,
      wcOrderKey: updatedOrder.orderNumber,
    });

  } catch (error: unknown) {
    console.error('[PayPal Create Order Error]:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}