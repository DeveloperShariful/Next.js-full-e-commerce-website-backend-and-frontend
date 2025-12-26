// File: app/product/[slug]/_components/product-view.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import useCart from "@/app/actions/storefront/use-cart"; 
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // 🚀 Import

// [FIX] Detailed Type Definition
interface ProductViewProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    salePrice: number | null;
    images: { url: string }[];
    featuredImage: string | null;
    category: { name: string } | null;
    variants: { id: string; name: string; price: number | null; stock: number }[];
    sku: string | null;
  }
}

export default function ProductView({ product }: ProductViewProps) {
  const cart = useCart();
  const { formatPrice } = useGlobalStore(); // 🚀 Global Currency
  
  // States
  const [selectedImage, setSelectedImage] = useState(product.featuredImage || product.images[0]?.url || "");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Price Calculation
  const currentPrice = product.salePrice ? product.salePrice : product.price;
  
  // Handle Variant Selection
  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
  };

  const onAddToCart = () => {
    // Check Variant
    if (product.variants.length > 0 && !selectedVariant) {
      toast.error("Please select a variant option");
      return;
    }

    const variantInfo = product.variants.find((v) => v.id === selectedVariant);
    const finalPrice = variantInfo?.price ? Number(variantInfo.price) : Number(currentPrice);

    cart.addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      quantity: quantity,
      image: selectedImage,
      cartItemId: `${product.id}-${selectedVariant || 'base'}`,
      variantId: selectedVariant || undefined,
      selectedVariantName: variantInfo?.name,
      category: product.category ? { name: product.category.name } : undefined
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pt-8">
      
      {/* LEFT: IMAGE GALLERY */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
           <Image 
             src={selectedImage || "/placeholder.jpg"} 
             alt={product.name} 
             fill 
             className="object-cover"
             priority
           />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
           {product.images.map((img, i) => (
             <button 
               key={i} 
               onClick={() => setSelectedImage(img.url)}
               className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === img.url ? "border-blue-600" : "border-transparent"}`}
             >
                <Image src={img.url} alt="Thumbnail" fill className="object-cover"/>
             </button>
           ))}
        </div>
      </div>

      {/* RIGHT: DETAILS */}
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-2xl font-bold text-blue-600">{formatPrice(currentPrice)}</p>
               {product.salePrice && (
                 <p className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</p>
               )}
               {product.category && (
                 <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {product.category.name}
                 </span>
               )}
            </div>
         </div>

         {/* VARIANTS */}
         {product.variants.length > 0 && (
            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-700">Select Option:</label>
               <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                     <button
                       key={v.id}
                       onClick={() => handleVariantChange(v.id)}
                       className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          selectedVariant === v.id 
                          ? "border-blue-600 bg-blue-50 text-blue-700" 
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                       }`}
                     >
                        {v.name} 
                        {v.price && <span className="ml-1 text-slate-400"> ({formatPrice(v.price)})</span>}
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* QUANTITY & ACTIONS */}
         <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center border border-slate-300 rounded-lg">
               <button 
                 onClick={() => setQuantity(Math.max(1, quantity - 1))}
                 className="p-3 hover:bg-slate-100 transition text-slate-600"
               >
                  <Minus size={16}/>
               </button>
               <span className="w-12 text-center font-bold text-slate-800">{quantity}</span>
               <button 
                 onClick={() => setQuantity(quantity + 1)}
                 className="p-3 hover:bg-slate-100 transition text-slate-600"
               >
                  <Plus size={16}/>
               </button>
            </div>

            <button 
               onClick={onAddToCart}
               className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
               <ShoppingCart size={20}/> Add to Cart
            </button>

            <button className="p-3 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
               <Heart size={20}/>
            </button>
         </div>

         {/* INFO BADGES */}
         <div className="text-xs text-slate-400 pt-4 flex gap-4">
            <span>SKU: {product.sku || "N/A"}</span>
            <span>Category: {product.category?.name || "Uncategorized"}</span>
         </div>

      </div>
    </div>
  );
}