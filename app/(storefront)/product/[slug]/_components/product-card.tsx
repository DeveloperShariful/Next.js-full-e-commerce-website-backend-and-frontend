// File: app/(storefront)/product/[slug]/_components/product-card.tsx

// File: app/(storefront)/product/[slug]/_components/product-card.tsx

"use client";

import { useTransition, MouseEventHandler } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Eye, Star, Loader2 } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { addToCart } from "@/app/actions/storefront/product/add-to-cart";
import { toast } from "sonner";

interface ProductCardProps {
  data: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    featuredImage: string | null;
    images: { url: string }[];
    category: { name: string } | null;
    rating?: number;      // ✅ Real Rating
    reviewCount?: number; // ✅ Real Review Count
  };
}

export default function ProductCard({ data }: ProductCardProps) {
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  const price = Number(data.price);
  const salePrice = data.salePrice ? Number(data.salePrice) : null;
  const discount = salePrice 
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  // ✅ Image Logic for Hover Effect
  const mainImage = data.featuredImage || data.images?.[0]?.url;
  const hoverImage = data.images?.[1]?.url; // গ্যালারির দ্বিতীয় ইমেজ

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault(); 
    event.stopPropagation();
    
    startTransition(async () => {
      const res = await addToCart({
        productId: data.id,
        quantity: 1,
      });

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      
      {/* ✅ Image Wrapper: Aspect Square & Hover Effect */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Link href={`/product/${data.slug}`} className="block w-full h-full">
            {mainImage ? (
                <>
                    {/* Main Image */}
                    <Image 
                        src={mainImage} 
                        alt={data.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover transition-all duration-500 ${hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
                    />
                    {/* Hover Image (Show only if available) */}
                    {hoverImage && (
                        <Image 
                            src={hoverImage} 
                            alt={data.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-105"
                        />
                    )}
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-300 bg-gray-100">
                   No Image
                </div>
            )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
            {salePrice && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                -{discount}%
                </span>
            )}
        </div>

        {/* Quick View Icon (Only Visible on Hover) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <Link 
              href={`/product/${data.slug}`} 
              className="h-8 w-8 bg-white text-slate-900 rounded-full hover:bg-slate-900 hover:text-white shadow-md flex items-center justify-center transition-colors"
            >
              <Eye size={16} />
            </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
            {data.category?.name || "Product"}
        </div>
        
        <Link href={`/product/${data.slug}`} className="block mb-2">
          <h3 className="font-bold text-slate-800 text-base truncate group-hover:text-blue-600 transition" title={data.name}>
            {data.name}
          </h3>
        </Link>
        
        {/* Price & Real Rating Row */}
        <div className="flex items-end justify-between mb-4">
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
          
          {/* ✅ Real Rating from Database */}
          <div className="flex items-center gap-1 text-slate-700 text-xs font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
             <Star size={12} className="text-yellow-400 fill-yellow-400" />
             <span>{data.rating ? Number(data.rating).toFixed(1) : "0.0"}</span>
             <span className="text-slate-400 font-normal ml-0.5">({data.reviewCount || 0})</span>
          </div>
        </div>

        {/* ✅ Add to Cart Button (Always Visible) */}
        <button 
            onClick={onAddToCart}
            disabled={isPending}
            className="mt-auto w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-black shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
            )}
        </button>
      </div>
    </div>
  );
}