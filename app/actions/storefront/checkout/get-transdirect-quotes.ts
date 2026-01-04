// File: app/actions/storefront/checkout/get-transdirect-quotes.ts
"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"; // Decrypt যদি লাগে

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

    // ১. কনফিগারেশন এবং API কী চেক
    if (!config || !config.isEnabled || !config.apiKey) {
      console.error("❌ ERROR: Transdirect API Key Missing or Disabled");
      return { success: false, quotes: [] };
    }
    
    // নোট: আপনার অ্যাডমিন প্যানেল যদি প্লেইন টেক্সট সেভ করে থাকে, তাহলে decrypt বাদ দিন।
    // আর যদি এনক্রিপ্ট করে থাকে, তাহলে নিচের লাইনটি আনকমেন্ট করুন:
    // const apiKey = decrypt(config.apiKey);
    const apiKey = config.apiKey; 

    // ২. আইটেম প্রস্তুত করা (FIXED)
    const formattedItems = items.map(item => {
        // ভ্যালু ভ্যালিডেশন (যাতে নেগেটিভ বা ০ না যায়)
        const weight = Number(item.weight) > 0 ? Number(item.weight) : 0.5;
        const length = Number(item.length) > 0 ? Number(item.length) : 10;
        const width = Number(item.width) > 0 ? Number(item.width) : 10;
        const height = Number(item.height) > 0 ? Number(item.height) : 10;

        return {
            weight,
            length,
            width,
            height,
            quantity: Number(item.quantity) || 1,
            // ✅ FIX: Transdirect expects specific packaging type
            description: "carton", 
            type: "carton" 
        };
    });

    // ৩. সেন্ডার ডাটা ক্লিন করা
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

    // ৪. রিসিভার ডাটা
    const receiverData = {
      country: "AU",
      postcode: receiver.postcode,
      suburb: receiver.suburb,
      type: receiver.type || "residential"
    };

    const payload = {
      declared_value: config.defaultDeclaredValue ? "100" : "10", 
      items: formattedItems,
      sender,
      receiver: receiverData
    };

    console.log("📤 PAYLOAD SENT:", JSON.stringify(payload, null, 2));

    // ৫. API কল (/api/quotes)
    const res = await fetch("https://www.transdirect.com.au/api/quotes", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      next: { revalidate: 0 }
    });

    console.log(`📡 API STATUS: ${res.status}`);

    const textResponse = await res.text(); 
    
    if (!res.ok) {
        console.error("❌ ERROR RESPONSE:", textResponse);
        return { success: false, quotes: [] };
    }

    // ৬. Parse Response
    let data;
    try {
        data = JSON.parse(textResponse);
    } catch (e) {
        console.error("❌ JSON PARSE ERROR");
        return { success: false, quotes: [] };
    }

    const quotesObj = data.quotes || {};
    
    // ৭. কোট ফরম্যাটিং
    const quotesList = Object.keys(quotesObj).map(key => {
        const q = quotesObj[key];
        return {
            id: `transdirect_${key}`,
            name: q.service_name || key, 
            carrier: q.service_name, // Carrier name for UI
            price: Number(q.total),
            transit_time: q.transit_time,
            type: "transdirect",
            service_code: key,
            meta: {
                carrier_id: q.carrier_id,
                service_type: key
            }
        };
    }).sort((a, b) => a.price - b.price); // কম দাম আগে দেখাবে

    console.log(`✅ SUCCESS: Received ${quotesList.length} quotes`);
    return { success: true, quotes: quotesList };

  } catch (error) {
    console.error("🔥 FATAL ERROR:", error);
    return { success: false, quotes: [] };
  }
}