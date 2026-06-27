// app/api/webhook/paypal/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';
import { resyncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';
import { sendNotification } from '@/app/api/email/send-notification';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const maxDuration = 60; 

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// DYNAMIC PAYPAL CONFIGURATION FROM DB
// ==========================================
async function getPayPalConfig() {
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'paypal' } });
    if (!gateway || !gateway.encryptedSecret) throw new Error("PayPal is not configured.");
    
    const secret = decrypt(gateway.encryptedSecret);
    const webhookId = gateway.encryptedWebhook ? decrypt(gateway.encryptedWebhook) : null;
    const apiUrl = gateway.mode === 'TEST' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    
    return { clientId: gateway.publicKey!, secret, webhookId, apiUrl };
}

async function generatePayPalAccessToken() {
    const { clientId, secret, apiUrl } = await getPayPalConfig();
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: { Authorization: `Basic ${auth}` },
    });
    const data = await response.json();
    return { token: String(data.access_token), apiUrl };
}

async function verifyPayPalWebhook(accessToken: string, reqBody: Record<string, unknown>, headersList: Headers, webhookId: string | null, apiUrl: string) {
    if (!webhookId) {
        console.warn("⚠️ PAYPAL_WEBHOOK_ID is missing in DB. Skipping signature verification (Not recommended).");
        return true;
    }

    const verificationBody = {
        auth_algo: headersList.get('paypal-auth-algo'),
        cert_url: headersList.get('paypal-cert-url'),
        transmission_id: headersList.get('paypal-transmission-id'),
        transmission_sig: headersList.get('paypal-transmission-sig'),
        transmission_time: headersList.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: reqBody
    };

    const response = await fetch(`${apiUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(verificationBody)
    });

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
}

export async function POST(request: Request) {
    let webhookEventId: string | undefined;
    try {
        const bodyText = await request.text();
        const event = JSON.parse(bodyText);
        const headersList = await headers();

        console.log(`🔔 [PayPal Webhook] Received Event: ${event.event_type}`);

        const { webhookId, apiUrl } = await getPayPalConfig();
        const { token } = await generatePayPalAccessToken();

        // 🛡️ 1. Signature Verification
        const isValid = await verifyPayPalWebhook(token, event, headersList, webhookId, apiUrl);
        if (!isValid) {
            console.error("❌ [PayPal Webhook] Invalid Signature.");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // 🛡️ 2. Log Webhook Event to DB
        webhookEventId = String(event.id);
        await db.paymentWebhookLog.upsert({
            where: { eventId: webhookEventId },
            update: { processed: false, processingError: null },
            create: {
                provider: 'paypal',
                eventId: webhookEventId,
                eventType: String(event.event_type),
                payload: event
            }
        });

        // 🛡️ 3. Process SCENARIO 1: CHECKOUT.ORDER.APPROVED (Frontend Rescue)
        if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
            const paypalOrderId = String(event.resource.id);
            const wcOrderId = String(event.resource.purchase_units?.[0]?.custom_id);

            if (!wcOrderId) return NextResponse.json({ message: "No Order ID found" }, { status: 200 });

            await sleep(10000); // Give frontend 10 seconds to finish first

            const order = await db.order.findUnique({
                where: { id: wcOrderId },
                include: { user: { select: { email: true } } },
            });
            if (order && (order.status === OrderStatus.PROCESSING || order.paymentStatus === PaymentStatus.PAID)) {
                // ✅ Backup: payment done but TransDirect not synced yet → resync
                if (order.transdirectOrderStatus !== 'booked') {
                    console.log(`🔄 [PayPal Webhook] Order ${wcOrderId} paid but not synced to TransDirect. Backup resync...`);
                    resyncOrderToTransdirect(wcOrderId).catch(err =>
                        console.error('[PayPal Webhook] Backup TransDirect resync failed:', err)
                    );
                }
                await db.paymentWebhookLog.update({ where: { eventId: String(event.id) }, data: { processed: true } });
                return NextResponse.json({ message: "Already processed" }, { status: 200 });
            }

            console.warn(`⏳ [Webhook] Frontend missed capture for Order ${wcOrderId}. Capturing now...`);

            const captureResponse = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'PayPal-Request-Id': `capture_order_${wcOrderId}_${paypalOrderId}` },
            });

            const captureData = await captureResponse.json();

            if (captureResponse.ok && captureData.status === 'COMPLETED') {
                const transactionId = String(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id);
                const capturedAmount = Number(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0);

                const rescueOrderItems = await db.orderItem.findMany({
                    where: { orderId: wcOrderId },
                    select: { productId: true, variantId: true, quantity: true },
                });

                await db.$transaction(async (tx) => {
                    await tx.order.update({ where: { id: wcOrderId }, data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID, paymentId: transactionId, totalPaid: capturedAmount, totalDue: 0 } });
                    await tx.orderTransaction.create({ data: { orderId: wcOrderId, gateway: 'paypal', type: TransactionType.SALE, amount: capturedAmount, transactionId, status: 'COMPLETED', rawResponse: captureData } });
                    await tx.orderNote.create({ data: { orderId: wcOrderId, content: `✅ Captured & Rescued via PayPal Webhook. TXN: ${transactionId}`, isSystem: true } });
                    for (const item of rescueOrderItems) {
                        if (item.variantId) {
                            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
                        } else if (item.productId) {
                            await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } } });
                        }
                    }
                });
                resyncOrderToTransdirect(wcOrderId).catch(err =>
                    console.error('[PayPal Webhook] Rescue TransDirect resync failed:', err)
                );

                // Email + Affiliate backup — duplicate-safe: order was PENDING before rescue,
                // so capture-order never ran these. Webhook retry → order is now PROCESSING → returns early above.
                const rescueEmail = order?.guestEmail || order?.user?.email;
                if (rescueEmail) {
                    sendNotification({ trigger: 'ORDER_PROCESSING', recipient: rescueEmail, orderId: wcOrderId })
                        .catch(err => console.error('[PayPal Webhook] Customer email failed:', err));
                }
                sendNotification({ trigger: 'ORDER_CREATED_ADMIN', recipient: '', orderId: wcOrderId })
                    .catch(err => console.error('[PayPal Webhook] Admin email failed:', err));

                if (process.env.INTERNAL_API_KEY) {
                    fetch(`${APP_URL}/api/affiliate/process-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY },
                        body: JSON.stringify({ orderId: wcOrderId }),
                    }).catch(err => console.error('[PayPal Webhook] Affiliate trigger failed:', err));
                }

                // Analytics backup — duplicate-safe: frontend missed capture so order was PENDING, not PROCESSING
                // Reuse rescueOrderItems (already fetched above); `order` has all totals from the initial query
                const rescueAnalyticsItems = await db.orderItem.findMany({
                    where: { orderId: wcOrderId },
                    select: { productId: true, quantity: true, total: true },
                });
                if (order && rescueAnalyticsItems.length > 0) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const sub = Number(order.subtotal);
                    const disc = Number(order.discountTotal);
                    const tax = Number(order.taxTotal);
                    const ship = Number(order.shippingTotal);
                    const totalSold = rescueAnalyticsItems.reduce((s, i) => s + i.quantity, 0);
                    Promise.allSettled([
                        db.analytics.upsert({
                            where: { date: today },
                            create: { date: today, grossSales: sub, netSales: sub - disc, totalTax: tax, totalShipping: ship, totalDiscounts: disc, totalOrders: 1, productsSold: totalSold, newCustomers: order.isFirstOrder ? 1 : 0, returningCustomers: order.isFirstOrder ? 0 : 1 },
                            update: { grossSales: { increment: sub }, netSales: { increment: sub - disc }, totalTax: { increment: tax }, totalShipping: { increment: ship }, totalDiscounts: { increment: disc }, totalOrders: { increment: 1 }, productsSold: { increment: totalSold }, newCustomers: { increment: order.isFirstOrder ? 1 : 0 }, returningCustomers: { increment: order.isFirstOrder ? 0 : 1 } },
                        }),
                        ...rescueAnalyticsItems.filter(i => !!i.productId).map(({ productId, quantity, total }) =>
                            db.productAnalytics.upsert({
                                where: { date_productId: { date: today, productId: productId! } },
                                create: { date: today, productId: productId!, itemsSold: quantity, netSales: Number(total) },
                                update: { itemsSold: { increment: quantity }, netSales: { increment: Number(total) } },
                            })
                        ),
                    ]).catch(err => console.error('[PayPal Webhook] Analytics rescue failed:', err));
                }
            }
        }

        // 🛡️ 4. Process SCENARIO 2: PAYMENT.CAPTURE.COMPLETED (DB Sync Fix)
        else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const transactionId = String(event.resource.id);
            const wcOrderId = String(event.resource.custom_id);
            const capturedAmount = Number(event.resource.amount?.value || 0);

            if (!wcOrderId) return NextResponse.json({ message: "No Order ID found" }, { status: 200 });

            const order = await db.order.findUnique({ where: { id: wcOrderId }, include: { user: { select: { email: true } } } });
            if (!order) return NextResponse.json({ message: "Order not found" }, { status: 200 });

            if (order.status === OrderStatus.PENDING || order.status === OrderStatus.FAILED) {
                const isMismatch = Math.abs(Number(order.total) - capturedAmount) > 0.05;

                const syncOrderItems = await db.orderItem.findMany({
                    where: { orderId: wcOrderId },
                    select: { productId: true, variantId: true, quantity: true, total: true },
                });

                await db.$transaction(async (tx) => {
                    await tx.order.update({ where: { id: wcOrderId }, data: { status: isMismatch ? OrderStatus.PENDING : OrderStatus.PROCESSING, paymentStatus: isMismatch ? PaymentStatus.AUTHORIZED : PaymentStatus.PAID, paymentId: transactionId, totalPaid: capturedAmount, totalDue: isMismatch ? Number(order.total) : 0 } });
                    await tx.orderTransaction.create({ data: { orderId: wcOrderId, gateway: 'paypal', type: TransactionType.SALE, amount: capturedAmount, transactionId, status: 'COMPLETED', rawResponse: event } });
                    await tx.orderNote.create({ data: { orderId: wcOrderId, content: `✅ Order updated via Webhook. TXN: ${transactionId}`, isSystem: true } });
                    if (!isMismatch) {
                        for (const item of syncOrderItems) {
                            if (item.variantId) {
                                await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
                            } else if (item.productId) {
                                await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } } });
                            }
                        }
                    }
                });
                if (!isMismatch) resyncOrderToTransdirect(wcOrderId).catch(err =>
                    console.error('[PayPal Webhook] TransDirect resync failed:', err)
                );

                // Email + Affiliate backup — only on clean capture (no mismatch)
                // Duplicate-safe: order was PENDING/FAILED → capture-order never sent these.
                if (!isMismatch) {
                    const syncEmail = order.guestEmail || order.user?.email;
                    if (syncEmail) {
                        sendNotification({ trigger: 'ORDER_PROCESSING', recipient: syncEmail, orderId: wcOrderId })
                            .catch(err => console.error('[PayPal Webhook] Customer email failed:', err));
                    }
                    sendNotification({ trigger: 'ORDER_CREATED_ADMIN', recipient: '', orderId: wcOrderId })
                        .catch(err => console.error('[PayPal Webhook] Admin email failed:', err));

                    if (process.env.INTERNAL_API_KEY) {
                        fetch(`${APP_URL}/api/affiliate/process-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY },
                            body: JSON.stringify({ orderId: wcOrderId }),
                        }).catch(err => console.error('[PayPal Webhook] Affiliate trigger failed:', err));
                    }
                }

                // Analytics backup — only runs when order was PENDING/FAILED (not already PROCESSING)
                if (!isMismatch) {
                    const syncItems = await db.orderItem.findMany({
                        where: { orderId: wcOrderId },
                        select: { productId: true, quantity: true, total: true },
                    });
                    if (syncItems.length > 0) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const sub = Number(order.subtotal);
                        const disc = Number(order.discountTotal);
                        const tax = Number(order.taxTotal);
                        const ship = Number(order.shippingTotal);
                        const totalSold = syncItems.reduce((s, i) => s + i.quantity, 0);
                        Promise.allSettled([
                            db.analytics.upsert({
                                where: { date: today },
                                create: { date: today, grossSales: sub, netSales: sub - disc, totalTax: tax, totalShipping: ship, totalDiscounts: disc, totalOrders: 1, productsSold: totalSold, newCustomers: order.isFirstOrder ? 1 : 0, returningCustomers: order.isFirstOrder ? 0 : 1 },
                                update: { grossSales: { increment: sub }, netSales: { increment: sub - disc }, totalTax: { increment: tax }, totalShipping: { increment: ship }, totalDiscounts: { increment: disc }, totalOrders: { increment: 1 }, productsSold: { increment: totalSold }, newCustomers: { increment: order.isFirstOrder ? 1 : 0 }, returningCustomers: { increment: order.isFirstOrder ? 0 : 1 } },
                            }),
                            ...syncItems.filter(i => !!i.productId).map(({ productId, quantity, total }) =>
                                db.productAnalytics.upsert({
                                    where: { date_productId: { date: today, productId: productId! } },
                                    create: { date: today, productId: productId!, itemsSold: quantity, netSales: Number(total) },
                                    update: { itemsSold: { increment: quantity }, netSales: { increment: Number(total) } },
                                })
                            ),
                        ]).catch(err => console.error('[PayPal Webhook] Analytics sync failed:', err));
                    }
                }
            }
        }

        // 🛡️ 5. Process SCENARIO 3: DENIED/DECLINED
        else if (event.event_type === 'PAYMENT.CAPTURE.DENIED' || event.event_type === 'PAYMENT.CAPTURE.DECLINED') {
            const wcOrderId = String(event.resource.custom_id);
            if (wcOrderId) {
                await db.order.update({ where: { id: wcOrderId }, data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID } });
                await db.orderNote.create({ data: { orderId: wcOrderId, content: `❌ Payment declined via Webhook.`, isSystem: true } });
            }
        }

        // Mark Webhook as Processed
        await db.paymentWebhookLog.update({ where: { eventId: String(event.id) }, data: { processed: true } });

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("❌ [PayPal Webhook Error]:", error);
        if (webhookEventId) {
            await db.paymentWebhookLog.update({
                where: { eventId: webhookEventId },
                data: { processingError: errMsg, retryCount: { increment: 1 } },
            }).catch(() => {});
        }
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}