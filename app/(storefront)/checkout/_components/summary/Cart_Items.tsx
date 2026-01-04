// File: app/(storefront)/checkout/_components/summary/Cart_Items.tsx

"use client";

import Image from "next/image";

interface CartItemProps {
  items: any[];
}

export const Cart_Items = ({ items }: CartItemProps) => {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        // Image Logic: Variant > Product > Default
        const image = item.variant?.image || item.product.featuredImage || item.product.images?.[0]?.url || "/placeholder.jpg";
        
        // Price Logic
        const price = item.variant 
            ? (item.variant.salePrice || item.variant.price) 
            : (item.product.salePrice || item.product.price);

        return (
          <div key={item.id} className="flex items-start gap-4 group">
            
            {/* Image with Qty Badge */}
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
              <Image 
                src={image} 
                alt={item.product.name} 
                fill 
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300" 
              />
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-gray-900 text-[10px] font-bold text-white shadow-sm">
                {item.quantity}
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-center min-h-[56px]">
              <span className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                {item.product.name}
              </span>
              {item.variant?.name && (
                  <span className="text-xs text-gray-500 mt-0.5">
                    {item.variant.name}
                  </span>
              )}
            </div>

            {/* Price */}
            <div className="font-semibold text-gray-900 text-sm pt-1">
              ${(price * item.quantity).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};