// File: app/actions/storefront/checkout/get-checkout-summary.ts
"use server";

import { db } from "@/lib/prisma";
import { calculateShippingRates } from "./calculate-shipping";

interface SummaryParams {
    cartId: string;
    shippingAddress?: {
        country: string;
        state: string;
        postcode: string;
        suburb: string;
    };
    shippingMethodId?: string; // e.g., "rate_123" or "transdirect_fastway"
    couponCode?: string;
}

export async function getCheckoutSummary({ cartId, shippingAddress, shippingMethodId, couponCode }: SummaryParams) {
    try {
        // ১. কার্ট এবং প্রোডাক্ট প্রাইস আনা (Latest Price)
        const cart = await db.cart.findUnique({
            where: { id: cartId },
            include: { 
                items: { 
                    include: { 
                        product: { select: { price: true, salePrice: true, taxStatus: true } }, 
                        variant: { select: { price: true, salePrice: true } } 
                    } 
                } 
            }
        });

        if (!cart || !cart.items.length) {
            return { success: false, error: "Cart is empty" };
        }

        // ২. সাবটোটাল হিসাব করা
        let subtotal = 0;
        let taxableAmount = 0;

        for (const item of cart.items) {
            const price = item.variant 
                ? (item.variant.salePrice || item.variant.price) 
                : (item.product.salePrice || item.product.price);
            
            subtotal += (price * item.quantity);

            // ট্যাক্স লজিক (Simple check)
            if (item.product.taxStatus === 'TAXABLE') {
                taxableAmount += (price * item.quantity);
            }
        }

        // ৩. শিপিং কস্ট বের করা (Securely)
        let shippingCost = 0;
        let selectedMethodName = "Standard Shipping";

        if (shippingAddress && shippingMethodId) {
            // সার্ভার আবার রেট ক্যালকুলেট করবে, ক্লায়েন্টের পাঠানো cost বিশ্বাস করবে না
            const ratesRes = await calculateShippingRates({ cartId, address: shippingAddress });
            
            if (ratesRes.success) {
                const matchedRate = ratesRes.rates.find((r: any) => r.id === shippingMethodId);
                if (matchedRate) {
                    shippingCost = matchedRate.price;
                    selectedMethodName = matchedRate.name;
                }
            }
        }

        // ৪. ডিসকাউন্ট (Coupon) চেক করা
        let discountAmount = 0;
        let discountId = undefined;

        if (couponCode) {
            const discount = await db.discount.findUnique({
                where: { code: couponCode.toUpperCase(), isActive: true }
            });

            if (discount) {
                const now = new Date();
                // ভ্যালিডেশন
                if (
                    !(discount.startDate > now || (discount.endDate && discount.endDate < now)) &&
                    !(discount.usageLimit && discount.usedCount >= discount.usageLimit) &&
                    !(discount.minSpend && subtotal < discount.minSpend)
                ) {
                    // ক্যালকুলেশন
                    if (discount.type === "PERCENTAGE") {
                        discountAmount = (subtotal * discount.value) / 100;
                    } else {
                        discountAmount = discount.value;
                    }
                    if (discountAmount > subtotal) discountAmount = subtotal;
                    
                    discountId = discount.id;
                }
            }
        }

        // ৫. ট্যাক্স ক্যালকুলেশন (GST 10% Example)
        // আপনি চাইলে এটি ডাটাবেসের TaxRate টেবিল থেকে ডাইনামিক করতে পারেন
        let taxTotal = 0;
        // যদি অস্ট্রেলিয়া হয় এবং ট্যাক্সেবল প্রোডাক্ট থাকে
        if (shippingAddress?.country === "AU") {
             const taxRate = 0.10; // 10% GST
             // GST সাধারণত (Price / 11) হয় যদি Price Inclusive হয়, অথবা (Price * 0.1) যদি Exclusive হয়।
             // আমরা ধরে নিচ্ছি Exclusive Tax for calculation here
             taxTotal = (taxableAmount + shippingCost - discountAmount) * taxRate; 
        }

        // ৬. ফাইনাল টোটাল
        // Total = Subtotal + Shipping + Tax - Discount
        const total = subtotal + shippingCost + taxTotal - discountAmount;

        return {
            success: true,
            currency: "AUD",
            breakdown: {
                subtotal,
                shipping: shippingCost,
                shippingMethod: selectedMethodName,
                tax: taxTotal,
                discount: discountAmount,
                discountId,
                total: total > 0 ? total : 0 // নেগেটিভ টোটাল প্রিভেন্ট করা
            }
        };

    } catch (error) {
        console.error("Checkout Summary Error:", error);
        return { success: false, error: "Calculation failed" };
    }
}