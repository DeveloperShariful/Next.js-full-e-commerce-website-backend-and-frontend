// File: app/actions/create_order/create-manual-order.ts

"use server";

import { db } from "@/lib/db";
import { generateNextOrderNumber } from "@/app/actions/admin/create_order/generate-order-number"; // 👈 নতুন ইমপোর্ট

export async function createManualOrder(data: any) {
  try {
    const { 
      customerId, 
      guestInfo, 
      items, 
      shippingCost, 
      discountCode,
      taxTotal, 
      surcharge,
      total, 
      address,
      pickupLocationId,
      adminNote,      // 👈 স্কিমা অনুযায়ী রিসিভ করা হচ্ছে
      customerNote,   // 👈 স্কিমা অনুযায়ী রিসিভ করা হচ্ছে
      status,         // 👈 স্কিমা অনুযায়ী
      paymentStatus   // 👈 স্কিমা অনুযায়ী
    } = data;

    // ✅ FIX: Generating Serial Order Number (e.g. #1001, #1002)
    const orderNumber = await generateNextOrderNumber();

    const order = await db.$transaction(async (tx) => {
        
        // ১. ইনভেন্টরি আপডেট
        for (const item of items) {
            const inventory = await tx.inventoryLevel.findFirst({
                where: {
                    productId: item.productId,
                    variantId: item.variantId || null,
                }
            });

            // স্টক চেক (অপশনাল, চাইলে অফ রাখতে পারেন)
            // if (inventory && inventory.quantity < item.quantity) {
            //     throw new Error(`Insufficient stock for ${item.name}`);
            // }

            if (inventory) {
                await tx.inventoryLevel.update({
                    where: { id: inventory.id },
                    data: { quantity: { decrement: item.quantity } }
                });
            } else {
                // যদি ইনভেন্টরি রেকর্ড না থাকে, তাহলে সরাসরি প্রোডাক্ট থেকে কমানো
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
        }

        // ২. কুপন আপডেট
        if (discountCode) {
            await tx.discount.update({
                where: { code: discountCode },
                data: { usedCount: { increment: 1 } }
            });
        }

        // ৩. অর্ডার তৈরি
        const newOrder = await tx.order.create({
            data: {
                orderNumber, // ✅ সুন্দর সিরিয়াল নাম্বার (#1001)
                userId: customerId || null,
                guestEmail: guestInfo?.email || null,
                
                status: status || "PENDING",
                paymentStatus: paymentStatus || "UNPAID",
                fulfillmentStatus: "UNFULFILLED",
                currency: "AUD",
                
                subtotal: total - shippingCost - taxTotal + (data.discountAmount || 0),
                shippingTotal: shippingCost,
                taxTotal: taxTotal,
                discountTotal: data.discountAmount || 0,
                surcharge: surcharge || 0,
                total: total,

                shippingAddress: address || {},
                billingAddress: address || {},
                
                couponCode: discountCode,
                pickupLocationId: pickupLocationId || null,
                
                adminNote: adminNote,
                customerNote: customerNote,

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        productName: item.name,
                        sku: item.sku,
                        image: item.image, // স্কিমাতে ইমেজ সেভ করার অপশন থাকলে
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                        tax: item.tax || 0
                    }))
                }
            }
        });

        // নোট অ্যাড করা (যদি থাকে)
        if (adminNote) {
            await tx.orderNote.create({
                data: {
                    orderId: newOrder.id,
                    content: `Admin Note: ${adminNote}`,
                    isSystem: false
                }
            });
        }

        return newOrder;
    });

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("CREATE_ORDER_ERROR:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}