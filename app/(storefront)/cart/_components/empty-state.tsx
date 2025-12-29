// File: app/(storefront)/cart/_components/empty-state.tsx
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="bg-slate-50 p-6 rounded-full mb-6">
        <ShoppingBag size={48} className="text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        Looks like you haven't added anything to your cart yet.
      </p>
      <Link 
        href="/shop" 
        className="px-8 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Start Shopping
      </Link>
    </div>
  );
}