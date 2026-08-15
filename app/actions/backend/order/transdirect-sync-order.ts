// File: app/actions/order/transdirect-sync-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ShippingMethodType } from "@prisma/client";

// ============================================================================
// QUEUE HELPER — marks order as "queued" for cron backup
// ============================================================================
export async function queueTransdirectSync(orderId: string) {
  try {
    await db.order.updateMany({
      where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
      data: { transdirectOrderStatus: 'queued', transdirectError: null },
    });
  } catch (err) {
    console.error('[TransdirectQueue] Failed to queue order:', err);
  }
}

// ============================================================================
// QUEUE + IMMEDIATE SYNC — queues for cron backup, then tries sync right away.
// Called from capture-order and webhooks (fire-and-forget from callers).
// ============================================================================
export async function queueAndSyncTransdirect(orderId: string, source: string) {
  // Local pickup orders don't need shipping — skip entirely.
  // Wrapped in try/catch: this is purely an early-exit optimization — if the
  // lookup itself fails (e.g. transient DB error), fall through to the normal
  // flow below instead of throwing. syncOrderToTransdirect has its own
  // LOCAL_PICKUP guard, so pickup orders still get caught correctly there.
  try {
    const orderShipType = await db.order.findUnique({
      where: { id: orderId },
      select: { shippingType: true },
    });
    if (orderShipType?.shippingType === ShippingMethodType.LOCAL_PICKUP) {
      console.log(`[TDSync] Skipping local pickup order ${orderId} — no Transdirect sync needed`);
      return;
    }
  } catch (err) {
    console.error(`[TDSync] Shipping-type lookup failed for order ${orderId} (continuing anyway):`, err);
  }

  // Step 1: Mark as queued so cron picks it up if this sync fails
  try {
    await db.order.updateMany({
      where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
      data: { transdirectOrderStatus: 'queued', transdirectError: null },
    });
  } catch (err) {
    console.error(`[TDSync] Failed to queue order ${orderId}:`, err);
    return;
  }

  // Step 2: Try to sync immediately
  const result = await syncOrderToTransdirect(orderId, source);

  if (!result.success) {
    // syncOrderToTransdirect already wrote the failure note with source.
    // Re-queue so cron picks it up for retry.
    await db.order.updateMany({
      where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
      data: { transdirectOrderStatus: 'queued' },
    }).catch(err => console.error(`[TDSync] Re-queue failed for ${orderId}:`, err));
  }
}

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
      declared_value: Number(order.subtotal),
      items: quoteItems,
      sender: {
        postcode: config.senderPostcode || "2000",
        suburb:   (config.senderSuburb  || "Sydney").split(',')[0].trim().toUpperCase(),
        type:     (config.senderType    || "business").toLowerCase(),
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

    if (!responseData.id) {
      const rawResponse = JSON.stringify(responseData).substring(0, 500);
      console.error(`❌ [TransDirect Resync] HTTP 200 but no booking ID. Response: ${rawResponse}`);
      const errMsg = `TransDirect returned HTTP 200 but no booking ID. Raw: ${rawResponse}`;
      await db.order.update({
        where: { id: orderId },
        data: { transdirectOrderStatus: "failed", transdirectError: errMsg }
      });
      await db.orderNote.create({
        data: { orderId: order.id, content: `❌ Resync failed: No booking ID returned. Please try again.`, isSystem: true }
      });
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: false, error: errMsg };
    }

    const resyncBookingIdInt = parseInt(String(responseData.id), 10);
    await db.order.update({
      where: { id: orderId },
      data: {
        transdirectBookingId:    resyncBookingIdInt,
        transdirectOrderStatus:  "booked",
        transdirectLabelUrl:     responseData.label_url    || null,
        transdirectInvoiceUrl:   responseData.invoice_url  || null,
        transdirectBookingRef:   responseData.reference    || null,
        transdirectError:        null,
      }
    });

    // ✅ Auto-create/update Shipment record so it appears in Admin Shipments page
    const existingResyncShipment = await db.shipment.findFirst({ where: { orderId } });
    const resyncShipmentItems = order.items.map(i => ({ productName: i.productName, quantity: i.quantity }));
    if (existingResyncShipment) {
      await db.shipment.update({
        where: { id: existingResyncShipment.id },
        data: {
          courier:         cheapestCourier,
          transdirectId:   resyncBookingIdInt,
          labelUrl:        responseData.label_url   || null,
          invoiceUrl:      responseData.invoice_url || null,
          syncedToGateway: true,
          lastSyncedAt:    new Date(),
        }
      });
    } else {
      await db.shipment.create({
        data: {
          orderId,
          courier:         cheapestCourier,
          transdirectId:   resyncBookingIdInt,
          labelUrl:        responseData.label_url   || null,
          invoiceUrl:      responseData.invoice_url || null,
          items:           resyncShipmentItems,
          shippedDate:     new Date(),
          syncedToGateway: true,
          lastSyncedAt:    new Date(),
        }
      });
    }

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

