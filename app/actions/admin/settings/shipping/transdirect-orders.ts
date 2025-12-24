// File: app/actions/settings/shipping/transdirect-orders.ts

"use server";

import { db } from "@/lib/db";

export async function getTransdirectBookings() {
  console.log("🚀 STARTING TRANSDIRECT FETCH (RECOVERY MODE)...");

  try {
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.apiKey) {
      console.error("❌ API Key Missing");
      return { success: false, error: "API Key not found." };
    }

    const headers = {
      "Api-Key": config.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    // ✅ REVERTED LIMIT TO 100 (Safe Limit)
    // 1000 limit caused the API to crash/timeout.
    // If you need more, we have to implement pagination (Page 1, Page 2...)
    
    // 1. Fetch Bookings
    const bookingsPromise = fetch("https://www.transdirect.com.au/api/bookings?limit=100", {
      method: "GET",
      headers,
      cache: "no-store"
    });

    // 2. Fetch Orders
    const ordersPromise = fetch("https://www.transdirect.com.au/api/orders?limit=100", {
      method: "GET",
      headers,
      cache: "no-store"
    });

    const [bookingsRes, ordersRes] = await Promise.all([bookingsPromise, ordersPromise]);

    console.log(`📡 Bookings Status: ${bookingsRes.status}`);
    console.log(`📡 Orders Status: ${ordersRes.status}`);

    let bookingsData: any = null;
    let ordersData: any = null;

    if (bookingsRes.ok) bookingsData = await bookingsRes.json();
    else console.error("❌ Failed to fetch Bookings");

    if (ordersRes.ok) ordersData = await ordersRes.json();
    else console.error("❌ Failed to fetch Orders");

    // --- EXTRACTION ---
    let bookingsArray: any[] = [];
    if (bookingsData) {
        if (Array.isArray(bookingsData)) bookingsArray = bookingsData;
        else if (bookingsData.bookings) bookingsArray = bookingsData.bookings;
        else if (bookingsData.items) bookingsArray = bookingsData.items;
        else if (bookingsData.data) bookingsArray = bookingsData.data;
    }

    let ordersArray: any[] = [];
    if (ordersData) {
        if (Array.isArray(ordersData)) ordersArray = ordersData;
        else if (ordersData.orders) ordersArray = ordersData.orders;
        else if (ordersData.items) ordersArray = ordersData.items;
        else if (ordersData.data) ordersArray = ordersData.data;
    }

    console.log(`✅ Extracted: ${bookingsArray.length} Bookings, ${ordersArray.length} Orders`);

    // --- MAPPING ---
    const formattedBookings = bookingsArray.map((b: any) => ({
      id: b.id,
      // Reference Check
      reference: b.sender_reference || b.order_id || b.customer_reference || null,
      type: 'booking',
      date: b.booked_at || b.created_at || new Date().toISOString(),
      sender: b.sender?.name || b.sender_details?.name || "Unknown",
      sender_loc: b.sender?.suburb || b.sender_details?.suburb || "",
      receiver: b.receiver?.name || b.receiver_details?.name || "Unknown",
      receiver_loc: b.receiver?.suburb || b.receiver_details?.suburb || "",
      courier: b.courier || b.courier_name || "Courier",
      status: (b.status || "booked").toLowerCase(),
      tracking_url: `https://www.transdirect.com.au/track/${b.consignment_note || b.id}`
    }));

    const formattedOrders = ordersArray.map((o: any) => ({
      id: o.id,
      reference: o.order_id || o.sender_reference || o.reference || null,
      type: 'order',
      date: o.created_at || new Date().toISOString(),
      sender: o.sender?.name || o.sender_details?.name || o.pickup_address?.company_name || "Store",
      sender_loc: o.sender?.suburb || o.pickup_address?.suburb || "",
      receiver: o.receiver?.name || o.receiver_details?.name || o.delivery_address?.name || o.delivery_address?.contact_name || "Customer",
      receiver_loc: o.receiver?.suburb || o.delivery_address?.suburb || "",
      courier: o.courier || "Not Selected",
      status: (o.status || "pending").toLowerCase(),
      tracking_url: null
    }));

    const allShipments = [...formattedBookings, ...formattedOrders].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { success: true, bookings: allShipments };

  } catch (error) {
    console.error("🔥 FATAL ERROR:", error);
    return { success: false, error: "Failed to connect to Transdirect API." };
  }
}