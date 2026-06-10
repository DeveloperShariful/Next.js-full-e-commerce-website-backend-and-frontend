//app/actions/backend/marketing/capi.actions.ts

"use server";

import { db } from "@/lib/prisma";
import crypto from "crypto";

// ============================================================================
// HELPER: SHA-256 HASHING (ইউজারের প্রাইভেসি সুরক্ষায় ফেসবুকের বাধ্যতামূলক নিয়ম)
// ============================================================================
function sha256(value: string | null | undefined): string | null {
  if (!value) return null;
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

// ============================================================================
// 1. CORE ENGINE: SEND CONVERSIONS API EVENT TO META
// ============================================================================
export async function sendFacebookCapiEvent(payload: {
  eventName: string;
  eventId: string;
  eventUrl: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userData?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  customData?: Record<string, any>;
}) {
  try {
    // ডাটাবেজ থেকে ফেসবুকের এপিআই টোকেন ও পিক্সেল আইডি রিড করা
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        fbEnabled: true,
        fbPixelId: true,
        fbAccessToken: true,
        fbTestEventCode: true
      }
    });

    // ইন্টিগ্রেশন অফ থাকলে রিকোয়েস্ট স্কিপ করবে
    if (!config?.fbEnabled || !config?.fbPixelId || !config?.fbAccessToken) {
      return { success: false, message: "Facebook CAPI is disabled or config missing." };
    }

    // মেটা সার্ভার ডাটা ফরম্যাট প্রস্তুত করা
    const fbUserData: Record<string, any> = {
      client_ip_address: payload.ipAddress || undefined,
      client_user_agent: payload.userAgent || undefined,
    };

    // পার্সোনাল ডাটাগুলোকে হ্যাশ (Hash) করে যুক্ত করা হচ্ছে
    if (payload.userData?.email) {
      fbUserData.em = [sha256(payload.userData.email)];
    }
    if (payload.userData?.phone) {
      fbUserData.ph = [sha256(payload.userData.phone)];
    }
    if (payload.userData?.firstName) {
      fbUserData.fn = [sha256(payload.userData.firstName)];
    }
    if (payload.userData?.lastName) {
      fbUserData.ln = [sha256(payload.userData.lastName)];
    }

    const eventData = {
      event_name: payload.eventName,
      event_time: Math.floor(Date.now() / 1000), // UNIX timestamp সেকেন্ডে
      event_id: payload.eventId, // ডিডুপ্লিকেশন আইডি (মাস্ট ম্যাচ উইথ পিক্সেল)
      event_source_url: payload.eventUrl,
      action_source: "website",
      user_data: fbUserData,
      custom_data: payload.customData || undefined,
    };

    const requestBody: Record<string, any> = {
      data: [eventData]
    };

    // টেস্ট উইন্ডোতে লাইভ চেক করার জন্য টেস্ট কোড থাকলে যুক্ত হবে
    if (config.fbTestEventCode && config.fbTestEventCode.trim() !== "") {
      requestBody.test_event_code = config.fbTestEventCode.trim();
    }

    // 🚀 ফেসবুক গ্রাফ এপিআই-তে পোস্ট রিকোয়েস্ট পাঠানো
    const response = await fetch(`https://graph.facebook.com/v19.0/${config.fbPixelId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        access_token: config.fbAccessToken.trim(),
        ...requestBody
      }),
      cache: "no-store"
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("❌ META CAPI API ERROR:", JSON.stringify(resData, null, 2));
      return { success: false, error: resData.error?.message || "Meta API Error" };
    }

    return { success: true, data: resData };
  } catch (error: any) {
    console.error("Meta CAPI Exception:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 🚀 2. HELPER ACTION: TRACK ADD TO CART (Fires backend CAPI)
// ============================================================================
export async function trackFbAddToCart(data: {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
  url: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userEmail?: string | null;
}) {
  const eventId = `cart_${data.productId}_${Date.now()}`; // ইউনিক আইডি

  return await sendFacebookCapiEvent({
    eventName: "AddToCart",
    eventId,
    eventUrl: data.url,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    userData: { email: data.userEmail },
    customData: {
      content_ids: [data.productId],
      content_name: data.productName,
      content_type: "product",
      value: Number(data.price),
      currency: data.currency || "AUD"
    }
  });
}

// ============================================================================
// 🚀 3. HELPER ACTION: TRACK PURCHASE (Fires backend CAPI)
// ============================================================================
export async function trackFbPurchase(data: {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency?: string;
  url: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  customer: {
    email: string;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  items: { productId: string; quantity: number; price: number }[];
}) {
  const eventId = `purchase_${data.orderNumber}`; // ডিডুপ্লিকেশন আইডি (মাস্ট ম্যাচ উইথ থ্যাংকইউ পিক্সেল)

  const contentIds = data.items.map(item => item.productId);
  const contents = data.items.map(item => ({
    id: item.productId,
    quantity: item.quantity,
    item_price: Number(item.price)
  }));

  return await sendFacebookCapiEvent({
    eventName: "Purchase",
    eventId,
    eventUrl: data.url,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    userData: {
      email: data.customer.email,
      phone: data.customer.phone,
      firstName: data.customer.firstName,
      lastName: data.customer.lastName
    },
    customData: {
      content_ids: contentIds,
      contents: contents,
      content_type: "product",
      value: Number(data.totalAmount),
      currency: data.currency || "AUD"
    }
  });
}