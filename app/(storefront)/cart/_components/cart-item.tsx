// File: app/(storefront)/cart/_components/cart-item.tsx
"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { updateCartItemQuantity, removeFromCart } from "@/app/actions/storefront/cart/mutations";
import { toast } from "react-hot-toast";
import { CartWithItems } from "@/app/actions/storefront/cart/queries";

// Helper type to extract the single item type from the array
type CartItemType = NonNullable<CartWithItems>["items"][number];

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const [isPending, startTransition] = useTransition();

  const product = item.product;
  const variant = item.variant;
  
  // Display Logic: Variant takes precedence
  const name = variant?.name ? `${product.name} - ${variant.name}` : product.name;
  const image = variant?.image || product.featuredImage || "/placeholder.png";
  
  // Price Logic
  const price = variant?.salePrice ?? variant?.price ?? product.salePrice ?? product.price;
  const originalPrice = variant?.salePrice ? variant.price : (product.salePrice ? product.price : null);

  const handleUpdateQty = (newQty: number) => {
    startTransition(async () => {
      const res = await updateCartItemQuantity(item.id, newQty);
      if (!res.success) toast.error("Could not update quantity");
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeFromCart(item.id);
      if (res.success) toast.success("Item removed");
      else toast.error("Could not remove item");
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 border-b border-slate-100 last:border-0 relative group bg-white">
      {/* Product Image */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden relative border border-slate-200">
        <Image 
          src={image} 
          alt={name} 
          fill 
          className="object-cover object-center"
        />
      </div>

      {/* Info & Controls */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4">
            <Link href={`/product/${product.slug}`} className="font-bold text-slate-800 text-lg hover:text-blue-600 transition line-clamp-2">
              {product.name}
            </Link>
            {isPending && <Loader2 className="animate-spin text-blue-500 flex-shrink-0" size={18} />}
          </div>
          
          {variant && (
            <div className="text-sm text-slate-500 mt-1 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded">
              {variant.name}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold text-slate-900 text-lg">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-sm text-slate-400 line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Quantity & Remove */}
        <div className="flex items-center justify-between mt-4 sm:mt-0">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
            <button 
              onClick={() => handleUpdateQty(item.quantity - 1)}
              disabled={isPending}
              className="p-2 hover:bg-white hover:text-blue-600 transition rounded-l-lg disabled:opacity-50"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
            <button 
              onClick={() => handleUpdateQty(item.quantity + 1)}
              disabled={isPending}
              className="p-2 hover:bg-white hover:text-blue-600 transition rounded-r-lg disabled:opacity-50"
            >
              <Plus size={14} />
            </button>
          </div>

          <button 
            onClick={handleRemove}
            disabled={isPending}
            className="text-sm text-red-500 flex items-center gap-1.5 hover:text-red-700 transition font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}