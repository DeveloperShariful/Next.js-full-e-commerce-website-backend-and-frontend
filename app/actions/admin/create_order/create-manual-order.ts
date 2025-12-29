// File Location: app/actions/create_order/create-manual-order.ts

"use server";

import { db } from "@/lib/db";
import { generateNextOrderNumber } from "@/app/actions/admin/create_order/generate-order-number";
import { updateAnalytics, sendOrderEmail } from "@/app/actions/admin/order/order-utils";

export async function createManualOrder(data: any) {
  console.log("🚀 [START] Creating Manual Order..."); // LOG 1

  try {
    const { 
      customerId, guestInfo, items, shippingCost, discountCode,
      giftCardCode, giftCardAmount, taxTotal, surcharge, total, 
      address, pickupLocationId, adminNote, customerNote, 
      status, paymentStatus, estimatedTransitTime
    } = data;

    const orderNumber = await generateNextOrderNumber();
    console.log(`📝 Generated Order Number: ${orderNumber}`); // LOG 2

    const order = await db.$transaction(async (tx) => {
        
        // ১. ইনভেন্টরি আপডেট
        for (const item of items) {
            const inventory = await tx.inventoryLevel.findFirst({
                where: { productId: item.productId, variantId: item.variantId || null }
            });

            if (inventory) {
                await tx.inventoryLevel.update({
                    where: { id: inventory.id }, data: { quantity: { decrement: item.quantity } }
                });
            } else {
                await tx.product.update({
                    where: { id: item.productId }, data: { stock: { decrement: item.quantity } }
                });
            }
        }

        // ২. কুপন আপডেট
        if (discountCode) {
            await tx.discount.update({
                where: { code: discountCode }, data: { usedCount: { increment: 1 } }
            });
        }

        // ৩. গিফট কার্ড ব্যালেন্স আপডেট
        if (giftCardCode && giftCardAmount > 0) {
            await tx.giftCard.update({
                where: { code: giftCardCode }, data: { balance: { decrement: giftCardAmount } }
            });
        }

        // ৪. অর্ডার তৈরি
        const newOrder = await tx.order.create({
            data: {
                orderNumber,
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
                estimatedTransitTime: estimatedTransitTime || null,
                adminNote: adminNote,
                customerNote: customerNote,

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        productName: item.name,
                        sku: item.sku,
                        image: item.image,
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                        tax: item.tax || 0
                    }))
                }
            }
        });

        // ৫. নোট যোগ করা
        let finalAdminNote = adminNote ? `Admin: ${adminNote}` : "";
        if (giftCardCode) finalAdminNote += `\n[System]: Paid $${giftCardAmount} via Gift Card (${giftCardCode}).`;

        if (finalAdminNote) {
            await tx.orderNote.create({
                data: { orderId: newOrder.id, content: finalAdminNote.trim(), isSystem: false }
            });
        }

        return newOrder;
    });

    console.log(`✅ [SUCCESS] Order Created: ${order.id}`); // LOG 3

    // ৬. অটোমেশন
    // Analytics
    console.log("📊 Updating Analytics...");
    await updateAnalytics(total);

    // B. Customer Email (Order Confirmation)
    console.log("📧 Triggering Customer Email: ORDER_CREATED"); 
    await sendOrderEmail(order.id, "ORDER_CREATED"); 

    // C. Admin Email (New Order Alert) - ✅ NEW ADDITION
    console.log("📧 Triggering Admin Email: ORDER_CREATED_ADMIN"); 
    await sendOrderEmail(order.id, "ORDER_CREATED_ADMIN");
    return { success: true, orderId: order.id };

  } catch (error: any) {
    console.error("🔥 [ERROR] Create Manual Order Failed:", error); // ERROR LOG
    return { success: false, error: error.message || "Failed to create order" };
  }
}