// File: app/actions/storefront/checkout/checkout-utils.ts

import { db } from "@/lib/prisma";
import { calculateShippingServerSide } from "@/app/actions/storefront/checkout/get-shipping-rates";
import { validateCoupon } from "@/app/actions/storefront/checkout/validate-coupon";

export async function calculateCartTotals(
  cartId: string,
  shippingMethodId?: string,
  shippingAddress?: any,
  couponCode?: string
) {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } }
  });

  if (!cart) throw new Error("Cart not found");

  let subtotal = 0;
  cart.items.forEach(item => {
    const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
    subtotal += price * item.quantity;
  });

  let shippingCost = 0;
  if (shippingMethodId && shippingAddress && shippingAddress.postcode) {
    const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId);
    shippingCost = cost || 0;
  }

  let discount = 0;
  if (couponCode) {
    const res = await validateCoupon(couponCode, cartId);
    if (res.success && res.discountAmount) {
      discount = res.discountAmount;
    }
  }

  const total = Math.max(0, subtotal + shippingCost - discount);

  return { subtotal, shippingCost, discount, total, cart };
}