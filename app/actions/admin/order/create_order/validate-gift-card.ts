// File Location: app/actions/order/create_order/validate-gift-card.ts

"use server";

import { db } from "@/lib/prisma";

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

    // ৫. ব্যালেন্স চেক (FIXED HERE)
    // giftCard.balance হলো Decimal, তাই .toNumber() ব্যবহার করা হয়েছে
    if (giftCard.balance.toNumber() <= 0) {
      return { success: false, error: "Gift card has zero balance" };
    }

    // ৬. সফল হলে ডাটা রিটার্ন
    return { 
      success: true, 
      data: {
        id: giftCard.id,
        code: giftCard.code,
        // রিটার্ন করার সময়ও নাম্বারে কনভার্ট করা ভালো, যাতে ক্লায়েন্ট সাইডে এরর না দেয়
        balance: giftCard.balance.toNumber()
      }
    };

  } catch (error) {
    console.error("GIFT_CARD_VALIDATION_ERROR", error);
    return { success: false, error: "Internal error validating gift card" };
  }
}