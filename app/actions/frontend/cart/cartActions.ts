// app/actions/frontend/cart/cartActions.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export interface CartActionResponse {
  success: boolean;
  items?: any[];
  appliedCoupons?: { code: string; amount: number }[];
  error?: string;
}

// ============================================================================
// ✅ FIX: Explicit session type — avoids NextAuth v5 overload resolution bug.
// Awaited<ReturnType<typeof auth>> → TypeScript picks NextMiddleware overload
// instead of Session | null → 'user' does not exist error.
// Using a plain structural type bypasses this entirely.
// ============================================================================
type AuthUser = {
  id?: string | null;
  email?: string | null;
};
type AuthSession = { user?: AuthUser | null } | null;

async function resolveUserId(session: AuthSession): Promise<string | null> {
  if (!session?.user) return null;
  // Fast path: auth callbacks expose id (NextAuth v5 with custom callbacks)
  if (session.user.id) return session.user.id as string;
  // Standard path: email-based DB lookup (default NextAuth behaviour)
  if (session.user.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    return user?.id || null;
  }
  return null;
}

// ============================================================================
// 1. SESSION & USER MANAGEMENT
// ============================================================================
async function getCartSessionAndUser() {
  const [cookieStore, rawSession] = await Promise.all([cookies(), auth()]);
  const session = rawSession as AuthSession;
  let sessionId = cookieStore.get("cart_session")?.value;
  const userId = await resolveUserId(session);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("cart_session", sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      path: "/",
    });
  }

  let cart = await db.cart.findFirst({
    where: userId ? { userId } : { sessionId },
  });

  // Merge guest cart into user cart on login
  if (userId) {
    const guestCart = await db.cart.findFirst({
      where: { sessionId, userId: null },
    });

    if (guestCart) {
      if (cart) {
        const guestItems = await db.cartItem.findMany({ where: { cartId: guestCart.id } });
        for (const item of guestItems) {
          const existing = await db.cartItem.findFirst({
            where: { cartId: cart.id, productId: item.productId, variantId: item.variantId },
          });
          if (existing) {
            await db.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + item.quantity },
            });
          } else {
            await db.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              },
            });
          }
        }
        const guestCoupons = (guestCart.appliedCoupons as any[]) || [];
        const userCoupons  = (cart.appliedCoupons  as any[]) || [];
        const merged = [
          ...userCoupons,
          ...guestCoupons.filter((gc: any) => !userCoupons.some((uc: any) => uc.code === gc.code)),
        ];
        await db.cart.update({
          where: { id: cart.id },
          data: { appliedCoupons: merged.length > 0 ? merged : Prisma.JsonNull },
        });
        await db.cart.delete({ where: { id: guestCart.id } });
      } else {
        cart = await db.cart.update({ where: { id: guestCart.id }, data: { userId } });
      }
    }
  }

  if (!cart) {
    cart = await db.cart.create({ data: { sessionId, userId: userId || null } });
  }

  return { cart, sessionId, userId };
}

