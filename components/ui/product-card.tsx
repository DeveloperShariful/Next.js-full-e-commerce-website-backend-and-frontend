"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Eye, Star } from "lucide-react";
import { Product, Category, ProductImage } from "@prisma/client";
import { MouseEventHandler } from "react";
import useCart from "@/app/actions/storeFont/use-cart"; 

interface ProductCardProps {
  data: Product & {
    images: ProductImage[];
    category: Category | null;
  };
}

export default function ProductCard({ data }: ProductCardProps) {
  const cart = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(amount);
  };

  const price = Number(data.price);
  const salePrice = data.salePrice ? Number(data.salePrice) : null;
  const finalPrice = salePrice || price;

  const discount = salePrice 
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault(); 
    event.stopPropagation();
    
    // [FIXED] Manually mapping fields to match CartItem type
    cart.addItem({
      id: data.id,
      name: data.name,
      price: finalPrice,
      quantity: 1, // Default quantity
      cartItemId: `${data.id}-base`, // Generate unique ID
      image: data.featuredImage || data.images?.[0]?.url || "",
      category: data.category ? { name: data.category.name } : undefined
    });
  };

  const onPreview: MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.stopPropagation(); 
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 relative flex flex-col h-full">
      
      {/* Main Link Wrapper */}
      <Link href={`/product/${data.slug}`} className="block relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-pointer">
        {data.featuredImage || data.images?.[0]?.url ? (
          <Image 
            src={data.featuredImage || data.images[0].url} 
            alt={data.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">No Image</div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {salePrice && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                -{discount}%
                </span>
            )}
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2">
           <button 
             onClick={onAddToCart}
             className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-black shadow-lg"
           >
             <ShoppingCart size={16} /> Add
           </button>
           
           <Link 
             href={`/product/${data.slug}`} 
             onClick={onPreview}
             className="p-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-50 shadow-lg border border-slate-200"
           >
             <Eye size={16} />
           </Link>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
            {data.category?.name || "Accessories"}
        </div>
        
        <Link href={`/product/${data.slug}`} className="block mb-2">
          <h3 className="font-bold text-slate-800 text-base truncate group-hover:text-blue-600 transition">
            {data.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {salePrice ? (
              <>
                <span className="text-xs text-slate-400 line-through font-medium">
                    {formatPrice(price)}
                </span>
                <span className="text-lg font-bold text-slate-900">
                    {formatPrice(salePrice)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-900">
                  {formatPrice(price)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-50 px-1.5 py-0.5 rounded">
             <Star size={12} fill="currentColor" />
             <span className="text-slate-700">4.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}