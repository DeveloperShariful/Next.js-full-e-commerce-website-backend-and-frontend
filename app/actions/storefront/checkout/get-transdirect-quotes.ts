// File: app/actions/storefront/checkout/get-transdirect-quotes.ts


"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"; 

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


  try {
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.isEnabled || !config.apiKey) {
      return { success: false, quotes: [] };
    }
    const apiKey = config.apiKey.startsWith("U2F") ? decrypt(config.apiKey) : config.apiKey;
    const formattedItems = items.map(item => {
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
            description: "carton", 
            type: "carton" 
        };
    });

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

    const res = await fetch("https://www.transdirect.com.au/api/quotes", {
      method: "POST",
      headers: {
        "Api-Key": apiKey || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
        return { success: false, quotes: [] };
    }

    const data = await res.json();
    const quotesObj = data.quotes || {};
    
    const quotesList = Object.keys(quotesObj).map(key => {
        const q = quotesObj[key];
        return {
            id: `transdirect_${key}`,
            name: q.service_name || key, 
            carrier: q.service_name,
            price: Number(q.total),
            transit_time: q.transit_time,
            type: "transdirect",
            service_code: key
        };
    }).sort((a: any, b: any) => a.price - b.price);

    return { success: true, quotes: quotesList };

  } catch (error) {
    console.error("Transdirect Error:", error);
    return { success: false, quotes: [] };
  }
}