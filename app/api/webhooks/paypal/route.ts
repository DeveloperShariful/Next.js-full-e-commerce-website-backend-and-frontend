// app/api/webhook/paypal/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';
import { syncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';

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
        await db.paymentWebhookLog.upsert({
            where: { eventId: String(event.id) },
            update: { processed: false },
            create: {
                provider: 'paypal',
                eventId: String(event.id),
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

            const order = await db.order.findUnique({ where: { id: wcOrderId } });
            if (order && (order.status === OrderStatus.PROCESSING || order.paymentStatus === PaymentStatus.PAID)) {
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

                await db.$transaction([
                    db.order.update({ where: { id: wcOrderId }, data: { status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID, paymentId: transactionId, totalPaid: capturedAmount, totalDue: 0 } }),
                    db.orderTransaction.create({ data: { orderId: wcOrderId, gateway: 'paypal', type: TransactionType.SALE, amount: capturedAmount, transactionId, status: 'COMPLETED', rawResponse: captureData } }),
                    db.orderNote.create({ data: { orderId: wcOrderId, content: `✅ Captured & Rescued via PayPal Webhook. TXN: ${transactionId}`, isSystem: true } })
                ]);
                await syncOrderToTransdirect(wcOrderId);
            }
        }

        // 🛡️ 4. Process SCENARIO 2: PAYMENT.CAPTURE.COMPLETED (DB Sync Fix)
        else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const transactionId = String(event.resource.id);
            const wcOrderId = String(event.resource.custom_id);
            const capturedAmount = Number(event.resource.amount?.value || 0);

            if (!wcOrderId) return NextResponse.json({ message: "No Order ID found" }, { status: 200 });

            const order = await db.order.findUnique({ where: { id: wcOrderId } });
            if (!order) return NextResponse.json({ message: "Order not found" }, { status: 200 });

            if (order.status === OrderStatus.PENDING || order.status === OrderStatus.FAILED) {
                const isMismatch = Math.abs(Number(order.total) - capturedAmount) > 0.05;

                await db.$transaction([
                    db.order.update({ where: { id: wcOrderId }, data: { status: isMismatch ? OrderStatus.PENDING : OrderStatus.PROCESSING, paymentStatus: isMismatch ? PaymentStatus.AUTHORIZED : PaymentStatus.PAID, paymentId: transactionId, totalPaid: capturedAmount, totalDue: isMismatch ? Number(order.total) : 0 } }),
                    db.orderTransaction.create({ data: { orderId: wcOrderId, gateway: 'paypal', type: TransactionType.SALE, amount: capturedAmount, transactionId, status: 'COMPLETED', rawResponse: event } }),
                    db.orderNote.create({ data: { orderId: wcOrderId, content: `✅ Order updated via Webhook. TXN: ${transactionId}`, isSystem: true } })
                ]);
                if (!isMismatch) await syncOrderToTransdirect(wcOrderId);
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
        console.error("❌ [PayPal Webhook Error]:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}