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
    shippingMethodId?: string; 
    shippingCost?: number; // ✅ NEW PARAMETER
    couponCode?: string;
}

export async function getCheckoutSummary({ cartId, shippingAddress, shippingMethodId, shippingCost, couponCode }: SummaryParams) {
    try {
        // ... (Cart Fetching Logic Same as Before) ...
        const cart = await db.cart.findUnique({
            where: { id: cartId },
            include: { items: { include: { product: { select: { price: true, salePrice: true, taxStatus: true, categoryId: true } }, variant: { select: { price: true, salePrice: true } } } } }
        });
        if (!cart || !cart.items.length) return { success: false, error: "Cart is empty" };

        // ... (Subtotal Logic Same as Before) ...
        let subtotal = 0;
        let taxableAmount = 0;
        for (const item of cart.items) {
            const price = item.variant ? (item.variant.salePrice ?? item.variant.price) : (item.product.salePrice ?? item.product.price);
            subtotal += (price * item.quantity);
            if (item.product.taxStatus === 'TAXABLE' || item.product.taxStatus === 'SHIPPING_ONLY') {
                taxableAmount += (price * item.quantity);
            }
        }

        // 3. Calculate Shipping (OPTIMIZED)
        let finalShippingCost = 0;
        let selectedMethodName = "Standard Shipping";

        if (shippingAddress && shippingMethodId) {
            // ✅ FIX: যদি ক্লায়েন্ট কস্ট পাঠিয়ে থাকে, আমরা সেটা বিশ্বাস করব (শুধুমাত্র UI আপডেটের জন্য)
            // ফাইনাল অর্ডারে (process-checkout) আমরা আবার ভেরিফাই করব, তাই এখানে রিস্ক নেই।
            if (typeof shippingCost === 'number') {
                finalShippingCost = shippingCost;
            } else {
                // কস্ট না থাকলে তখন ক্যালকুলেট করব
                const ratesRes = await calculateShippingRates({ cartId, address: shippingAddress });
                if (ratesRes.success) {
                    const matchedRate = ratesRes.rates.find((r: any) => r.id === shippingMethodId);
                    if (matchedRate) {
                        finalShippingCost = matchedRate.price;
                        selectedMethodName = matchedRate.name;
                    }
                }
            }
        }

        // ... (Discount & Tax Logic Same as Before) ...
        // শুধু shippingCost ভেরিয়েবল এর নাম বদলে finalShippingCost ব্যবহার করবেন বাকি কোডে।
        
        // 4. Calculate Discount
        let discountAmount = 0;
        let discountId = undefined;

        if (couponCode) {
            const discount = await db.discount.findUnique({ where: { code: couponCode.toUpperCase(), isActive: true } });
            if (discount) {
                if (discount.type === "PERCENTAGE") {
                    discountAmount = (subtotal * discount.value) / 100;
                } else {
                    discountAmount = discount.value;
                }
                if (discountAmount > subtotal) discountAmount = subtotal;
                discountId = discount.id;
            }
        }

        // 5. Tax
        let taxTotal = 0;
        if (shippingAddress) {
            const taxRateConfig = await db.taxRate.findFirst({
                where: { country: shippingAddress.country, OR: [{ state: shippingAddress.state }, { state: null }], isActive: true },
                orderBy: { priority: 'desc' }
            });

            if (taxRateConfig) {
                const rate = taxRateConfig.rate / 100;
                let taxBase = taxableAmount;
                if (taxRateConfig.shipping) taxBase += finalShippingCost; // Use finalShippingCost
                taxBase = Math.max(0, taxBase - discountAmount);
                taxTotal = taxBase * rate;
            }
        }

        const total = subtotal + finalShippingCost + taxTotal - discountAmount;

        return {
            success: true,
            currency: "AUD",
            breakdown: {
                subtotal,
                shipping: finalShippingCost,
                shippingMethod: selectedMethodName,
                tax: taxTotal,
                discount: discountAmount,
                discountId,
                total: total > 0 ? total : 0
            }
        };

    } catch (error) {
        console.error("Checkout Summary Error:", error);
        return { success: false, error: "Calculation failed" };
    }
}