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
  item: any; 
}

export const Cart_Item_Row = ({ item }: ItemProps) => {
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  const product = item.product;
  const variant = item.variant;

  const price = variant 
    ? (variant.salePrice || variant.price) 
    : (product.salePrice || product.price);

  const image = variant?.image || product.featuredImage || product.images?.[0]?.url || "/placeholder.png";
  const name = product.name;
  const subName = variant ? variant.name : null;
  const productLink = `/products/${product.slug}`;

  // Quantity Handler
  const handleQuantity = (newQty: number) => {
    if (newQty < 1) return;
    startTransition(async () => {
      const res = await updateItemQuantity(item.id, newQty);
      if (!res.success) toast.error(res.message);
    });
  };

  // Remove Handler
  const handleRemove = () => {
    if (!confirm("Remove this item?")) return;
    startTransition(async () => {
      const res = await removeCartItem(item.id);
      if (res.success) toast.success("Item removed");
      else toast.error(res.message);
    });
  };

  return (
    // ✅ FIX: "md:" ক্লাসগুলো সরিয়ে শুধু flex-col রাখা হয়েছে (মোবাইল স্টাইল)
    <div className="group relative flex flex-col gap-4 p-4 bg-white transition-colors hover:bg-gray-50/50">
      
      {/* 1. TOP SECTION: Image + Info + Unit Price */}
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
          <Image src={image} alt={name} fill className="object-cover object-center" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={productLink} className="text-sm font-medium text-gray-900 hover:underline line-clamp-2">
            {name}
          </Link>
          {subName && <p className="text-xs text-muted-foreground mt-1">Variant: {subName}</p>}
          
          {/* Unit Price (Always visible now) */}
          <div className="mt-1 font-semibold text-sm text-gray-600">
            {formatPrice(price)}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: Controls + Total Price */}
      <div className="flex items-center justify-between border-t pt-4 mt-2">
        
        {/* Quantity Controls */}
        <div className="flex items-center border rounded-md bg-white shadow-sm h-9">
          <button
            onClick={() => handleQuantity(item.quantity - 1)}
            disabled={isPending || item.quantity <= 1}
            className="w-9 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors border-r"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
          </span>
          <button
            onClick={() => handleQuantity(item.quantity + 1)}
            disabled={isPending}
            className="w-9 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors border-l"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Total Price & Delete */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900 text-lg">
            {formatPrice(price * item.quantity)}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isPending}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors h-9 w-9"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

      </div>

    </div>
  );
};