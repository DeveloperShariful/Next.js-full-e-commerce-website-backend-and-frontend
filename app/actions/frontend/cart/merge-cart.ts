// File: app/actions/storefront/cart/merge-cart.ts

"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function mergeCart() {
  try {
    const session = await auth();
    if (!session?.user?.email) return { merged: false }; // রিটার্ন টাইপ অবজেক্ট করা ভালো

    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("cartId")?.value;

    if (!guestCartId) return { merged: false };

    const dbUser = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) return { merged: false };

    // ইউজারের আগের কোনো কার্ট আছে কি না
    const userCart = await db.cart.findUnique({
      where: { userId: dbUser.id },
      include: { items: true }
    });

    // গেস্ট কার্ট খুঁজে বের করা
    const guestCart = await db.cart.findUnique({
      where: { id: guestCartId },
      include: { items: true }
    });

    if (!guestCart) {
        // গেস্ট কার্ট যদি না পাওয়া যায়, কুকি ক্লিয়ার করে দিই
        cookieStore.delete("cartId");
        return { merged: false };
    }

    // 🔥🔥 CRITICAL FIX: যদি গেস্ট কার্ট এবং ইউজার কার্ট একই হয়, তাহলে কিছুই করার দরকার নেই
    // এটি না দিলে নিজের কার্ট নিজেই ডিলিট করে ফেলবে
    if (userCart && userCart.id === guestCart.id) {
        return { merged: false };
    }

    // --- মার্জিং লজিক ---

    if (userCart) {
        // SCENARIO A: ইউজারের অলরেডি আলাদা কার্ট আছে। গেস্ট আইটেমগুলো সেখানে সরাতে হবে।
        
        for (const item of guestCart.items) {
            const existingItem = userCart.items.find(
                (i) => i.productId === item.productId && i.variantId === item.variantId
            );

            if (existingItem) {
                await db.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + item.quantity }
                });
            } else {
                await db.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    }
                });
            }
        }

        // মার্জ শেষ, এখন গেস্ট কার্ট ডিলিট
        await db.cart.delete({ where: { id: guestCartId } });
        
        // ইউজারের কার্ট আইডি কুকিতে সেট
        cookieStore.set("cartId", userCart.id);
        
        return { merged: true }; // মার্জ হয়েছে সিগনাল

    } else {
        // SCENARIO B: ইউজারের কোনো কার্ট নেই। গেস্ট কার্টটিকেই অ্যাসাইন করা।
        await db.cart.update({
            where: { id: guestCartId },
            data: { userId: dbUser.id }
        });
        
        return { merged: true }; // আপডেট হয়েছে
    }

  } catch (error) {
    console.error("Cart Merge Error:", error);
    return { merged: false };
  }
}