// ============================================================================
// 2. INVENTORY VALIDATION & RESERVATION
// ============================================================================
async function validateStockAndReserve(
  cartId: string,
  productId: string,
  variantId: string | null,
  requestedQuantity: number
) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { valid: false, error: "Product not found." };
  if (product.status !== "ACTIVE") return { valid: false, error: "This product is currently unavailable." };

  let trackQuantity  = product.trackQuantity;
  let stock          = product.stock;
  let backorderStatus = product.backorderStatus;

  if (variantId) {
    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return { valid: false, error: "Product variant not found." };
    trackQuantity   = variant.trackQuantity;
    stock           = variant.stock;
  }

  if (trackQuantity && backorderStatus === "DO_NOT_ALLOW") {
    const activeReservations = await db.inventoryReservation.aggregate({
      where: {
        productId,
        variantId,
        expiresAt: { gt: new Date() },
        cartId: { not: cartId },
      },
      _sum: { quantity: true },
    });

    const reservedStock   = activeReservations._sum.quantity || 0;
    const availableStock  = stock - reservedStock;

    if (requestedQuantity > availableStock) {
      if (availableStock <= 0)
        return { valid: false, error: "Sorry, this item is out of stock or reserved by others." };
      return { valid: false, error: `Only ${availableStock} item(s) left in stock!` };
    }
  }

  const defaultLocation = await db.location.findFirst({ where: { isActive: true } });
  if (defaultLocation) {
    await db.inventoryReservation.deleteMany({ where: { cartId, productId, variantId } });
    await db.inventoryReservation.create({
      data: {
        cartId,
        productId,
        variantId,
        locationId: defaultLocation.id,
        quantity: requestedQuantity,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  return { valid: true };
}

// ============================================================================
// 3. CART ITEM FORMATTING
// ============================================================================
async function getFormattedCartItems(cartId: string) {
  // Fire-and-forget: expired reservation cleanup runs async, never blocks cart display
  db.inventoryReservation.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          product: { include: { attributes: true } },
          variant: true,
        },
      },
    },
  });

  if (!cart) return [];

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);

  return cart.items.map((item) => {
    const isVariant = !!item.variant;
    const priceNum  = isVariant ? Number(item.variant!.price) : Number(item.product.price);
    const rawWeight = isVariant ? item.variant?.weight : item.product.weight;

    return {
      id: item.product.id,
      databaseId: item.product.productCode,
      variationId: item.variantId || undefined,
      name: isVariant ? `${item.product.name} - ${item.variant!.name}` : item.product.name,
      slug: item.product.slug,
      price: formatPrice(priceNum),
      rawPrice: priceNum,
      image: isVariant && item.variant!.image ? item.variant!.image : item.product.featuredImage,
      quantity: item.quantity,
      key: item.id,
      total: formatPrice(priceNum * item.quantity),
      weight: rawWeight ? Number(rawWeight.toString()) : 0,
      isPreOrder: isVariant ? item.variant!.isPreOrder : item.product.isPreOrder,
      isVirtual: item.product.isVirtual,
      taxStatus: item.product.taxStatus,
      shippingClassId: item.product.shippingClassId || null,
      attributes: isVariant && item.variant
        ? Object.entries(item.variant.attributes as Record<string, string>).map(([name, value]) => ({
            id: name,
            name,
            label: name,
            value,
          }))
        : item.product.attributes.map((attr) => ({
            id: attr.id,
            name: attr.name,
            label: attr.name,
            value: attr.values.join(", "),
          })),
    };
  });
}

// ============================================================================
// 4. COUPON RE-VALIDATION
// ============================================================================
async function revalidateCoupons(
  cartId: string,
  savedCoupons: any[],
  subtotal: number
): Promise<{ code: string; amount: number }[]> {
  if (!savedCoupons || savedCoupons.length === 0) return [];

  const code = savedCoupons[0].code;
  const discount = await db.discount.findUnique({ where: { code } });
  const now = new Date();

  if (
    discount &&
    discount.isActive &&
    !discount.deletedAt &&
    discount.startDate <= now &&
    (!discount.endDate || discount.endDate >= now) &&
    (!discount.minSpend || subtotal >= Number(discount.minSpend)) &&
    (!discount.usageLimit || discount.usedCount < discount.usageLimit)
  ) {
    let amount = 0;
    if (discount.type === "FIXED_CART" || discount.type === "FIXED_AMOUNT") {
      amount = Number(discount.value);
    } else if (discount.type === "PERCENTAGE") {
      amount = (subtotal * Number(discount.value)) / 100;
    }
    if (amount > subtotal) amount = subtotal;
    const valid = [{ code: discount.code, amount }];
    await db.cart.update({ where: { id: cartId }, data: { appliedCoupons: valid } });
    return valid;
  }

  await db.cart.update({ where: { id: cartId }, data: { appliedCoupons: Prisma.JsonNull } });
  return [];
}

// ============================================================================
// 5. EXPORTED ACTIONS
// ============================================================================

export async function getCartAction(): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const items = await getFormattedCartItems(cart.id);
    const savedCoupons = (cart.appliedCoupons as unknown as { code: string; amount: number }[]) || [];

    // Skip DB roundtrip when no coupons — the common case for most customers
    if (savedCoupons.length === 0) {
      return { success: true, items, appliedCoupons: [] };
    }

    const subtotal = items.reduce((acc, item) => acc + item.rawPrice * item.quantity, 0);
    const validCoupons = await revalidateCoupons(cart.id, savedCoupons, subtotal);
    return { success: true, items, appliedCoupons: validCoupons };
  } catch (error) {
    console.error("[getCartAction]", error);
    return { success: false, items: [], error: "Failed to fetch cart. Please try again." };
  }
}

