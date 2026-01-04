// File: app/actions/admin/settings/marketing-settings/klaviyo/get-profiles.ts
"use server";

import { db } from "@/lib/prisma";
import { KlaviyoResponse } from "./klaviyo";

interface GetProfilesParams {
  cursor?: string; 
  search?: string; 
}

export async function getKlaviyoProfiles({ cursor, search }: GetProfilesParams = {}) {
  try {
    // 1. Get Config from DB
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { 
        klaviyoEnabled: true, 
        klaviyoPrivateKey: true 
      }
    });

    if (!config?.klaviyoEnabled || !config?.klaviyoPrivateKey) {
      return { success: false, message: "Klaviyo is not enabled or configured." };
    }

    // 2. Build URL
    // ✅ FIX: Added '&sort=-created' to show Newest Profiles First
    let url = "https://a.klaviyo.com/api/profiles/?page[size]=10&sort=-created";

    // Handle Pagination
    if (cursor) {
      url += `&page[cursor]=${encodeURIComponent(cursor)}`;
    }

    // Handle Search (Filter by Email)
    if (search && search.trim() !== "") {
      const emailFilter = `any(email,['${search.trim()}'])`;
      // Search use korle sort kaj na o korte pare (API limitation), tai search thakle sort bad dite pari
      // Tobe sadharonot search ar somoy sort dorkar hoy na, karon specific user khujcen.
      url += `&filter=${encodeURIComponent(emailFilter)}`;
    }

    // 3. Call Klaviyo API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Klaviyo-API-Key ${config.klaviyoPrivateKey}`,
        "revision": "2024-02-15",
        "accept": "application/json"
      },
      next: { revalidate: 0 } // No caching
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Klaviyo API Error:", errorText);
      return { success: false, message: `Klaviyo Error: ${response.statusText}` };
    }

    const data: KlaviyoResponse = await response.json();

    // 4. Extract Next Cursor
    let nextCursor = null;
    if (data.links.next) {
      const urlObj = new URL(data.links.next);
      nextCursor = urlObj.searchParams.get("page[cursor]");
    }

    return { 
      success: true, 
      profiles: data.data, 
      nextCursor 
    };

  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, message: "Internal server error" };
  }
}