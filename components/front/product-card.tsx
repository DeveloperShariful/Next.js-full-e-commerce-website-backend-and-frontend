"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@prisma/client";
import { Heart, ShoppingCart, Eye } from "lucide-react";

// প্রোডাক্ট টাইপ ডিফিনিশন (Category সহ)
interface ProductCardProps {
  product: Product & {
    category: { name: string; slug: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // ডিসকাউন্ট ক্যালকুলেশন
  const discount = product.salePrice && product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* 1. Image Section */}
      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        {product.featuredImage ? (
          <Image 
            src={product.featuredImage} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 text-sm font-medium">
            No Image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                -{discount}% OFF
            </span>
            )}
            {product.status === 'draft' && (
             <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                DRAFT
            </span>
            )}
        </div>

        {/* Overlay Actions (Hover) */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 px-4">
           
           <button 
             className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition transform hover:-translate-y-1" 
             title="Add to Cart"
           >
              <ShoppingCart size={18} />
           </button>
           
           <Link 
             href={`/product/${product.slug}`}
             className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition transform hover:-translate-y-1" 
             title="View Details"
           >
              <Eye size={18} />
           </Link>

           <button 
             className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-pink-500 hover:text-white transition transform hover:-translate-y-1" 
             title="Add to Wishlist"
           >
              <Heart size={18} />
           </button>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category */}
        <div className="text-xs text-slate-500 mb-1 hover:text-blue-600 transition">
            {product.category?.name || "Uncategorized"}
        </div>

        {/* Title */}
        <Link href={`/product/${product.slug}`} className="flex-grow">
          <h3 className="font-bold text-slate-800 text-[15px] leading-tight mb-2 hover:text-blue-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Price & Rating */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            {product.salePrice && product.price > product.salePrice ? (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-lg">৳{product.salePrice}</span>
                    <span className="text-xs text-slate-400 line-through">৳{product.price}</span>
                </div>
            ) : (
                <span className="font-bold text-slate-900 text-lg">৳{product.price}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}