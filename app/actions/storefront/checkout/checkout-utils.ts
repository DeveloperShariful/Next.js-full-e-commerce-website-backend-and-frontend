// File: app/actions/storefront/checkout/checkout-utils.ts

import { db } from "@/lib/prisma";
import { calculateShippingServerSide } from "@/app/actions/storefront/checkout/get-shipping-rates";
import { validateCoupon } from "@/app/actions/storefront/checkout/validate-coupon";
import { DecimalMath } from "@/lib/decimal-math"; // আপনার ফাইল

export async function calculateCartTotals(
  cartId: string,
  shippingMethodId?: string,
  shippingAddress?: any,
  couponCode?: string,
  paymentMethodIdentifier?: string 
) {
  // 1. Fetch Cart
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } }
  });

  if (!cart) throw new Error("Cart not found");

  // 2. Calculate Subtotal (Using DecimalMath)
  let subtotal = "0"; // String হিসেবে শুরু করছি সেফটির জন্য
  
  cart.items.forEach(item => {
    const variantPrice = item.variant 
      ? (item.variant.salePrice ?? item.variant.price)
      : null;
    
    const productPrice = item.product.salePrice ?? item.product.price;
    // Price prioritization logic
    const finalPrice = variantPrice ?? productPrice;

    // subtotal += price * quantity
    const lineTotal = DecimalMath.mul(finalPrice, item.quantity);
    subtotal = DecimalMath.add(subtotal, lineTotal).toString();
  });

  // 3. Calculate Shipping
  let shippingCost = "0";
  if (shippingMethodId && shippingAddress?.postcode) {
    const cost = await calculateShippingServerSide(cartId, shippingAddress, shippingMethodId);
    if (cost !== null) {
      shippingCost = cost.toString();
    }
  }

  // 4. Calculate Discount
  let discount = "0";
  if (couponCode) {
    const res = await validateCoupon(couponCode, cartId);
    if (res.success && res.discountAmount) {
      discount = res.discountAmount.toString();
    }
  }

  // 5. Calculate Surcharge (Gateway Fee)
  let surcharge = "0";
  let surchargeLabel = "";

  if (paymentMethodIdentifier) {
    const methodConfig = await db.paymentMethodConfig.findFirst({
        where: { identifier: paymentMethodIdentifier },
    });

    if (methodConfig && methodConfig.surchargeEnabled) {
        // Base = Subtotal + Shipping - Discount
        const baseAmount = DecimalMath.sub(DecimalMath.add(subtotal, shippingCost), discount);
        const safeBase = DecimalMath.max(baseAmount, 0); // নেগেটিভ হবে না

        if (methodConfig.surchargeType === 'percentage') {
            surcharge = DecimalMath.percent(safeBase, methodConfig.surchargeAmount).toString();
            surchargeLabel = `${methodConfig.surchargeAmount}%`;
        } else {
            surcharge = methodConfig.surchargeAmount.toString();
            surchargeLabel = `$${methodConfig.surchargeAmount}`;
        }
    }
  }

  // 6. Final Total
  // Total = Subtotal + Shipping + Surcharge - Discount
  const intermediateTotal = DecimalMath.add(
    DecimalMath.add(subtotal, shippingCost), 
    surcharge
  );
  const totalDecimal = DecimalMath.max(DecimalMath.sub(intermediateTotal, discount), 0);
  
  const total = totalDecimal.toString();

  // 7. Gateway Format (Cents for Stripe/PayPal)
  // এখানে আপনার ক্লাসের নতুন মেথড ব্যবহার করছি
  const totalCents = DecimalMath.toPaymentUnit(totalDecimal);

  return {
    subtotal: DecimalMath.toFixed(subtotal),
    shippingCost: DecimalMath.toFixed(shippingCost),
    discount: DecimalMath.toFixed(discount),
    surcharge: DecimalMath.toFixed(surcharge),
    surchargeLabel,
    total: DecimalMath.toFixed(total), // For UI Display "10.50"
    
    // For Gateways (Integers)
    totalsInCents: {
        subtotal: DecimalMath.toPaymentUnit(subtotal),
        shipping: DecimalMath.toPaymentUnit(shippingCost),
        discount: DecimalMath.toPaymentUnit(discount),
        surcharge: DecimalMath.toPaymentUnit(surcharge),
        total: totalCents // 1050
    },
    cart
  };
}