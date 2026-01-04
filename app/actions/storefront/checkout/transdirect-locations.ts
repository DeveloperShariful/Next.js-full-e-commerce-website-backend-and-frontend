// File: app/actions/storefront/checkout/transdirect-locations.ts
"use server";

import { db } from "@/lib/prisma";

export async function searchTransdirectLocations(query: string) {
  try {
    if (!query || query.trim().length < 2) return [];

    // 1. Config Check
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" },
      select: { apiKey: true, isEnabled: true }
    });

    if (!config || !config.apiKey || !config.isEnabled) {
      return [];
    }

    // 2. API Call (Transdirect Autocomplete)
    const res = await fetch(`https://www.transdirect.com.au/api/locations?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      // ✅ Cache results for 1 hour to reduce API hits on high traffic
      next: { revalidate: 3600 } 
    });

    if (!res.ok) return [];

    const data = await res.json();
    let locations = [];

    // 3. Data Normalization
    if (Array.isArray(data)) {
        locations = data;
    } else if (data.locations && Array.isArray(data.locations)) {
        locations = data.locations;
    }

    // 4. Format for React Select
    return locations.slice(0, 20).map((loc: any) => ({
        value: `${loc.postcode}`, // Using postcode as key part
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