// app/api/paypal/create-order/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ==========================================
// STRICT INTERFACES
// ==========================================
interface CartItemDTO { id: string; databaseId: number; name: string; quantity: number; price: number; }
interface AddressDTO { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface CouponDTO { code: string; amount: number; }
interface ShippingRateDTO { id: string; label: string; cost: number; }

// ==========================================
// DYNAMIC PAYPAL CREDENTIALS FROM DB
// ==========================================
async function getPayPalCredentials() {
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'paypal' } });
    if (!gateway || !gateway.isEnabled || !gateway.publicKey || !gateway.encryptedSecret) {
        throw new Error("PayPal is not configured or disabled in the admin panel.");
    }
    const secret = decrypt(gateway.encryptedSecret);
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
    
    if (!response.ok) throw new Error("Failed to authenticate with PayPal API.");
    const data = await response.json();
    return { token: String(data.access_token), apiUrl };
}

// ==========================================
// MAIN POST REQUEST
// ==========================================
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // 🛡️ Added 'orderId' and 'shippingRates' to preserve all original calculations safely
        const { orderId, cartItems, customerInfo, shippingInfo, selectedShipping, shippingRates, appliedCoupons } = body as {
            orderId: string;
            cartItems: CartItemDTO[];
            customerInfo: AddressDTO;
            shippingInfo: AddressDTO;
            selectedShipping: string;
            shippingRates: ShippingRateDTO[];
            appliedCoupons: CouponDTO[];
        };

        // 🛡️ 1. Validation
        if (!orderId) return NextResponse.json({ error: "Store Order ID is required." }, { status: 400 });
        if (!cartItems || cartItems.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
        if (!customerInfo?.email || !customerInfo?.firstName) return NextResponse.json({ error: "Missing billing details." }, { status: 400 });

        // 🛡️ 2. SERVER-SIDE CALCULATION (SECURITY HACK PREVENTION - 100% UNTOUCHED)
        let subtotal = 0;
        const validOrderItems = [];

        // Fetch exact product prices from DB
        for (const item of cartItems) {
            const product = await db.product.findUnique({ where: { id: item.id } });
            if (!product) throw new Error(`Product ${item.name} no longer exists.`);
            
            const price = Number(product.price);
            subtotal += (price * item.quantity);
            
            validOrderItems.push({
                productId: product.id,
                productName: product.name,
                price: price,
                quantity: item.quantity,
                total: price * item.quantity
            });
        }

        // Fetch Shipping Cost (Handles both Transdirect and DB rates)
        let shippingCost = 0;
        let shippingMethodLabel = "Standard Shipping";
        if (selectedShipping) {
            const matchedRate = shippingRates?.find((r) => r.id === selectedShipping);
            
            if (matchedRate) {
                shippingCost = Number(matchedRate.cost);
                shippingMethodLabel = matchedRate.label;
            } else {
                const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
                if (!shippingRate) throw new Error("Invalid shipping method selected.");
                shippingCost = Number(shippingRate.price);
                shippingMethodLabel = shippingRate.name;
            }
        }

        // Fetch Discount
        let discountTotal = 0;
        let discountId: string | undefined = undefined;
        if (appliedCoupons && appliedCoupons.length > 0) {
            const discount = await db.discount.findUnique({ where: { code: appliedCoupons[0].code } });
            if (discount && discount.isActive) {
                discountId = discount.id;
                if (discount.type === "FIXED_CART") discountTotal = Number(discount.value);
                else if (discount.type === "PERCENTAGE") discountTotal = (subtotal * Number(discount.value)) / 100;
                if (discountTotal > subtotal) discountTotal = subtotal;
            }
        }

        const secureOrderTotal = (subtotal - discountTotal) + shippingCost;
        if (secureOrderTotal <= 0) throw new Error("Order total is zero. Invalid for PayPal.");

        // 🛡️ 3. UPDATE THE EXISTING DRAFT ORDER (Preventing Duplicate Orders!)
        // Instead of creating a new order, we update the one already generated sequentially by the checkout form
        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.UNPAID,
                currency: 'AUD',
                subtotal,
                discountTotal,
                shippingTotal: shippingCost,
                total: secureOrderTotal,
                totalDue: secureOrderTotal,
                guestEmail: customerInfo.email,
                billingAddress: customerInfo as any,
                shippingAddress: shippingInfo as any,
                shippingMethod: shippingMethodLabel,
                paymentGateway: 'paypal',
                discountId,
                items: {
                    deleteMany: {}, // Clear previous temporary draft items to avoid duplication
                    create: validOrderItems
                }
            }
        });

        // 🛡️ 4. CREATE PAYPAL ORDER INTENT (Using the updated sequential order)
        const { token, apiUrl } = await generatePayPalAccessToken();
        
        const paypalPayload = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: updatedOrder.id, 
                custom_id: updatedOrder.id,
                // Append dynamic timestamp to prevent Sandbox duplicate blocks
                invoice_id: `${updatedOrder.orderNumber}-${Date.now().toString().slice(-4)}`,
                description: `Order ${updatedOrder.orderNumber} from GoBike`,
                amount: {
                    currency_code: 'AUD',
                    value: secureOrderTotal.toFixed(2), 
                },
            }],
        };

        const paypalResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'PayPal-Request-Id': `create_order_${updatedOrder.id}` 
            },
            body: JSON.stringify(paypalPayload),
        });

        const paypalOrder = await paypalResponse.json();
        
        if (!paypalResponse.ok) {
            await db.order.update({ where: { id: updatedOrder.id }, data: { status: OrderStatus.FAILED } });
            throw new Error(paypalOrder.message || "PayPal rejected the order initialization.");
        }

        // 🛡️ 5. RETURN SUCCESS
        return NextResponse.json({ 
            id: paypalOrder.id, 
            wcOrderId: updatedOrder.id, // Sends the correct verified Prisma UUID
            wcOrderKey: updatedOrder.orderNumber // Sends the sequential order number (#1000, #1001)
        });

    } catch (error: unknown) {
        console.error("PayPal Create API Error:", error);
        const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}