export async function syncOrderToTransdirect(orderId: string, source: string = 'cron') {
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

    // Local pickup — customer collects in store, no shipping needed
    if (order.shippingType === ShippingMethodType.LOCAL_PICKUP) {
      console.log(`✅ [TransDirect] Order ${orderId} is local pickup — skipping sync`);
      return { success: true, message: "Local pickup — no Transdirect sync needed" };
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

    let tempBookingId = order.transdirectQuoteId;
    let selectedCourier = (order.selectedCourierCode || "").toLowerCase();

    // ── Self-healing: no courier saved (e.g. free shipping via PayPal/Bank Transfer) ──
    // Fetch fresh quotes and pick the cheapest so sync can proceed without admin action.
    if (!selectedCourier) {
      console.log(`[TDSync] No courier code for order ${orderId} — fetching fresh quotes`);
      const quoteItems = order.items.map(item => ({
        weight:      Number(item.product?.weight)  > 0 ? Number(item.product?.weight)  : 1,
        height:      Number(item.product?.height)  > 0 ? Number(item.product?.height)  : 10,
        width:       Number(item.product?.width)   > 0 ? Number(item.product?.width)   : 10,
        length:      Number(item.product?.length)  > 0 ? Number(item.product?.length)  : 10,
        quantity:    item.quantity,
        description: "carton",
      }));
      const quotePayload = {
        declared_value: Number(order.subtotal),
        items: quoteItems,
        sender: {
          postcode: config.senderPostcode || "2000",
          suburb:   (config.senderSuburb || "Sydney").split(',')[0].trim().toUpperCase(),
          type:     (config.senderType || "business").toLowerCase(),
          country:  "AU",
        },
        receiver: {
          postcode: String(shipping.postcode || "2000").trim(),
          suburb:   cleanSuburb(shipping.city || "Sydney").toUpperCase(),
          type:     "residential",
          country:  "AU",
        },
      };
      try {
        const quoteRes = await fetch("https://www.transdirect.com.au/api/bookings/v4", {
          method:  "POST",
          headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
          body:    JSON.stringify(quotePayload),
        });
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          if (quoteData.quotes && quoteData.id) {
            let cheapestCourier = "";
            let cheapestCost    = Infinity;
            for (const [courierKey, quote] of Object.entries(quoteData.quotes as Record<string, any>)) {
              const cost = parseFloat((quote as any).total || "9999");
              if (cost < cheapestCost) { cheapestCost = cost; cheapestCourier = courierKey; }
            }
            if (cheapestCourier) {
              tempBookingId    = String(quoteData.id);
              selectedCourier  = cheapestCourier.toLowerCase();
              // Save to DB so cron retries don't re-fetch
              await db.order.update({
                where: { id: orderId },
                data: { transdirectQuoteId: tempBookingId, selectedCourierCode: selectedCourier },
              });
              console.log(`[TDSync] Auto-selected cheapest courier: ${selectedCourier} @ $${cheapestCost}`);
            }
          }
        }
      } catch (qErr) {
        console.error(`[TDSync] Fresh quote fetch failed for order ${orderId}:`, qErr);
      }
    }

    // ── Free-shipping courier price fix ──
    // Transdirect returns [] with HTTP 200 when courier_price is 0.
    // Customer paid $0 (free/promotional shipping), but Transdirect still needs the
    // REAL courier cost. Fast path: reuse the price already quoted at checkout time
    // (saved in order.metadata by create-order) — no extra API call, no added latency.
    let courierPrice = Number(order.shippingTotal);
    if (courierPrice === 0 && selectedCourier) {
      const metaArr = Array.isArray(order.metadata)
        ? (order.metadata as unknown as Array<{ key: string; value: string }>)
        : [];
      const savedPrice = parseFloat(metaArr.find(m => m?.key === '_td_courier_price')?.value ?? '');

      if (!isNaN(savedPrice) && savedPrice > 0) {
        courierPrice = savedPrice;
        console.log(`[TDSync] Free shipping — using checkout-quoted courier price: $${courierPrice} (no API call)`);
      } else {
        // Fallback: no saved price (e.g. old order) — fetch a fresh quote.
        // declared_value must match the real order value, or Transdirect may silently
        // refuse to convert the temp booking into a real order for high-value parcels.
        console.log(`[TDSync] Free shipping — no saved price, fetching actual courier cost for "${selectedCourier}"`);
        try {
          const priceRes = await fetch("https://www.transdirect.com.au/api/bookings/v4", {
            method:  "POST",
            headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              declared_value: Number(order.subtotal),
              items: order.items.map(item => ({
                weight:      Number(item.product?.weight)  > 0 ? Number(item.product?.weight)  : 1,
                height:      Number(item.product?.height)  > 0 ? Number(item.product?.height)  : 10,
                width:       Number(item.product?.width)   > 0 ? Number(item.product?.width)   : 10,
                length:      Number(item.product?.length)  > 0 ? Number(item.product?.length)  : 10,
                quantity:    item.quantity,
                description: "carton",
              })),
              sender: {
                postcode: config.senderPostcode || "2000",
                suburb:   (config.senderSuburb || "Sydney").split(',')[0].trim().toUpperCase(),
                type:     (config.senderType || "business").toLowerCase(),
                country:  "AU",
              },
              receiver: {
                postcode: String(shipping.postcode || "2000").trim(),
                suburb:   cleanSuburb(shipping.city || "Sydney").toUpperCase(),
                type:     "residential",
                country:  "AU",
              },
            }),
          });
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            if (priceData.quotes && priceData.id) {
              const quotes = priceData.quotes as Record<string, any>;
              const quote  = quotes[selectedCourier];
              if (quote?.total) {
                courierPrice  = parseFloat(quote.total);
                tempBookingId = String(priceData.id);
                await db.order.update({ where: { id: orderId }, data: { transdirectQuoteId: tempBookingId } });
                console.log(`[TDSync] Actual courier cost: $${courierPrice} (${selectedCourier})`);
              } else {
                // Preferred courier unavailable in fresh quotes — fall back to cheapest available
                let bestKey = "", bestCost = Infinity;
                for (const [key, q] of Object.entries(quotes)) {
                  const cost = parseFloat((q as any).total || "9999");
                  if (cost < bestCost) { bestCost = cost; bestKey = key; }
                }
                if (bestKey) {
                  courierPrice    = bestCost;
                  selectedCourier = bestKey.toLowerCase();
                  tempBookingId   = String(priceData.id);
                  await db.order.update({ where: { id: orderId }, data: { transdirectQuoteId: tempBookingId, selectedCourierCode: selectedCourier } });
                  console.log(`[TDSync] Courier unavailable — switched to cheapest: ${selectedCourier} @ $${courierPrice}`);
                }
              }
            }
          }
        } catch (priceErr) {
          console.error(`[TDSync] Could not fetch courier price for free-shipping order ${orderId}:`, priceErr);
        }
      }
    }

    console.log(`🔑 Temp booking ID: ${tempBookingId ?? "none"}`);
    console.log(`🚚 Courier: ${selectedCourier || "unknown"}`);
    console.log(`💰 Courier price: $${courierPrice} (customer paid: $${order.shippingTotal})`);
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
      courier_price:   courierPrice,
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

      await db.order.updateMany({
        where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
        data: { transdirectOrderStatus: 'failed', transdirectError: errMsg },
      });
      await db.orderNote.create({
        data: { orderId: order.id, content: `❌ TransDirect sync failed via ${source}: ${errMsg}`, isSystem: true }
      });
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: false, error: errMsg };
    }

    // Guard: 200 OK but no booking ID — TransDirect duplicate or API change
    if (!responseData.id) {
      const rawResponse = JSON.stringify(responseData).substring(0, 500);
      console.error(`❌ [TransDirect] HTTP 200 but no booking ID. Response: ${rawResponse}`);
      const errMsg = `TransDirect returned HTTP 200 but no booking ID. Raw: ${rawResponse}`;
      await db.order.updateMany({
        where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
        data: { transdirectOrderStatus: 'failed', transdirectError: errMsg },
      });
      await db.orderNote.create({
        data: { orderId: order.id, content: `❌ TransDirect sync failed via ${source}: No booking ID returned. Use "Recalculate & Send" to retry.`, isSystem: true }
      });
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: false, error: errMsg };
    }

    // ✅ Success — save booking ID and clear error
    const bookingIdInt = parseInt(String(responseData.id), 10);
    await db.order.update({
      where: { id: orderId },
      data: {
        transdirectBookingId: bookingIdInt,
        transdirectOrderStatus: "booked",
        transdirectLabelUrl: responseData.label_url || null,
        transdirectInvoiceUrl: responseData.invoice_url || null,
        transdirectBookingRef: responseData.reference || null,
        transdirectError: null,
      }
    });

    // ✅ Auto-create Shipment record so it appears in Admin Shipments page
    const existingShipment = await db.shipment.findFirst({ where: { orderId } });
    const shipmentItems = order.items.map(i => ({ productName: i.productName, quantity: i.quantity }));
    if (existingShipment) {
      await db.shipment.update({
        where: { id: existingShipment.id },
        data: {
          courier:          selectedCourier,
          transdirectId:    bookingIdInt,
          labelUrl:         responseData.label_url  || null,
          invoiceUrl:       responseData.invoice_url || null,
          syncedToGateway:  true,
          lastSyncedAt:     new Date(),
        }
      });
    } else {
      await db.shipment.create({
        data: {
          orderId,
          courier:         selectedCourier,
          transdirectId:   bookingIdInt,
          labelUrl:        responseData.label_url  || null,
          invoiceUrl:      responseData.invoice_url || null,
          items:           shipmentItems,
          shippedDate:     new Date(),
          syncedToGateway: true,
          lastSyncedAt:    new Date(),
        }
      });
    }

    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `✅ Synced to Transdirect via ${source}. Booking ID: ${responseData.id}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Synced successfully!" };

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('SYNC_ERROR:', errMsg);
    await Promise.allSettled([
      db.order.updateMany({
        where: { id: orderId, transdirectOrderStatus: { not: 'booked' } },
        data: { transdirectOrderStatus: 'failed', transdirectError: errMsg },
      }),
      db.orderNote.create({
        data: { orderId, content: `❌ TransDirect sync failed via ${source}: ${errMsg}`, isSystem: true }
      }),
    ]);
    return { success: false, error: errMsg };
  }
}
