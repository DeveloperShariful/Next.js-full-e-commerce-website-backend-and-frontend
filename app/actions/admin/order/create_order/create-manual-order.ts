// File Location: app/actions/order/create_order/create-manual-order.ts

"use server";

import { db } from "@/lib/prisma";
import { generateNextOrderNumber } from "@/app/actions/admin/order/create_order/generate-order-number";
import { updateAnalytics, sendOrderEmail, mul, sub, add } from "@/app/actions/admin/order/order-utils";

export async function createManualOrder(data: any) {
  try {
    const { 
      customerId, guestInfo, items, shippingCost, discountCode,
      giftCardCode, giftCardAmount, taxTotal, surcharge, total, 
      address, pickupLocationId, adminNote, customerNote, 
      status, paymentStatus, paymentMethod, estimatedTransitTime,
      isDraft
    } = data;

    const orderNumber = await generateNextOrderNumber();

    const order = await db.$transaction(async (tx) => {
        if (!isDraft) {
            for (const item of items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { stock: true, trackQuantity: true, backorderStatus: true, name: true }
                    });

                    if (product && product.trackQuantity) {
                        let available = product.stock;
                        
                        if (item.variantId) {
                            const variant = await tx.productVariant.findUnique({
                                where: { id: item.variantId },
                                select: { stock: true }
                            });
                            if (variant) available = variant.stock;
                        }

                        if (available < item.quantity && product.backorderStatus === 'DO_NOT_ALLOW') {
                            throw new Error(`Insufficient stock for ${product.name}. Available: ${available}`);
                        }

                        const inventory = await tx.inventoryLevel.findFirst({
                            where: { productId: item.productId, variantId: item.variantId || null }
                        });

                        if (inventory) {
                            await tx.inventoryLevel.update({
                                where: { id: inventory.id }, 
                                data: { quantity: { decrement: item.quantity } }
                            });
                        } else {
                            await tx.product.update({
                                where: { id: item.productId }, 
                                data: { stock: { decrement: item.quantity } }
                            });
                        }
                    }
                }
            }

            if (discountCode) {
                await tx.discount.update({
                    where: { code: discountCode }, data: { usedCount: { increment: 1 } }
                });
            }

            if (giftCardCode && giftCardAmount > 0) {
                await tx.giftCard.update({
                    where: { code: giftCardCode }, data: { balance: { decrement: giftCardAmount } }
                });
            }
        }

        const calculatedSubtotal = sub(
            sub(total, shippingCost),
            taxTotal
        );

        const newOrder = await tx.order.create({
            data: {
                orderNumber,
                userId: customerId || null,
                guestEmail: guestInfo?.email || null,
                status: isDraft ? "DRAFT" : (status || "PENDING"),
                paymentStatus: isDraft ? "UNPAID" : (paymentStatus || "UNPAID"),
                fulfillmentStatus: "UNFULFILLED",
                currency: data.currency || "AUD",
                
                subtotal: calculatedSubtotal,
                shippingTotal: shippingCost,
                taxTotal: taxTotal,
                discountTotal: data.discountAmount || 0,
                surcharge: surcharge || 0,
                total: total,
                
                paymentMethod: paymentMethod || "Manual",
                paymentGateway: "manual",

                shippingAddress: address || {},
                billingAddress: address || {},
                couponCode: discountCode,
                pickupLocationId: pickupLocationId || null,
                estimatedTransitTime: estimatedTransitTime || null,
                adminNote: adminNote,
                customerNote: customerNote,

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        variantId: item.variantId || null,
                        productName: item.name,
                        sku: item.sku,
                        image: item.image,
                        price: item.price,
                        quantity: item.quantity,
                        total: mul(item.price, item.quantity),
                        tax: item.tax || 0
                    }))
                }
            }
        });

        let finalAdminNote = adminNote ? `Admin: ${adminNote}` : "";
        if (giftCardCode) finalAdminNote += `\n[System]: Paid ${giftCardAmount} via Gift Card (${giftCardCode}).`;
        if (isDraft) finalAdminNote += `\n[System]: Saved as Draft.`;

        if (finalAdminNote) {
            await tx.orderNote.create({
                data: { orderId: newOrder.id, content: finalAdminNote.trim(), isSystem: true }
            });
        }

        return newOrder;
    });

    if (!isDraft) {
        await updateAnalytics(total);
        await sendOrderEmail(order.id, "ORDER_CREATED"); 
        await sendOrderEmail(order.id, "ORDER_CREATED_ADMIN");
    }

    return { success: true, orderId: order.id };

  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create order" };
  }
}