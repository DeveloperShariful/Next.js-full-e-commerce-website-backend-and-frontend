// File: app/actions/order/transdirect-sync-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// RESYNC — Recalculate & Send (manual button in admin)
// Gets fresh quotes, picks cheapest courier, sends with unique order_id
// ============================================================================
export async function resyncOrderToTransdirect(orderId: string) {
  console.log(`\n🔄 [RESYNC] Order: ${orderId}`);

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });

    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!order) return { success: false, error: "Order not found" };
    if (!config || !config.apiKey) return { success: false, error: "Transdirect API Key missing" };

    // ✅ Already-booked guard — prevents double-sync
    if (order.transdirectOrderStatus === 'booked') {
      console.log(`✅ [TransDirect Resync] Order ${orderId} already booked. Skipping.`);
      return { success: true, message: "Already synced to TransDirect" };
    }

    const shipping: any = order.shippingAddress || {};

    const cleanSuburb = (text: string) => {
      if (!text) return "Unknown";
      return text.split(",")[0].trim().toUpperCase();
    };

    // Step 1: Get fresh quotes from /api/bookings/v4
    const quoteItems = order.items.map(item => ({
      weight:      Number(item.product?.weight)  > 0 ? Number(item.product?.weight)  : 1,
      height:      Number(item.product?.height)  > 0 ? Number(item.product?.height)  : 10,
      width:       Number(item.product?.width)   > 0 ? Number(item.product?.width)   : 10,
      length:      Number(item.product?.length)  > 0 ? Number(item.product?.length)  : 10,
      quantity:    item.quantity,
      description: "carton",
    }));

    const quotePayload = {
      declared_value: "0.00",
      items: quoteItems,
      sender: {
        postcode: config.senderPostcode || "2000",
        suburb:   (config.senderSuburb  || "Sydney").trim().toUpperCase(),
        type:     config.senderType     || "business",
        country:  "AU",
      },
      receiver: {
        postcode: String(shipping.postcode || "2000").trim(),
        suburb:   cleanSuburb(shipping.city || "Sydney"),
        type:     "residential",
        country:  "AU",
      },
    };

    console.log("📦 QUOTE PAYLOAD:", JSON.stringify(quotePayload, null, 2));

    const quoteRes = await fetch("https://www.transdirect.com.au/api/bookings/v4", {
      method:  "POST",
      headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
      body:    JSON.stringify(quotePayload),
    });

    const quoteData = await quoteRes.json();
    console.log("📡 QUOTE RESPONSE:", JSON.stringify(quoteData, null, 2));

    if (!quoteRes.ok || !quoteData.quotes || !quoteData.id) {
      const err = quoteData.message || `Quote API failed (${quoteRes.status})`;
      return { success: false, error: `Recalculation failed: ${err}` };
    }

    // Step 2: Pick cheapest courier
    const newTempBookingId: number = quoteData.id;
    let cheapestCourier = "";
    let cheapestCost    = Infinity;

    for (const [courierKey, quote] of Object.entries(quoteData.quotes as Record<string, any>)) {
      const cost = parseFloat(quote.total || "9999");
      if (cost < cheapestCost) {
        cheapestCost    = cost;
        cheapestCourier = courierKey;
      }
    }

    if (!cheapestCourier) return { success: false, error: "No couriers available for this route." };

    console.log(`✅ Cheapest courier: ${cheapestCourier} @ $${cheapestCost}`);

    // Step 3: Update DB with new temp booking ID + courier
    await db.order.update({
      where: { id: orderId },
      data: {
        transdirectQuoteId:   String(newTempBookingId),
        selectedCourierCode:  cheapestCourier,
        transdirectOrderStatus: null,
        transdirectError:       null,
      }
    });

    // Step 4: Unique order_id with random suffix — avoids "already exists" error
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transdirectOrderId = `${order.orderNumber}-S-R${randomSuffix}`;

    const validPhone = (shipping.phone || order.user?.phone || config.senderPhone || "0400000000").replace(/\s/g, '');

    const goodsList = order.items.map(item => {
      const sku = item.product?.productCode ? `P-${item.product.productCode}` : item.productName;
      return `${sku} x ${item.quantity}`;
    });

    const payload: Record<string, any> = {
      transdirect_order_id: newTempBookingId,
      order_id:             transdirectOrderId,
      goods_summary:        goodsList.join(', '),
      goods_dump:           goodsList[0] || 'Product',
      imported_from:        'WooCommerce',
      purchased_time:       order.createdAt.toISOString(),
      sale_price:           Number(order.total),
      selected_courier:     cheapestCourier,
      courier_price:        cheapestCost,
      paid_time:            new Date().toISOString(),
      buyer_name:           `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest',
      buyer_email:          order.guestEmail || order.user?.email || 'customer@example.com',
      delivery: {
        name:     `${shipping.firstName || 'Guest'} ${shipping.lastName || ''}`.trim(),
        email:    order.guestEmail || order.user?.email || 'customer@example.com',
        phone:    validPhone,
        address:  shipping.address1 || "1 Main St",
        suburb:   cleanSuburb(shipping.city),
        postcode: shipping.postcode || "2000",
        state:    shipping.state    || "NSW",
        country:  "AU",
      },
    };

    console.log("📦 ORDER PAYLOAD:", JSON.stringify(payload, null, 2));

    // Step 5: Send to /api/orders
    const res = await fetch("https://www.transdirect.com.au/api/orders", {
      method:  "POST",
      headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
      body:    JSON.stringify(payload),
    });

    const responseData = await res.json();
    console.log(`📡 ORDER STATUS: ${res.status}`);
    console.log(`📡 ORDER RESPONSE:`, JSON.stringify(responseData, null, 2));

    if (!res.ok) {
      const rawErr = JSON.stringify(responseData);
      const errMsg = `TransDirect Failed (${res.status}): ${rawErr}`;
      await db.order.update({
        where: { id: orderId },
        data: { transdirectOrderStatus: "failed", transdirectError: errMsg }
      });
      await db.orderNote.create({
        data: { orderId: order.id, content: `❌ Resync failed: ${errMsg}`, isSystem: true }
      });
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: false, error: errMsg };
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        transdirectBookingId:    responseData.id ? parseInt(String(responseData.id), 10) : null,
        transdirectOrderStatus:  "booked",
        transdirectLabelUrl:     responseData.label_url    || null,
        transdirectInvoiceUrl:   responseData.invoice_url  || null,
        transdirectBookingRef:   responseData.reference    || null,
        transdirectError:        null,
      }
    });

    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `✅ Resynced to Transdirect. New Booking ID: ${responseData.id}, Courier: ${cheapestCourier}, Order ID: ${transdirectOrderId}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: `Resynced! Booking ID: ${responseData.id}` };

  } catch (error: any) {
    console.error("RESYNC_ERROR:", error);
    const errMsg = error.message || "Unknown error";
    try {
      await db.order.update({
        where: { id: orderId },
        data: { transdirectOrderStatus: "failed", transdirectError: errMsg }
      });
    } catch (_) {}
    return { success: false, error: errMsg };
  }
}

