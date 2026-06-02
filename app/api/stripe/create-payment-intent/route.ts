// app/api/stripe/create-payment-intent/route.ts

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

interface CartItemDTO { id: string; databaseId?: number; quantity: number; variationId?: string; price?: string; }
interface AddressDTO { firstName: string; lastName: string; email: string; }
interface CouponDTO { code: string; }

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
      appliedCoupons 
    } = body as {
      amount: number;
      payment_method_types?: string[];
      metadata?: Record<string, string>;
      orderId?: string;
      cartItems?: CartItemDTO[];
      customerInfo?: AddressDTO;
      shippingInfo?: AddressDTO;
      appliedCoupons?: CouponDTO[];
    };

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 🛡️ 1. Initialize Dynamic Stripe Instance
    const stripe = await getStripeInstance();

    const intentOptions: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: 'aud',
    };

    if (payment_method_types && payment_method_types.length > 0) {
      intentOptions.payment_method_types = payment_method_types;
    } else {
      intentOptions.automatic_payment_methods = { enabled: true };
    }
    
    const metadata: Record<string, string> = incomingMetadata ? { ...incomingMetadata } : {};

    if (orderId) {
      // In Prisma, Order IDs are UUIDs. Fetching exact Order Number for display
      const order = await db.order.findUnique({ where: { id: orderId } });
      const orderNumber = order ? order.orderNumber : orderId;
      intentOptions.description = `Order #${orderNumber} for GoBike`;
      metadata.order_id = orderId;
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
            variation_id: item.variationId || 0,
            price: item.price
        }));
        metadata.cart_items_json = JSON.stringify(simplifiedCart).substring(0, 499);
    }

    if (appliedCoupons && Array.isArray(appliedCoupons) && appliedCoupons.length > 0) {
        const simplifiedCoupons = appliedCoupons.map(c => ({ code: c.code }));
        metadata.applied_coupons_json = JSON.stringify(simplifiedCoupons).substring(0, 499);
    }

    if (Object.keys(metadata).length > 0) {
      intentOptions.metadata = metadata;
    }

    // 🛡️ 2. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create(intentOptions);
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: unknown) { 
    console.error("[CREATE_PAYMENT_INTENT_ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}