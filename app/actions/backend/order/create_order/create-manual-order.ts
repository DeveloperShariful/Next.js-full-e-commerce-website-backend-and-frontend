// File Location: app/actions/backend/order/create_order/create-manual-order.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { generateNextOrderNumber } from "@/app/actions/backend/order/create_order/generate-order-number";
import { updateAnalytics, sendOrderEmail, mul } from "@/app/actions/backend/order/order-utils";
import type { CreateOrderPayload, CartItemType } from "@/app/(backend)/admin/orders/create/types";

export async function createManualOrder(data: CreateOrderPayload) {
  try {
    const {
      customerId, guestInfo, items, subtotal, shippingCost, shippingMethod,
      selectedCourierCode, discountCode, discountAmount, taxTotal, surcharge,
      total, address, pickupLocationId, adminNote, customerNote,
      status, paymentStatus, paymentMethod, currency, estimatedTransitTime,
      isDraft, giftCardCode, giftCardAmount
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

              if (available < item.quantity && product.backorderStatus === "DO_NOT_ALLOW") {
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
            where: { code: discountCode },
            data: { usedCount: { increment: 1 } }
          });
        }

        if (giftCardCode && giftCardAmount && giftCardAmount > 0) {
          await tx.giftCard.update({
            where: { code: giftCardCode },
            data: { balance: { decrement: giftCardAmount } }
          });
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: customerId || null,
          guestEmail: guestInfo?.email || null,
          status: (isDraft ? "DRAFT" : (status || "PENDING")) as OrderStatus,
          paymentStatus: (isDraft ? "UNPAID" : (paymentStatus || "UNPAID")) as PaymentStatus,
          fulfillmentStatus: "UNFULFILLED",
          currency: currency || "AUD",

          subtotal: subtotal,
          shippingTotal: shippingCost,
          shippingMethod: shippingMethod || null,
          selectedCourierCode: selectedCourierCode || null,
          taxTotal: taxTotal,
          discountTotal: discountAmount || 0,
          surcharge: surcharge || 0,
          total: total,

          paymentMethod: paymentMethod || "Manual",
          paymentGateway: "manual",

          shippingAddress: (address ?? {}) as unknown as Prisma.InputJsonValue,
          billingAddress: (address ?? {}) as unknown as Prisma.InputJsonValue,
          couponCode: discountCode || null,
          pickupLocationId: pickupLocationId || null,
          estimatedTransitTime: estimatedTransitTime || null,
          adminNote: adminNote || null,
          customerNote: customerNote || null,

          items: {
            create: items.map((item: CartItemType) => ({
              productId: item.productId || null,
              variantId: item.variantId || null,
              productName: item.name,
              sku: item.sku,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              total: mul(item.price, item.quantity),
              tax: 0
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
      // Only count analytics when payment is confirmed (avoid double-count with update-status.ts)
      if (paymentStatus === "PAID") {
        await updateAnalytics(total);
      }
      await sendOrderEmail(order.id, "ORDER_CREATED");
    }

    return { success: true, orderId: order.id };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return { success: false, error: message };
  }
}
