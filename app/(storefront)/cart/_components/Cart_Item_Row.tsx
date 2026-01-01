// File: app/(storefront)/cart/_components/Cart_Item_Row.tsx

"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateItemQuantity } from "@/app/actions/storefront/cart/update-item-qty";
import { removeCartItem } from "@/app/actions/storefront/cart/remove-item";
import { toast } from "sonner";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface ItemProps {
  item: any; // Prisma CartItem with includes
}

export const Cart_Item_Row = ({ item }: ItemProps) => {
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  // 1. দাম এবং ইমেজ নির্ধারণ (ভেরিয়েন্ট বা মেইন প্রোডাক্ট)
  const product = item.product;
  const variant = item.variant;

  const price = variant 
    ? (variant.salePrice || variant.price) 
    : (product.salePrice || product.price);

  const image = variant?.image || product.featuredImage || product.images?.[0]?.url || "/placeholder.png";
  const name = product.name;
  const subName = variant ? variant.name : null;
  const productLink = `/products/${product.slug}`;

  // 2. কোয়ান্টিটি আপডেট হ্যান্ডলার
  const handleQuantity = (newQty: number) => {
    if (newQty < 1) return;
    
    startTransition(async () => {
      const res = await updateItemQuantity(item.id, newQty);
      if (!res.success) {
        toast.error(res.message);
      }
    });
  };

  // 3. ডিলিট হ্যান্ডলার
  const handleRemove = () => {
    if (!confirm("Remove this item?")) return;
    
    startTransition(async () => {
      const res = await removeCartItem(item.id);
      if (res.success) {
        toast.success("Item removed");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:items-center bg-white transition-colors hover:bg-gray-50/50">
      
      {/* Product Info (Mobile: Full Width, Desktop: col-span-6) */}
      <div className="flex items-center gap-4 md:col-span-6">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
          <Image 
            src={image} 
            alt={name} 
            fill 
            className="object-cover object-center"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={productLink} className="text-sm font-medium text-gray-900 hover:underline line-clamp-2">
            {name}
          </Link>
          {subName && (
            <p className="text-xs text-muted-foreground mt-1">Variant: {subName}</p>
          )}
          {/* Mobile Price View */}
          <div className="md:hidden mt-1 font-semibold text-sm">
            {formatPrice(price)}
          </div>
        </div>
      </div>

      {/* Quantity Control (Desktop: col-span-2) */}
      <div className="flex items-center justify-between md:justify-center md:col-span-2">
        <span className="text-sm text-gray-500 md:hidden">Qty:</span>
        <div className="flex items-center border rounded-md bg-white shadow-sm">
          <button
            onClick={() => handleQuantity(item.quantity - 1)}
            disabled={isPending || item.quantity <= 1}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
          </span>
          <button
            onClick={() => handleQuantity(item.quantity + 1)}
            disabled={isPending}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Unit Price (Desktop Only: col-span-2) */}
      <div className="hidden md:flex justify-end col-span-2 text-sm text-gray-600">
        {formatPrice(price)}
      </div>

      {/* Total & Remove (Desktop: col-span-2) */}
      <div className="flex items-center justify-between md:justify-end gap-4 md:col-span-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0">
        <span className="font-bold text-gray-900 md:text-right">
          {formatPrice(price * item.quantity)}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isPending}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
};