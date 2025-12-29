// File: app/(storefront)/cart/_components/cart-list.tsx
import { CartWithItems } from "@/app/actions/storefront/cart/queries";
import CartItem from "./cart-item";

interface ListProps {
  cart: CartWithItems;
}

export default function CartList({ cart }: ListProps) {
  if (!cart) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Shopping Cart</h1>
        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
          {cart.items.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {cart.items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}