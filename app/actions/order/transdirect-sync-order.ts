// File: app/actions/transdirect/sync-order.ts

"use server";

import { db } from "@/lib/db";
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
            type: "carton" // ✅ FIX: This is mandatory
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
      suburb: cleanSuburb(shipping.city), // ✅ FIX: Clean Suburb
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
      suburb: cleanSuburb(config.senderSuburb || "Sydney"), // ✅ FIX: Clean Sender Suburb
      postcode: config.senderPostcode || "2000",
      state: config.senderState || "NSW",
      phone: (config.senderPhone || "0400000000").replace(/\s/g, ''),
      type: config.senderType || "business",
      country: "AU"
    };

    // ৩. পে-লোড তৈরি
    const payload = {
      order_id: order.orderNumber, 
      referrer: "GoBike System",
      declared_value: order.total.toString(),
      items: items,
      sender: sender,
      receiver: receiver,
      notifications: { email: true, sms: false }
    };

    console.log("📦 CLEAN PAYLOAD:", JSON.stringify(payload, null, 2));

    // ৪. API কল
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

    if (!res.ok) {
      console.error("❌ TRANSDIRECT ERROR:", JSON.stringify(responseData));
      // "No access to booking" বা "Duplicate" এরর হ্যান্ডলিং
      if (res.status === 500 && JSON.stringify(responseData).includes("No access")) {
          return { success: false, error: "Transdirect Error: Duplicate Order ID or Invalid Address format." };
      }
      return { success: false, error: `Transdirect Failed: ${JSON.stringify(responseData)}` };
    }

    // ৫. সফল
    await db.orderNote.create({
      data: {
        orderId: order.id,
        content: `Synced to Transdirect. ID: ${responseData.id}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Synced successfully!" };

  } catch (error: any) {
    console.error("SYNC_ERROR:", error);
    return { success: false, error: error.message };
  }
}