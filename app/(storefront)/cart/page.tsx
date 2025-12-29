// File: app/(storefront)/cart/page.tsx
import { getCart } from "@/app/actions/storefront/cart/queries";
import CartView from "./_components/cart-view";

export const metadata = {
  title: "Shopping Cart | GoBike",
  description: "Review your shopping cart items.",
};

export default async function CartPage() {
  const cart = await getCart();
  return <CartView cart={cart} />;
}