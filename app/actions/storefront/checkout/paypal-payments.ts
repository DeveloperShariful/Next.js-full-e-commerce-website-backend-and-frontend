//File: app/actions/storefront/checkout/paypal-payments.ts

"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { calculateShippingServerSide } from "./get-shipping-rates";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { clearCart } from "../cart/clear-cart";
import { cookies } from "next/headers";
import { validateCoupon } from "./validate-coupon";

// --- Helper: Get Access Token ---
async function getPayPalAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store"
  });
  
  const data = await response.json();
  if (!data.access_token) throw new Error("Failed to get PayPal Access Token");
  return data.access_token;
}

// ==========================================
// 1. CREATE PAYPAL ORDER
// ==========================================
export async function createPayPalOrder(
  cartId: string, 
  shippingMethodId: string, 
  shippingAddress: any,
  couponCode?: string
) {
  try {
    const config = await db.paypalConfig.findFirst({
        where: { paymentMethod: { isEnabled: true } },
        include: { paymentMethod: true }
    });
    
    if (!config) throw new Error("PayPal is not currently accepting payments.");

    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const rawSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
    const clientSecret = rawSecret ? decrypt(rawSecret) : "";

    if (!clientId || !clientSecret) throw new Error("PayPal Configuration Error");

    // 🛡️ Calculate Totals Securely
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    let subtotal = 0;
    cart.items.forEach(item => {
        const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
        subtotal += price * item.quantity;
    });

    // Shipping
    let shippingCost = 0;
    if (shippingMethodId) {
       const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId);
       shippingCost = cost || 0;
    }

    // Discount
    let discount = 0;
    if (couponCode) {
        const couponRes = await validateCoupon(couponCode, cartId);
        if (couponRes.success && couponRes.discountAmount) {
            discount = couponRes.discountAmount;
        }
    }

    // Surcharge (If Enabled)
    let surcharge = 0;
    if (config.paymentMethod.surchargeEnabled) {
        if (config.paymentMethod.surchargeType === 'percentage') {
             surcharge = ((subtotal + shippingCost - discount) * Number(config.paymentMethod.surchargeAmount)) / 100;
        } else {
             surcharge = Number(config.paymentMethod.surchargeAmount);
        }
    }

    const total = (subtotal + shippingCost + surcharge - discount).toFixed(2);

    const accessToken = await getPayPalAccessToken(clientId!, clientSecret, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    // Create Order Payload
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: config.intent || "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "AUD",
            value: total,
            breakdown: {
                item_total: { currency_code: "AUD", value: subtotal.toFixed(2) },
                shipping: { currency_code: "AUD", value: shippingCost.toFixed(2) },
                handling: surcharge > 0 ? { currency_code: "AUD", value: surcharge.toFixed(2) } : undefined,
                discount: discount > 0 ? { currency_code: "AUD", value: discount.toFixed(2) } : undefined
            }
          },
          description: `Order from GoBike`,
          invoice_id: config.invoicePrefix ? `${config.invoicePrefix}${Date.now()}` : undefined
        }],
        application_context: {
            brand_name: config.brandName || "GoBike",
            landing_page: config.landingPage || "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "SET_PROVIDED_ADDRESS"
        }
      }),
    });

    const orderData = await response.json();
    
    if (orderData.status === "CREATED") {
        return { success: true, orderID: orderData.id };
    } else {
        console.error("PayPal Create Failed:", orderData);
        throw new Error("Failed to initialize PayPal.");
    }

  } catch (error: any) {
    console.error("PayPal Create Error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. CAPTURE PAYPAL ORDER
// ==========================================
export async function capturePayPalOrder(
  payPalOrderId: string, 
  cartId: string, 
  customerInfo: any, 
  shippingInfo: any, 
  shippingMethodId: string,
  couponCode?: string
) {
  try {
    const config = await db.paypalConfig.findFirst({ where: { paymentMethod: { isEnabled: true } } });
    if (!config) throw new Error("PayPal config missing");
    
    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const rawSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
    const clientSecret = rawSecret ? decrypt(rawSecret) : "";

    const accessToken = await getPayPalAccessToken(clientId!, clientSecret, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${payPalOrderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
    });

    const data = await response.json();

    if (data.status === "COMPLETED") {
        const captureId = data.purchase_units[0].payments.captures[0].id;
        const totalAmount = parseFloat(data.purchase_units[0].payments.captures[0].amount.value);

        // Fetch Cart for Final Database Order
        const cart = await db.cart.findUnique({ 
            where: { id: cartId },
            include: { items: { include: { product: true, variant: true } } }
        });
        if(!cart) throw new Error("Cart not found");

        // Calculate Breakdown for DB
        let subtotal = 0;
        cart.items.forEach(item => {
           const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
           subtotal += price * item.quantity;
        });

        // Calculate Discount
        let discountTotal = 0;
        if (couponCode) {
             const v = await validateCoupon(couponCode, cartId);
             if(v.success && v.discountAmount) discountTotal = v.discountAmount;
        }

        // Affiliate Check
        const cookieStore = await cookies();
        const affiliateSlug = cookieStore.get("affiliate_token")?.value;
        let affiliateId: string | null = null;
        if (affiliateSlug) {
            const affiliate = await db.affiliateAccount.findUnique({ where: { slug: affiliateSlug }, select: { id: true } });
            if (affiliate) affiliateId = affiliate.id;
        }

        const newOrder = await db.$transaction(async (tx) => {
            const count = await tx.order.count();
            const orderNumber = `ORD-${1000 + count + 1}`;

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: OrderStatus.PROCESSING,
                    paymentStatus: PaymentStatus.PAID,
                    paymentGateway: "PAYPAL",
                    paymentMethod: "PayPal Wallet",
                    paymentId: captureId,
                    capturedAt: new Date(),
                    
                    total: totalAmount,
                    subtotal: subtotal,
                    shippingTotal: (totalAmount - subtotal + discountTotal), // Rough estimate or recalculate
                    discountTotal: discountTotal,
                    couponCode: couponCode || null,

                    guestEmail: customerInfo.email,
                    billingAddress: customerInfo,
                    shippingAddress: shippingInfo,
                    shippingMethod: shippingMethodId,
                    
                    affiliateId: affiliateId,

                    items: {
                        create: cart.items.map(item => ({
                            productName: item.product.name,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: Number(item.variant?.price || item.product.price),
                            total: Number(item.variant?.price || item.product.price) * item.quantity
                        }))
                    },
                    transactions: {
                        create: {
                             gateway: "PAYPAL",
                             type: "SALE",
                             amount: totalAmount,
                             currency: "AUD",
                             transactionId: captureId,
                             status: "COMPLETED",
                             rawResponse: data
                        }
                    }
                }
            });

            // Stock Update
            for (const item of cart.items) {
                if (item.variantId && item.variant?.trackQuantity) {
                    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
                } else if (item.product.trackQuantity) {
                    await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
                }
            }
            
            // Coupon Usage Update
            if (couponCode) {
                 await tx.discount.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } });
            }

            return order;
        });

        await clearCart();
        
        // Trigger Affiliate (Async)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${appUrl}/api/affiliate/process-order`, {
             method: "POST", 
             headers: { "Content-Type": "application/json", "x-api-key": process.env.INTERNAL_API_KEY! },
             body: JSON.stringify({ orderId: newOrder.id })
        }).catch(err => console.error(err));

        return { success: true, orderId: newOrder.id };
    } 
    
    return { success: false, error: "Payment could not be captured." };

  } catch (error: any) {
    console.error("Capture Error:", error);
    return { success: false, error: error.message || "Failed to capture payment." };
  }
}