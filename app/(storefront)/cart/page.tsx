// app/(storefront)/cart/page.tsx

import { Metadata } from "next";
import CartClient from "./_components/CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart | GoBike Australia",
  description: "Review your selected kids electric bikes and accessories.",
};

export default function CartPage() {
  return (
    <main>
      <CartClient />
    </main>
  );
}