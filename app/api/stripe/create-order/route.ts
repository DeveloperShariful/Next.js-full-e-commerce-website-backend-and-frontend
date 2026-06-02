// app/api/stripe/create-order/route.ts

// app/api/stripe/create-order/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// ==========================================
// STRICT INTERFACES
// ==========================================
interface CartItemDTO { id: string; databaseId?: number; name: string; quantity: number; price?: string; variationId?: string; }
interface AddressDTO { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface CouponDTO { code: string; amount?: number; }
interface MetaDataDTO { key: string; value: string; }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cartItems, 
      customerInfo, 
      shippingInfo, 
      selectedShipping, 
      appliedCoupons, 
      orderNotes,
      selectedPaymentMethod, 
      affiliateMetaData 
    } = body as {
        cartItems: CartItemDTO[];
        customerInfo: AddressDTO;
        shippingInfo: AddressDTO;
        selectedShipping: string;
        appliedCoupons: CouponDTO[];
        orderNotes: string;
        selectedPaymentMethod: string;
        affiliateMetaData: MetaDataDTO[];
    };

    // 🛡️ 1. Validation
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Cannot create order." }, { status: 400 });
    }
    if (!customerInfo || !customerInfo.email || !customerInfo.firstName) {
      return NextResponse.json({ error: "Billing details (Name and Email) are required." }, { status: 400 });
    }

    // 🛡️ 2. Payment Method Title formatting
    let paymentMethodTitle = 'Credit / Debit Card (Stripe)';
    if (selectedPaymentMethod === 'stripe_klarna') paymentMethodTitle = 'Klarna';
    if (selectedPaymentMethod === 'stripe_afterpay_clearpay') paymentMethodTitle = 'Afterpay / Clearpay';
    if (selectedPaymentMethod === 'stripe_zip') paymentMethodTitle = 'Zip Pay';

    // 🛡️ 3. SERVER-SIDE CALCULATION (SECURITY HACK PREVENTION)
    let subtotal = 0;
    const validOrderItems = [];

    for (const item of cartItems) {
        const product = await db.product.findUnique({ where: { id: item.id } });
        if (!product) throw new Error(`Product missing or unavailable.`);
        
        let price = Number(product.price);
        
        // Handle Variant Price if variationId exists
        if (item.variationId) {
            const variant = await db.productVariant.findUnique({ where: { id: item.variationId } });
            if (variant) price = Number(variant.price);
        }

        subtotal += (price * item.quantity);
        
        validOrderItems.push({
            productId: product.id,
            variantId: item.variationId || null,
            productName: product.name,
            price: price,
            quantity: item.quantity,
            total: price * item.quantity
        });
    }

    // Fetch Shipping Cost dynamically from DB
    let shippingCost = 0;
    let shippingMethodLabel = "Standard Shipping";
    if (selectedShipping) {
        const shippingRate = await db.shippingRate.findUnique({ where: { id: selectedShipping } });
        if (shippingRate) {
            shippingCost = Number(shippingRate.price);
            shippingMethodLabel = shippingRate.name;
        }
    }

    // Fetch Discount dynamically from DB
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
    if (secureOrderTotal <= 0) throw new Error("Order total must be greater than zero.");

    // 🛡️ 4. Build Metadata safely
    const metaDataArray = Array.isArray(affiliateMetaData) ? [...affiliateMetaData] : [];
    metaDataArray.push({ key: '_stripe_payment_method', value: selectedPaymentMethod || 'stripe' });
    metaDataArray.push({ key: '_created_via', value: 'Headless_Stripe_Create_Order_API' });

    // 🛡️ 5. Create the Order in Prisma DB
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await db.order.create({
        data: {
            orderNumber,
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
            paymentGateway: selectedPaymentMethod,
            discountId,
            customerNote: orderNotes,
            metadata: metaDataArray as any,
            items: {
                create: validOrderItems
            }
        }
    });

    if (!newOrder || !newOrder.id) {
      throw new Error("Failed to create pending order in Database.");
    }

    console.log(`✅ [Stripe Create Order] Pending Order Created. Order ID: ${newOrder.id}`);
      
    // 🛡️ 6. Return Data to Frontend
    return NextResponse.json({
      success: true,
      wcOrderId: newOrder.id, // Prisma UUID
      wcOrderKey: newOrder.orderNumber, // Secure key mapping
      status: newOrder.status 
    });

  } catch (error: unknown) {
    console.error("❌ [Stripe Create Order API Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create draft order before payment.";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}