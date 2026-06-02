// app/api/paypal/capture-order/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ==========================================
// DYNAMIC PAYPAL CREDENTIALS FROM DB
// ==========================================
async function getPayPalCredentials() {
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'paypal' } });
    if (!gateway) throw new Error("PayPal is not configured.");
    const secret = decrypt(gateway.encryptedSecret!);
    const apiUrl = gateway.mode === 'TEST' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
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
    
    if (!response.ok) throw new Error('Failed to generate PayPal access token');
    const data = await response.json();
    return { token: String(data.access_token), apiUrl };
}

export async function POST(request: Request) {
    try {
        const { paypalOrderId, wcOrderId } = await request.json() as { paypalOrderId: string; wcOrderId: string };

        if (!paypalOrderId || !wcOrderId) {
            return NextResponse.json({ error: "Missing required IDs" }, { status: 400 });
        }

        // 🛡️ 1. Race Condition Prevention (Prisma check)
        const order = await db.order.findUnique({ where: { id: wcOrderId } });
        
        if (!order) throw new Error("Order not found in database.");

        if (order.status === OrderStatus.PROCESSING || order.paymentStatus === PaymentStatus.PAID) {
            console.log(`[PayPal Capture] Order ${wcOrderId} is already paid. Skipping capture.`);
            return NextResponse.json({ success: true, status: 'COMPLETED', message: 'Payment already processed.' });
        }

        const { token, apiUrl } = await generatePayPalAccessToken();
        
        // 🛡️ 2. Capture with Idempotency
        const response = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'PayPal-Request-Id': `capture_order_${wcOrderId}_${paypalOrderId}` 
            },
        });

        const captureData = await response.json();
        let captureDetails: any = null;

        if (!response.ok) {
            const isAlreadyCaptured = captureData.details?.some((d: any) => d.issue === 'ORDER_ALREADY_CAPTURED');

            if (isAlreadyCaptured) {
                const getOrderRes = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedOrder = await getOrderRes.json();
                captureDetails = fetchedOrder.purchase_units?.[0]?.payments?.captures?.[0];
                if (!captureDetails) throw new Error("Could not retrieve capture details from PayPal.");
            } else {
                const isDeclined = captureData.details?.some((d: any) => d.issue === 'INSTRUMENT_DECLINED');
                
                // Update Order to Failed
                await db.order.update({ 
                    where: { id: wcOrderId }, 
                    data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID } 
                });

                return NextResponse.json({ 
                    success: false, 
                    status: 'FAILED', 
                    message: isDeclined ? "Card declined." : "Payment could not be captured." 
                });
            }
        } else {
            captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];
        }

        // 🛡️ 3. Safe Data Extraction
        const paymentStatus = String(captureDetails?.status || 'UNKNOWN'); 
        const transactionId = String(captureDetails?.id || paypalOrderId);
        const capturedAmount = parseFloat(captureDetails?.amount?.value || '0');

        // 🛡️ 4. Anti-Fraud Amount Validation
        const expectedAmount = Number(order.total);
        const isAmountMismatch = Math.abs(expectedAmount - capturedAmount) > 0.05;

        // 🛡️ 5. Status Mapping & Database Update
        let finalOrderStatus: OrderStatus = OrderStatus.PENDING;
        let finalPaymentStatus: PaymentStatus = PaymentStatus.UNPAID;
        let successResponse = false;
        let frontendMessage = '';
        let noteContent = '';

        if (isAmountMismatch) {
            finalOrderStatus = OrderStatus.PENDING; // Needs Admin Review
            finalPaymentStatus = PaymentStatus.AUTHORIZED; 
            successResponse = false;
            frontendMessage = 'Payment captured, but amount mismatched. Order is under review.';
            noteContent = `⚠️ Fraud Alert: PayPal captured $${capturedAmount}, but order total was $${expectedAmount}. Transaction ID: ${transactionId}.`;
        }
        else if (paymentStatus === 'COMPLETED') {
            finalOrderStatus = OrderStatus.PROCESSING;
            finalPaymentStatus = PaymentStatus.PAID;
            successResponse = true;
            frontendMessage = 'Payment successful.';
            noteContent = `✅ PayPal payment completed. Transaction ID: ${transactionId}.`;
        } 
        else if (paymentStatus === 'PENDING') {
            finalOrderStatus = OrderStatus.PENDING;
            finalPaymentStatus = PaymentStatus.AUTHORIZED; 
            successResponse = true; 
            frontendMessage = 'Payment is pending review by PayPal.';
            noteContent = `⏳ PayPal payment is PENDING. Transaction ID: ${transactionId}. Do not ship until cleared.`;
        } 
        else {
            finalOrderStatus = OrderStatus.FAILED;
            finalPaymentStatus = PaymentStatus.UNPAID;
            successResponse = false;
            frontendMessage = 'Payment was declined or failed.';
            noteContent = `❌ PayPal payment failed. Status: ${paymentStatus}. Transaction ID: ${transactionId}.`;
        }

        // 🛡️ 6. DATABASE TRANSACTIONS (Updating Order, Creating Log & Notes)
        await db.$transaction(async (tx) => {
            // Update Master Order
            await tx.order.update({
                where: { id: wcOrderId },
                data: {
                    status: finalOrderStatus,
                    paymentStatus: finalPaymentStatus,
                    paymentId: transactionId,
                    totalPaid: paymentStatus === 'COMPLETED' ? capturedAmount : 0,
                    totalDue: paymentStatus === 'COMPLETED' ? 0 : expectedAmount,
                }
            });

            // Log Transaction into ledger
            await tx.orderTransaction.create({
                data: {
                    orderId: wcOrderId,
                    gateway: 'paypal',
                    type: TransactionType.SALE,
                    amount: capturedAmount,
                    transactionId: transactionId,
                    status: paymentStatus,
                    rawResponse: captureData as any
                }
            });

            // Add Order Note for Admin
            await tx.orderNote.create({
                data: {
                    orderId: wcOrderId,
                    content: noteContent,
                    isSystem: true
                }
            });
        });

        return NextResponse.json({ 
            success: successResponse, 
            status: paymentStatus,
            message: frontendMessage,
            wcOrderId: order.id,
            wcOrderKey: order.orderNumber
        });

    } catch (error: unknown) {
        console.error("PayPal Capture API Error:", error);
        const msg = error instanceof Error ? error.message : "System error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}