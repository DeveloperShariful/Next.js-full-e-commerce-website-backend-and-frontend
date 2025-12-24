// File: app/actions/settings/shipping/transdirect-locations.ts

"use server";

import { db } from "@/lib/db";

export async function searchTransdirectLocations(query: string) {
  try {

    if (!query || query.length < 1) return [];
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.apiKey) {
      return [];
    }
    const res = await fetch(`https://www.transdirect.com.au/api/locations?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      cache: "no-store" // রিয়েল টাইম ডাটা চাই
    });

    if (!res.ok) return [];

    const data = await res.json();
    let locations = [];
    if (Array.isArray(data)) {
        locations = data;
    } else if (data.locations && Array.isArray(data.locations)) {
        locations = data.locations;
    }

    // আমরা প্রথম ১০টি সাজেশন পাঠাব
    return locations.slice(0, 100).map((loc: any) => ({
        city: loc.locality,
        postcode: loc.postcode,
        state: loc.state
    }));

  } catch (error) {
    console.error("LOCATION_SEARCH_ERROR:", error);
    return [];
  }
}