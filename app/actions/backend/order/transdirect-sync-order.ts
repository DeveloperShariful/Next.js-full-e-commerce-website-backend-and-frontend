// File: app/actions/order/transdirect-sync-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncOrderToTransdirect(orderId: string) {
  console.log(`\n🚀 [START] Syncing Order: ${orderId}`);

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true, 
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!order) return { success: false, error: "Order not found" };
    if (!config || !config.apiKey) return { success: false, error: "Transdirect API Key missing" };

    // ১. আইটেম ম্যাপ করা (TYPE Must be 'carton')
    const items = order.items.map(item => {
        // ওজনের ভ্যালিডেশন
        const weight = Number(item.product?.weight) > 0 ? Number(item.product?.weight) : 1;
        const length = Number(item.product?.length) > 0 ? Number(item.product?.length) : 10;
        const width = Number(item.product?.width) > 0 ? Number(item.product?.width) : 10;
        const height = Number(item.product?.height) > 0 ? Number(item.product?.height) : 10;

        return {
            description: "carton", // Transdirect demands simple description often
            weight,
            length,
            width,
            height,
            quantity: item.quantity,
            value: item.price,
            type: "carton" // ✅ RESTORED: Mandatory field
        };
    });

    // ২. ঠিকানা ক্লিন করা (Suburb থেকে State রিমুভ করা)
    const cleanSuburb = (text: string) => {
        if (!text) return "Unknown";
        // যদি কমা থাকে, তবে কমার আগের অংশ নিবে (e.g. "Camden South, NSW" -> "Camden South")
        return text.split(",")[0].trim();
    };

    const shipping: any = order.shippingAddress || {};
    
    // ফোন নাম্বারের ভ্যালিডেশন (স্পেস রিমুভ)
    const validPhone = (shipping.phone || order.user?.phone || config.senderPhone || "0400000000").replace(/\s/g, '');

    const receiver = {
      name: `${shipping.firstName || 'Guest'} ${shipping.lastName || ''}`.trim(),
      address: shipping.address1 || "1 Main St",
      suburb: cleanSuburb(shipping.city), // ✅ RESTORED: Clean Suburb logic
      postcode: shipping.postcode || "2000",
      state: shipping.state || "NSW",
      country: "AU",
      phone: validPhone,
      email: order.guestEmail || order.user?.email || "customer@example.com",
      type: "residential"
    };

    const sender = {
      name: config.senderName || "Store Admin",
      company_name: config.senderCompany || "My Store",
      address: config.senderAddress || "123 Street",
      suburb: cleanSuburb(config.senderSuburb || "Sydney"), // ✅ RESTORED: Clean Sender Suburb
      postcode: config.senderPostcode || "2000",
      state: config.senderState || "NSW",
      phone: (config.senderPhone || "0400000000").replace(/\s/g, ''),
      type: config.senderType || "business",
      country: "AU"
    };

    // ৩. API call — temp booking ID থাকলে confirm, না থাকলে নতুন booking
    const tempBookingId = order.transdirectQuoteId;
    console.log(`🔑 Temp booking ID: ${tempBookingId ?? "none — will create new"}`);
    console.log(`🚚 Courier: ${order.selectedCourierCode ?? "unknown"}`);
    console.log(`📍 Receiver suburb: ${receiver.suburb}, postcode: ${receiver.postcode}, state: ${receiver.state}`);
    console.log(`📍 Receiver address: ${receiver.address}`);
    console.log(`📞 Receiver phone: ${receiver.phone}`);

    let res: Response;

    if (tempBookingId) {
      // Confirm existing temp booking with selected courier
      const confirmPayload = {
        booked_courier: (order.selectedCourierCode || "").toUpperCase(),
        referrer: "GoBike System",
        sender,
        receiver,
        notifications: { email: true, sms: false }
      };
      console.log("📦 CONFIRM PAYLOAD:", JSON.stringify(confirmPayload, null, 2));
      res = await fetch(`https://www.transdirect.com.au/api/bookings/${tempBookingId}`, {
        method: "PUT",
        headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(confirmPayload)
      });
    } else {
      // No temp booking — create new order directly
      const newPayload = {
        order_id: order.orderNumber,
        referrer: "GoBike System",
        declared_value: order.total.toString(),
        items,
        sender,
        receiver,
        notifications: { email: true, sms: false }
      };
      console.log("📦 NEW ORDER PAYLOAD:", JSON.stringify(newPayload, null, 2));
      res = await fetch("https://www.transdirect.com.au/api/bookings", {
        method: "POST",
        headers: { "Api-Key": config.apiKey, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(newPayload)
      });
    }

    const responseData = await res.json();
    console.log(`📡 API STATUS: ${res.status}`);
    console.log(`📡 API RESPONSE:`, JSON.stringify(responseData, null, 2));

    if (!res.ok) {
      console.error("❌ TRANSDIRECT ERROR:", JSON.stringify(responseData));
      const errMsg = `TransDirect Failed (${res.status}): ${JSON.stringify(responseData)}`;

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

    // ৫. সফল — Booking ID, Label, Invoice URL সেভ + error clear
    await db.order.update({
        where: { id: orderId },
        data: {
            transdirectBookingId: responseData.id,
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