export async function syncOrderToTransdirect(orderId: string) {
  console.log(`\n🚀 [START] Syncing Order: ${orderId}`);

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: { product: true }
        }
      }
    });

    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!order) return { success: false, error: "Order not found" };
    if (!config || !config.apiKey) return { success: false, error: "Transdirect API Key missing" };

    // ✅ Already-booked guard — prevents double-sync (capture + webhook rescue)
    if (order.transdirectOrderStatus === 'booked') {
      console.log(`✅ [TransDirect] Order ${orderId} already booked. Skipping.`);
      return { success: true, message: "Already synced to TransDirect" };
    }

    const shipping: any = order.shippingAddress || {};

    const cleanSuburb = (text: string) => {
      if (!text) return "Unknown";
      return text.split(",")[0].trim();
    };

    // Phone validation
    const validPhone = (shipping.phone || order.user?.phone || config.senderPhone || "0400000000").replace(/\s/g, '');

    // Goods summary from order items
    const goodsList = order.items.map(item => {
      const sku = item.product?.productCode ? `P-${item.product.productCode}` : item.productName;
      return `${sku} x ${item.quantity}`;
    });
    const goodsSummary = goodsList.join(', ');
    const goodsDump = goodsList[0] || order.items[0]?.productName || 'Product';

    // ✅ Unique order_id with "-S" suffix — avoids conflict with old WooCommerce order IDs
    const transdirectOrderId = `${order.orderNumber}-S`;

    const tempBookingId = order.transdirectQuoteId;
    const selectedCourier = (order.selectedCourierCode || "").toLowerCase();

    console.log(`🔑 Temp booking ID: ${tempBookingId ?? "none"}`);
    console.log(`🚚 Courier: ${selectedCourier || "unknown"}`);
    console.log(`📍 Receiver suburb: ${cleanSuburb(shipping.city)}, postcode: ${shipping.postcode}, state: ${shipping.state}`);
    console.log(`📍 Receiver address: ${shipping.address1}`);
    console.log(`📞 Receiver phone: ${validPhone}`);

    // ✅ Plugin-style payload — matches WooCommerce TransDirect plugin exactly
    const payload: Record<string, any> = {
      order_id:        transdirectOrderId,
      goods_summary:   goodsSummary,
      goods_dump:      goodsDump,
      imported_from:   'WooCommerce',
      purchased_time:  order.createdAt.toISOString(),
      sale_price:      Number(order.total),
      selected_courier: selectedCourier,
      courier_price:   Number(order.shippingTotal),
      paid_time:       new Date().toISOString(),
      buyer_name:      `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Guest',
      buyer_email:     order.guestEmail || order.user?.email || 'customer@example.com',
      delivery: {
        name:     `${shipping.firstName || 'Guest'} ${shipping.lastName || ''}`.trim(),
        email:    order.guestEmail || order.user?.email || 'customer@example.com',
        phone:    validPhone,
        address:  shipping.address1 || "1 Main St",
        suburb:   cleanSuburb(shipping.city),
        postcode: shipping.postcode || "2000",
        state:    shipping.state || "NSW",
        country:  "AU"
      }
    };

    // ✅ Link to temp booking ID if available (from /api/bookings/v4 at checkout)
    if (tempBookingId) {
      payload.transdirect_order_id = parseInt(tempBookingId, 10);
    }

    console.log("📦 PAYLOAD:", JSON.stringify(payload, null, 2));

    const res = await fetch("https://www.transdirect.com.au/api/orders", {
      method: "POST",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await res.json();
    console.log(`📡 API STATUS: ${res.status}`);
    console.log(`📡 API RESPONSE:`, JSON.stringify(responseData, null, 2));

    if (!res.ok) {
      console.error("❌ TRANSDIRECT ERROR:", JSON.stringify(responseData));
      const rawErr = JSON.stringify(responseData);
      const errMsg = rawErr.includes("No access") || rawErr.includes("already exists")
        ? `TransDirect Error: Order ID "${transdirectOrderId}" already exists in TransDirect.`
        : `TransDirect Failed (${res.status}): ${rawErr}`;

      await db.order.update({
        where: { id: orderId },
        data: { transdirectOrderStatus: "failed", transdirectError: errMsg }
      });
      await db.orderNote.create({
        data: { orderId: order.id, content: `❌ TransDirect booking failed: ${errMsg}`, isSystem: true }
      });
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: false, error: errMsg };
    }

    // ✅ Success — save booking ID and clear error
    await db.order.update({
      where: { id: orderId },
      data: {
        transdirectBookingId: responseData.id ? parseInt(String(responseData.id), 10) : null,
        transdirectOrderStatus: "booked",
        transdirectLabelUrl: responseData.label_url || null,
        transdirectInvoiceUrl: responseData.invoice_url || null,
        transdirectBookingRef: responseData.reference || null,
        transdirectError: null,
      }
    });

    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `✅ Synced to Transdirect. Booking ID: ${responseData.id}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Synced successfully!" };

  } catch (error: any) {
    console.error("SYNC_ERROR:", error);
    const errMsg = error.message || "Unknown error";
    try {
      await db.order.update({
        where: { id: orderId },
        data: { transdirectOrderStatus: "failed", transdirectError: errMsg }
      });
    } catch (_) {}
    return { success: false, error: errMsg };
  }
}
