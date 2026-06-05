// File: app/(frontend)/my-account/_components/wishlist-view.tsx

"use client";

import { useState } from "react";
import { Heart, Trash2, ShoppingCart, Box } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    featuredImage: string | null;
    stock: number;
  };
}

interface Props {
  initialWishlist: WishlistItem[];
}

export default function WishlistView({ initialWishlist }: Props) {
  const { formatPrice } = useGlobalStore();
  const [items, setItems] = useState<WishlistItem[]>(initialWishlist);

  const handleRemove = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Item removed from wishlist.");
    // Call server action / fetch in real app to sync DB
  };

  const handleAddToCart = (item: WishlistItem) => {
    toast.success(`${item.product.name} added to cart!`);
    // Connect with your Cart Context / Context action here
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th className="px-4 py-2 font-semibold">Product</th>
                <th className="px-4 py-2 font-semibold">Unit Price</th>
                <th className="px-4 py-2 font-semibold">Stock Status</th>
                <th className="px-4 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#50575e] bg-[#f6f7f7] italic">
                     <Heart className="w-8 h-8 text-[#c3c4c7] mx-auto mb-2" />
                     Your wishlist is empty. Browse products to add them!
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const inStock = item.product.stock > 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#f6f7f7] transition-colors">
                      {/* Product details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center shrink-0">
                                {item.product.featuredImage ? (
                                    <img src={item.product.featuredImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Box className="w-4 h-4 text-[#c3c4c7]" />
                                )}
                            </div>
                            <span className="font-semibold text-[#2271b1] hover:underline cursor-pointer">{item.product.name}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-mono font-medium">
                        {formatPrice(Number(item.product.price))}
                      </td>

                      {/* Stock Status */}
                      <td className="px-4 py-3">
                        {inStock ? (
                            <span className="text-[#00a32a] font-semibold">In Stock</span>
                        ) : (
                            <span className="text-[#d63638] font-semibold">Out of Stock</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-3">
                            {inStock && (
                                <button 
                                    onClick={() => handleAddToCart(item)}
                                    className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white rounded-sm text-[12px] font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                                </button>
                            )}
                            <button 
                                onClick={() => handleRemove(item.id)}
                                className="p-1.5 border border-[#8c8f94] hover:bg-[#fcf0f1] hover:border-[#d63638]/30 hover:text-[#d63638] rounded-sm transition-colors text-[#50575e]"
                                title="Remove item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}