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

  // ✅ FIX: Outer wrapper is now a DIV, not a LINK
  return (
    <div className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 relative flex flex-col h-full">
      
      {/* Image Link Wrapper */}
      <div className="block relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-pointer">
        <Link href={`/product/${data.slug}`} className="absolute inset-0">
            {data.featuredImage || data.images?.[0]?.url ? (
            <Image 
                src={data.featuredImage || data.images[0].url} 
                alt={data.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
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

        {/* Overlay Actions */}
        <div className="absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-2">
           <button 
             onClick={onAddToCart}
             disabled={isPending}
             className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-black shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
                <>
                  <ShoppingCart size={16} /> Add
                </>
             )}
           </button>
           
           {/* Eye Icon Link (Now safe because parent is DIV) */}
           <Link 
             href={`/product/${data.slug}`} 
             className="p-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-50 shadow-lg border border-slate-200 flex items-center justify-center"
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