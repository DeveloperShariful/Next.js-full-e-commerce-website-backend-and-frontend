// app/api/stripe/update-payment-intent/route.ts
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

interface CartItemDTO { id: string; databaseId?: number; quantity: number; variationId?: string; }
interface AddressDTO { firstName: string; lastName: string; email: string; }
interface CouponDTO { code: string; }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      paymentIntentId,
      amount,
      orderId,
      cartItems,
      customerInfo,
      shippingInfo,
      metadata: incomingMetadata,
      appliedCoupons,
    } = body as {
      paymentIntentId: string;
      amount?: number;
      orderId?: string;
      cartItems?: CartItemDTO[];
      customerInfo?: AddressDTO;
      shippingInfo?: AddressDTO;
      metadata?: Record<string, string>;
      appliedCoupons?: CouponDTO[];
    };

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing Payment Intent ID.' }, { status: 400 });
    }

    const stripe = await getStripeInstance();
    const updateData: Stripe.PaymentIntentUpdateParams = {};

    // ✅ SECURITY FIX: When orderId is present (order just created → about to charge),
    // always use DB amount — NEVER trust the frontend `amount` field.
    //
    // Attack scenario without this fix:
    //   1. User intercepts POST to /api/stripe/update-payment-intent
    //   2. Sends { paymentIntentId: "pi_xxx", amount: 0.01, orderId: "real-order-id" }
    //   3. PI gets updated to $0.01 → charge succeeds → order marked PAID
    //
    // With this fix:
    //   orderId provided → DB lookup → order.total used → frontend amount ignored.
    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { total: true, orderNumber: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      // Override with authoritative DB amount (in cents)
      updateData.amount = Math.round(Number(order.total) * 100);
      updateData.description = `Order #${order.orderNumber} for GoBike`;
    } else if (amount && typeof amount === 'number' && amount > 0) {
      // No orderId: early update (e.g., total changed from shipping selection before order).
      // Frontend amount accepted here since there's no order to validate against yet.
      // This PI amount will be overridden again when orderId is provided at submit.
      updateData.amount = Math.round(amount * 100);
    }

    // Build metadata
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
      const simplified = cartItems.map(item => ({
        product_id: item.databaseId || item.id,
        quantity: item.quantity,
        variation_id: item.variationId || 0,
      }));
      metadata.cart_items_json = JSON.stringify(simplified).substring(0, 499);
    }
    if (appliedCoupons && Array.isArray(appliedCoupons) && appliedCoupons.length > 0) {
      metadata.applied_coupons_json = JSON.stringify(
        appliedCoupons.map(c => ({ code: c.code }))
      ).substring(0, 499);
    }

    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes to apply.' });
    }

    await stripe.paymentIntents.update(paymentIntentId, updateData);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('[UPDATE_PAYMENT_INTENT_ERROR]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}