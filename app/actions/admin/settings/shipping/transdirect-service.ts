// File: app/actions/settings/shipping/transdirect-service.ts

"use server";

import { db } from "@/lib/prisma";

// --- TEST REAL CONNECTION ---
export async function testTransdirectConnection() {
  try {
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });
    if (!config || !config.apiKey) {
      return { success: false, error: "API Key not found. Please save credentials first." };
    }
    const response = await fetch("https://www.transdirect.com.au/api/member", {
      method: "GET",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store" 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Transdirect API Error:", errorData);
      return { 
        success: false, 
        error: `Connection Failed! Transdirect says: ${response.statusText} (Check API Key)` 
      };
    }

    const data = await response.json();
    if (!data || !data.id) {
        return { success: false, error: "Invalid response from Transdirect." };
    }

    await db.transdirectConfig.update({
        where: { id: "transdirect_config" },
        data: { 
            memberId: data.id, // রিয়েল আইডি
            accountStatus: data.status || "active",
            creditLimit: parseFloat(data.credit_limit || "0")
        }
    });

    return { 
        success: true, 
        message: `Connection Successful! Verified Member ID: ${data.id}`,
        details: { status: data.status, credit: data.credit_limit } 
    };

  } catch (error) {
    console.error("CONNECTION_ERROR", error);
    return { success: false, error: "Network error or API is unreachable." };
  }
}