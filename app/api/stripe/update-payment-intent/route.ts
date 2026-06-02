// app/api/stripe/update-payment-intent/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ==========================================
// DYNAMIC STRIPE CREDENTIALS FROM DB
// ==========================================
async function getStripeInstance() {
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
    if (!gateway || !gateway.encryptedSecret) {
        throw new Error("Stripe is not configured or disabled in the admin panel.");
    }
    const secret = decrypt(gateway.encryptedSecret);
    return new Stripe(secret, { apiVersion: "2025-01-27.acacia" as any, typescript: true });
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
      appliedCoupons 
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

    // 🛡️ 1. Initialize Dynamic Stripe Instance
    const stripe = await getStripeInstance();

    const updateData: Stripe.PaymentIntentUpdateParams = {};

    if (amount && typeof amount === 'number' && amount > 0) {
      updateData.amount = Math.round(amount * 100);
    }
    
    const metadata: Record<string, string> = incomingMetadata ? { ...incomingMetadata } : {};

    if (orderId) {
      const order = await db.order.findUnique({ where: { id: orderId } });
      const orderNumber = order ? order.orderNumber : orderId;
      metadata.order_id = orderId;
      updateData.description = `Order #${orderNumber} for GoBike`; 
    }

    if (customerInfo) {
        metadata.customer_email = customerInfo.email || '';
        metadata.customer_name = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
        metadata.billing_json = JSON.stringify(customerInfo).substring(0, 499); 
    }

    if (shippingInfo) {
        metadata.shipping_json = JSON.stringify(shippingInfo).substring(0, 499);
    }
    
    if (cartItems && Array.isArray(cartItems)) {
        const simplifiedCart = cartItems.map(item => ({
            product_id: item.databaseId || item.id,
            quantity: item.quantity,
            variation_id: item.variationId || 0 
        }));
        metadata.cart_items_json = JSON.stringify(simplifiedCart).substring(0, 499);
    }

    if (appliedCoupons && Array.isArray(appliedCoupons) && appliedCoupons.length > 0) {
        const simplifiedCoupons = appliedCoupons.map(c => ({ code: c.code }));
        metadata.applied_coupons_json = JSON.stringify(simplifiedCoupons).substring(0, 499);
    }

    if (Object.keys(metadata).length > 0) {
        updateData.metadata = metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid data to update.' });
    }
    
    // 🛡️ 2. Update Payment Intent in Stripe
    await stripe.paymentIntents.update(paymentIntentId, updateData);
    
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("[UPDATE_PAYMENT_INTENT_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}