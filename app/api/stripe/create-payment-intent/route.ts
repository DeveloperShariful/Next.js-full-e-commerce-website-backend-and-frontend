// app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ============================================================================
// DYNAMIC STRIPE CREDENTIALS FROM DB
// ============================================================================
async function getStripeInstance() {
  const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
  if (!gateway || !gateway.encryptedSecret) {
    throw new Error('Stripe is not configured in the Admin Panel.');
  }
  const secret = decrypt(gateway.encryptedSecret);
  return new Stripe(secret, { apiVersion: '2025-01-27.acacia' as any, typescript: true });
}

interface CartItemDTO {
  id: string;
  databaseId?: number;
  quantity: number;
  variationId?: string;
  price?: string;
}
interface AddressDTO {
  firstName: string;
  lastName: string;
  email: string;
}
interface CouponDTO {
  code: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amount,
      payment_method_types,
      metadata: incomingMetadata,
      orderId,
      cartItems,
      customerInfo,
      shippingInfo,
      appliedCoupons,
    } = body as {
      amount?: number;
      payment_method_types?: string[];
      metadata?: Record<string, string>;
      orderId?: string;
      cartItems?: CartItemDTO[];
      customerInfo?: AddressDTO;
      shippingInfo?: AddressDTO;
      appliedCoupons?: CouponDTO[];
    };

    // ✅ SECURITY FIX: When orderId is provided, fetch amount from DB — never trust frontend.
    // Before: `amount` came straight from the request body.
    //         A malicious user could POST { amount: 1 } → Stripe PI for $0.01.
    // After:  orderId present → DB lookup → use order.total.
    //         No orderId (initial PI on page load) → use frontend amount but validate range.
    let secureAmount: number;
    let orderDescription: string | undefined;

    if (orderId) {
      // orderId provided → authoritative amount comes from DB
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { total: true, orderNumber: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      secureAmount = Math.round(Number(order.total) * 100); // Convert to cents
      orderDescription = `Order #${order.orderNumber} for GoBike`;
    } else {
      // No orderId yet (initial PI for page load) — validate frontend amount
      if (!amount || typeof amount !== 'number') {
        return NextResponse.json({ error: 'Amount is required.' }, { status: 400 });
      }
      // Minimum $0.50 AUD (Stripe minimum), maximum $99,999.99
      if (amount < 50 || amount > 9_999_999) {
        return NextResponse.json(
          { error: 'Amount is out of the accepted range.' },
          { status: 400 }
        );
      }
      secureAmount = Math.round(amount); // already in cents from frontend
    }

    const stripe = await getStripeInstance();

    const intentOptions: Stripe.PaymentIntentCreateParams = {
      amount: secureAmount,
      currency: 'aud',
    };

    // ✅ Use automatic_payment_methods by default (supports Express + Card + BNPL in one PI).
    // Only restrict to specific types when explicitly requested (e.g., BNPL redirect flow).
    if (payment_method_types && payment_method_types.length > 0) {
      intentOptions.payment_method_types = payment_method_types;
    } else {
      intentOptions.automatic_payment_methods = { enabled: true };
    }

    if (orderDescription) {
      intentOptions.description = orderDescription;
    }

    // Build metadata (max 500 chars per value, max 50 keys)
    const metadata: Record<string, string> = incomingMetadata ? { ...incomingMetadata } : {};

    if (orderId) {
      metadata.order_id = orderId;
    }
    if (customerInfo) {
      metadata.customer_email = (customerInfo.email || '').substring(0, 499);
      metadata.customer_name = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim().substring(0, 499);
      metadata.billing_json = JSON.stringify(customerInfo).substring(0, 499);
    }
    if (shippingInfo) {
      metadata.shipping_json = JSON.stringify(shippingInfo).substring(0, 499);
    }
    if (cartItems && Array.isArray(cartItems)) {
      const simplifiedCart = cartItems.map(item => ({
        product_id: item.databaseId || item.id,
        quantity: item.quantity,
        variation_id: item.variationId || 0,
      }));
      metadata.cart_items_json = JSON.stringify(simplifiedCart).substring(0, 499);
    }
    if (appliedCoupons && Array.isArray(appliedCoupons) && appliedCoupons.length > 0) {
      metadata.applied_coupons_json = JSON.stringify(
        appliedCoupons.map(c => ({ code: c.code }))
      ).substring(0, 499);
    }

    if (Object.keys(metadata).length > 0) {
      intentOptions.metadata = metadata;
    }

    const paymentIntent = await stripe.paymentIntents.create(intentOptions);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: unknown) {
    console.error('[CREATE_PAYMENT_INTENT_ERROR]:', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}