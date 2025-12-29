// File: app/(storefront)/cart/_components/cart-view.tsx
import { CartWithItems } from "@/app/actions/storefront/cart/queries";
import CartList from "./cart-list";
import OrderSummary from "./order-summary";
import EmptyState from "./empty-state";

interface ViewProps {
  cart: CartWithItems;
}

export default function CartView({ cart }: ViewProps) {
  const hasItems = cart && cart.items && cart.items.length > 0;

  if (!hasItems) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#F8F9FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Cart</h1>
        <p className="text-slate-500 mt-1">Review your selected items before checking out.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: List */}
        <div className="lg:col-span-8">
          <CartList cart={cart} />
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-4">
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  );
}