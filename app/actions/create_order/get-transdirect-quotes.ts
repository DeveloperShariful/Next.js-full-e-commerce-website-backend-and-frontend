// File: app/actions/create_order/get-transdirect-quotes.ts

"use server";

import { db } from "@/lib/db";

interface QuoteParams {
  items: any[];
  receiver: {
    postcode: string;
    suburb: string;
    state: string;
    type?: string;
  };
}

export async function getTransdirectQuotes({ items, receiver }: QuoteParams) {
  console.log("\n🚀 [START] Transdirect Quote Request");

  try {
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.apiKey) {
      console.error("❌ ERROR: Transdirect API Key Missing");
      return { success: false, quotes: [] };
    }

    // ১. আইটেম প্রস্তুত করা (FIXED)
    const formattedItems = items.map(item => {
        const weight = Number(item.weight) > 0 ? Number(item.weight) : 1;
        const length = Number(item.length) > 0 ? Number(item.length) : 10;
        const width = Number(item.width) > 0 ? Number(item.width) : 10;
        const height = Number(item.height) > 0 ? Number(item.height) : 10;

        return {
            weight,
            length,
            width,
            height,
            quantity: Number(item.quantity) || 1,
            // ✅ FIX: Transdirect expects packaging type here (e.g., "carton", "pallet")
            // "Cart Item" is not a valid packaging type for their API.
            description: "carton", 
            type: "carton" 
        };
    });

    // ২. সেন্ডার ডাটা ক্লিন করা
    let cleanSenderSuburb = config.senderSuburb || "Sydney";
    if (cleanSenderSuburb.includes(",")) {
        cleanSenderSuburb = cleanSenderSuburb.split(",")[0].trim();
    }

    const sender = {
      country: "AU",
      postcode: config.senderPostcode || "2000",
      suburb: cleanSenderSuburb, 
      type: config.senderType || "business"
    };

    // ৩. রিসিভার ডাটা
    const receiverData = {
      country: "AU",
      postcode: receiver.postcode,
      suburb: receiver.suburb,
      type: "residential"
    };

    const payload = {
      declared_value: "100", 
      items: formattedItems,
      sender,
      receiver: receiverData
    };

    console.log("📤 PAYLOAD SENT:", JSON.stringify(payload, null, 2));

    // ৪. API কল (/api/quotes)
    const res = await fetch("https://www.transdirect.com.au/api/quotes", {
      method: "POST",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    console.log(`📡 API STATUS: ${res.status}`);

    const textResponse = await res.text(); 
    
    if (!res.ok) {
        console.error("❌ ERROR RESPONSE:", textResponse);
        return { success: false, quotes: [] };
    }

    // Parse Response
    let data;
    try {
        data = JSON.parse(textResponse);
    } catch (e) {
        console.error("❌ JSON PARSE ERROR");
        return { success: false, quotes: [] };
    }

    const quotesObj = data.quotes || {};
    
    const quotesList = Object.keys(quotesObj).map(key => {
        const q = quotesObj[key];
        return {
            id: `transdirect_${key}`,
            name: q.service_name || key, 
            price: Number(q.total),
            transit_time: q.transit_time,
            type: "transdirect",
            service_code: key
        };
    });

    console.log(`✅ SUCCESS: Received ${quotesList.length} quotes`);
    return { success: true, quotes: quotesList };

  } catch (error) {
    console.error("🔥 FATAL ERROR:", error);
    return { success: false, quotes: [] };
  }
}