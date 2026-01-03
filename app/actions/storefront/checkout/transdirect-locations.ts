// File: app/actions/storefront/checkout/transdirect-locations.ts
"use server";

import { db } from "@/lib/prisma";

export async function searchTransdirectLocations(query: string) {
  try {
    if (!query || query.trim().length < 2) return [];

    // ১. কনফিগারেশন চেক
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.apiKey || !config.isEnabled) {
      return [];
    }

    // ২. API কল
    const res = await fetch(`https://www.transdirect.com.au/api/locations?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      next: { revalidate: 0 } // Cache results for 1 hour for performance
    });

    if (!res.ok) return [];

    const data = await res.json();
    let locations = [];

    // ৩. ডাটা হ্যান্ডলিং
    if (Array.isArray(data)) {
        locations = data;
    } else if (data.locations && Array.isArray(data.locations)) {
        locations = data.locations;
    }

    // ৪. ফরম্যাটিং (React-Select এর জন্য)
    return locations.slice(0, 50).map((loc: any) => ({
        value: `${loc.locality}, ${loc.state} ${loc.postcode}`,
        label: `${loc.locality}, ${loc.state} ${loc.postcode}`,
        suburb: loc.locality,
        postcode: loc.postcode,
        state: loc.state
    }));

  } catch (error) {
    console.error("LOCATION_SEARCH_ERROR:", error);
    return [];
  }
}