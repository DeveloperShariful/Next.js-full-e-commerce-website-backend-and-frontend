// app/api/stripe/create-order/route.ts

import { NextResponse } from 'next/server';
import { db } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await auth();
    const userId = session?.user?.id || null;

    const { 
      cartItems, customerInfo, shippingInfo, selectedShipping, 
      shippingRates, appliedCoupons, orderNotes, selectedPaymentMethod 
    } = body;

    // ১. সার্ভার-সাইড টোটাল ক্যালকুলেশন (নিরাপত্তার জন্য)
    let subtotal = 0;
    cartItems.forEach((item: any) => {
      const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      subtotal += price * item.quantity;
    });

    const selectedRate = shippingRates.find((r: any) => r.id === selectedShipping);
    const shippingTotal = selectedRate ? parseFloat(selectedRate.cost) : 0;
    
    // ডিসকাউন্ট ক্যালকুলেশন (কুপন লজিক পরে অ্যাড করা যাবে)
    const discountTotal = 0; 
    const total = (subtotal + shippingTotal) - discountTotal;

    // ২. ইউনিক অর্ডার নাম্বার জেনারেট করা (যেমন: GB-1001)
    const lastOrder = await db.order.findFirst({ 
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    });
    
    let nextId = 1001;
    if (lastOrder && lastOrder.orderNumber.startsWith("GB-")) {
        const lastId = parseInt(lastOrder.orderNumber.replace("GB-", ""));
        if (!isNaN(lastId)) nextId = lastId + 1;
    }
    const orderNumber = `GB-${nextId}`;

    // ৩. ডাটাবেজ ট্রানজেকশনে অর্ডার সেভ করা
    const newOrder = await db.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          orderNumber: orderNumber,
          userId: userId,
          guestEmail: !userId ? customerInfo.email : null,
          status: "PENDING",
          paymentStatus: "UNPAID",
          fulfillmentStatus: "UNFULFILLED",
          currency: "AUD",
          subtotal: subtotal,
          shippingTotal: shippingTotal,
          discountTotal: discountTotal,
          total: total,
          paymentGateway: "stripe", // যেহেতু এটি Stripe API Route
          paymentMethod: selectedPaymentMethod,
          shippingAddress: shippingInfo,
          billingAddress: customerInfo,
          customerNote: orderNotes,
          items: {
            create: cartItems.map((item: any) => ({
              productId: item.id,
              productName: item.name,
              variantId: item.variationId || null,
              sku: item.sku || null,
              price: parseFloat(item.price.replace(/[^0-9.]/g, '')),
              quantity: item.quantity,
              total: parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity,
              image: item.image
            }))
          },
          orderNotes: {
            create: { content: "Order created in pending state. Awaiting Stripe payment.", isSystem: true }
          }
        }
      });
    });

    return NextResponse.json({
        success: true,
        wcOrderId: newOrder.id, // আপনার আগের ফ্রন্টএন্ড কোডের সাথে মিল রেখে আইডি পাঠানো হলো
        wcOrderKey: `order_key_${newOrder.id}_${Date.now()}`,
        status: newOrder.status
    });

  } catch (error: any) {
    console.error("STRIPE_CREATE_ORDER_API_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order in database." },
      { status: 500 }
    );
  }
}