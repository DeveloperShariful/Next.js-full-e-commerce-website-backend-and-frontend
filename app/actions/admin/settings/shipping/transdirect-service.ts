"use server";

import { db } from "@/lib/prisma";

// --- TEST REAL CONNECTION ---
export async function testTransdirectConnection() {
  try {
    // ১. ডাটাবেস থেকে সেভ করা কনফিগারেশন আনছি
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    // ২. যদি API Key না থাকে, তাহলে এরর দিব
    if (!config || !config.apiKey) {
      return { success: false, error: "API Key not found. Please save credentials first." };
    }

    // ৩. Transdirect এর রিয়েল সার্ভারে রিকোয়েস্ট পাঠাচ্ছি
    const response = await fetch("https://www.transdirect.com.au/api/member", {
      method: "GET",
      headers: {
        "Api-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store" // ক্যাশ যেন না ধরে
    });

    // ৪. যদি সার্ভার থেকে এরর আসে (যেমন: 401 Unauthorized)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Transdirect API Error:", errorData);
      return { 
        success: false, 
        error: `Connection Failed! Transdirect says: ${response.statusText} (Check API Key)` 
      };
    }

    // ৫. সফল হলে ডাটা রিড করা
    const data = await response.json();

    // চেক করা মেম্বার আইডি এসেছে কিনা
    if (!data || !data.id) {
        return { success: false, error: "Invalid response from Transdirect." };
    }

    // ৬. ডাটাবেস আপডেট করা (রিয়েল মেম্বার আইডি এবং স্ট্যাটাস দিয়ে)
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