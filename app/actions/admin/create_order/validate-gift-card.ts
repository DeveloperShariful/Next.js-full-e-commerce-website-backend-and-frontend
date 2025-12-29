// File Location: app/actions/create_order/validate-gift-card.ts

"use server";

import { db } from "@/lib/db";

export async function validateGiftCard(code: string) {
  try {
    if (!code) return { success: false, error: "Gift card code is required" };

    // ১. ডাটাবেজ থেকে কার্ড খোঁজা
    const giftCard = await db.giftCard.findUnique({
      where: { code: code }
    });

    // ২. কার্ড না পাওয়া গেলে
    if (!giftCard) {
      return { success: false, error: "Invalid gift card code" };
    }

    // ৩. কার্ড ডিজেবল করা থাকলে
    if (!giftCard.isEnabled) {
      return { success: false, error: "This gift card is disabled" };
    }

    // ৪. মেয়াদ চেক (যদি মেয়াদ সেট করা থাকে)
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      return { success: false, error: "Gift card has expired" };
    }

    // ৫. ব্যালেন্স চেক
    if (giftCard.balance <= 0) {
      return { success: false, error: "Gift card has zero balance" };
    }

    // ৬. সফল হলে ডাটা রিটার্ন
    return { 
      success: true, 
      data: {
        id: giftCard.id,
        code: giftCard.code,
        balance: giftCard.balance
      }
    };

  } catch (error) {
    console.error("GIFT_CARD_VALIDATION_ERROR", error);
    return { success: false, error: "Internal error validating gift card" };
  }
}