export async function addToCartAction(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const existing = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });
    const newQuantity = existing ? existing.quantity + quantity : quantity;

    const stockCheck = await validateStockAndReserve(cart.id, productId, variantId || null, newQuantity);
    if (!stockCheck.valid) return { success: false, error: stockCheck.error };

    if (existing) {
      await db.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
    } else {
      await db.cartItem.create({
        data: { cartId: cart.id, productId, variantId: variantId || null, quantity: newQuantity },
      });
    }
    return await getCartAction();
  } catch (error) {
    console.error("[addToCartAction]", error);
    return { success: false, error: "An unexpected error occurred while adding to cart." };
  }
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number
): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } });
    if (!cartItem) return { success: false, error: "Cart item not found." };

    const stockCheck = await validateStockAndReserve(
      cart.id, cartItem.productId, cartItem.variantId, quantity
    );
    if (!stockCheck.valid) return { success: false, error: stockCheck.error };

    await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    return await getCartAction();
  } catch (error) {
    console.error("[updateCartItemQuantityAction]", error);
    return { success: false, error: "Failed to update quantity." };
  }
}

export async function removeFromCartAction(cartItemId: string): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } });
    if (cartItem) {
      await db.inventoryReservation.deleteMany({
        where: { cartId: cart.id, productId: cartItem.productId, variantId: cartItem.variantId },
      });
      await db.cartItem.delete({ where: { id: cartItemId } });
    }
    return await getCartAction();
  } catch (error) {
    console.error("[removeFromCartAction]", error);
    return { success: false, error: "Failed to remove item." };
  }
}

export async function clearCartAction(): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    await db.inventoryReservation.deleteMany({ where: { cartId: cart.id } });
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    await db.cart.update({
      where: { id: cart.id },
      data: {
        appliedCoupons: Prisma.JsonNull,
        shippingHash: null,
        shippingQuotes: Prisma.JsonNull,
      },
    });
    return { success: true, items: [], appliedCoupons: [] };
  } catch (error) {
    console.error("[clearCartAction]", error);
    return { success: false, error: "Failed to clear cart." };
  }
}

export async function applyCouponAction(code: string): Promise<CartActionResponse> {
  try {
    const [{ cart }, storeSettings] = await Promise.all([
      getCartSessionAndUser(),
      db.storeSettings.findUnique({ where: { id: "settings" }, select: { generalConfig: true } }),
    ]);

    const generalConfig = storeSettings?.generalConfig as { enableCoupons?: boolean } | null;
    if (generalConfig?.enableCoupons === false) {
      return { success: false, error: "Coupon codes are not enabled." };
    }

    const items    = await getFormattedCartItems(cart.id);
    const subtotal = items.reduce((acc, item) => acc + item.rawPrice * item.quantity, 0);

    const normalizedCode = code.trim().toUpperCase();
    const discount = await db.discount.findFirst({ where: { code: normalizedCode } });

    if (!discount || !discount.isActive || discount.deletedAt) {
      return { success: false, error: "Invalid or expired coupon code." };
    }

    const now = new Date();
    if (discount.startDate > now) return { success: false, error: "This coupon is not active yet." };
    if (discount.endDate && discount.endDate < now) return { success: false, error: "This coupon has expired." };
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { success: false, error: "This coupon's usage limit has been reached." };
    }
    if (discount.minSpend && subtotal < Number(discount.minSpend)) {
      return { success: false, error: `Minimum spend of $${discount.minSpend} required for this coupon.` };
    }
    if (discount.maxSpend && subtotal > Number(discount.maxSpend)) {
      return { success: false, error: "Maximum spend limit exceeded for this coupon." };
    }

    let discountAmount = 0;
    if (discount.type === "FIXED_CART" || discount.type === "FIXED_AMOUNT") {
      discountAmount = Number(discount.value);
    } else if (discount.type === "PERCENTAGE") {
      discountAmount = (subtotal * Number(discount.value)) / 100;
    }
    if (discountAmount > subtotal) discountAmount = subtotal;

    const newCoupon = { code: discount.code, amount: discountAmount };
    await db.cart.update({ where: { id: cart.id }, data: { appliedCoupons: [newCoupon] } });

    return { success: true, items, appliedCoupons: [newCoupon] };
  } catch (error) {
    console.error("[applyCouponAction]", error);
    return { success: false, error: "Failed to apply coupon. Please try again." };
  }
}

export async function removeCouponAction(code: string): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const items    = await getFormattedCartItems(cart.id);
    await db.cart.update({ where: { id: cart.id }, data: { appliedCoupons: Prisma.JsonNull } });
    return { success: true, items, appliedCoupons: [] };
  } catch (error) {
    console.error("[removeCouponAction]", error);
    return { success: false, error: "Failed to remove coupon." };
  }
}