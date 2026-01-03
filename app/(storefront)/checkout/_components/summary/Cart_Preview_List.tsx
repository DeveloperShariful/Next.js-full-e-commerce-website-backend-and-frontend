// File: app/(storefront)/checkout/_components/summary/Cart_Preview_List.tsx
"use client";

import Image from "next/image";

interface CartItemProps {
  items: any[];
}

export const Cart_Preview_List = ({ items }: CartItemProps) => {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        // ইমেজ লজিক: ভেরিয়েন্ট ইমেজ > প্রোডাক্ট ইমেজ > ডিফল্ট
        const image = item.variant?.image || item.product.featuredImage || item.product.images?.[0]?.url || "/placeholder.jpg";
        
        // প্রাইস লজিক
        const price = item.variant 
            ? (item.variant.salePrice || item.variant.price) 
            : (item.product.salePrice || item.product.price);

        return (
          <div key={item.id} className="flex items-start gap-4 group">
            
            {/* Image with Badge */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
              <Image 
                src={image} 
                alt={item.product.name} 
                fill 
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300" 
              />
              <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-bl-md bg-gray-900 text-[10px] font-bold text-white shadow-sm">
                {item.quantity}
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-center min-h-[64px]">
              <span className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
                {item.product.name}
              </span>
              {item.variant?.name && (
                  <span className="text-xs text-gray-500 mt-1">
                    Variant: {item.variant.name}
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