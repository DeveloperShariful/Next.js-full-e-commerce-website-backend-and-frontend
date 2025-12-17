// components/front/product-view.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import useCart, { SafeProduct } from "@/hooks/use-cart";
import { Star, ShoppingCart, Heart, Truck, RefreshCcw, Check } from "lucide-react";
import { ProductVariant } from "@prisma/client";

interface ProductViewProps {
  product: SafeProduct & { variants: ProductVariant[] };
}

export default function ProductView({ product }: ProductViewProps) {
  const cart = useCart();
  
  // Image State (Default fallback)
  const defaultImage = product.featuredImage || product.images[0]?.url || "https://placehold.co/600x400";
  const [selectedImage, setSelectedImage] = useState(defaultImage);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );

  // Price Calculation (Fixed Type)
  const currentPrice = selectedVariant 
    ? Number(selectedVariant.price) 
    : Number(product.salePrice || product.price);

  const originalPrice = selectedVariant 
    ? (selectedVariant.salePrice ? Number(selectedVariant.price) : Number(selectedVariant.price)) 
    : Number(product.price);

  const onAddToCart = () => {
    cart.addItem(product, selectedVariant);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(p);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-10">
      
      {/* LEFT: IMAGE GALLERY */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
             <Image 
                src={selectedImage || defaultImage} // ✅ Safe Src
                alt={product.name} 
                fill 
                className="object-cover" 
                priority 
             />
        </div>
        
        {/* Thumbnails */}
        <div className="grid grid-cols-5 gap-3">
           {product.featuredImage && (
             <button 
               onClick={() => setSelectedImage(product.featuredImage!)}
               className={`relative aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === product.featuredImage ? 'border-blue-600' : 'border-transparent'}`}
             >
                <Image src={product.featuredImage} alt="Main" fill className="object-cover"/>
             </button>
           )}
           {product.images.map((img) => (
             <button 
               key={img.id}
               onClick={() => setSelectedImage(img.url)}
               className={`relative aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === img.url ? 'border-blue-600' : 'border-transparent'}`}
             >
                <Image src={img.url} alt="Gallery" fill className="object-cover"/>
             </button>
           ))}
        </div>
      </div>

      {/* RIGHT: PRODUCT INFO */}
      <div className="flex flex-col">
         <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{product.name}</h1>
         
         <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center text-yellow-400 text-sm">
               <Star fill="currentColor" size={16}/>
               <span className="text-slate-600 ml-1 font-medium">4.8 (120 Reviews)</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <span className="text-green-600 text-sm font-bold flex items-center gap-1">
               <Check size={16}/> In Stock
            </span>
         </div>

         {/* Price */}
         <div className="flex items-end gap-3 mb-8">
            <span className="text-4xl font-bold text-blue-600">
               {formatPrice(currentPrice)}
            </span>
            {/* Discount Display Logic */}
            {originalPrice > currentPrice && (
               <span className="text-xl text-slate-400 line-through mb-1">
                  {formatPrice(originalPrice)} {/* ✅ Type Fixed */}
               </span>
            )}
         </div>

         <p className="text-slate-600 leading-relaxed mb-8 border-b border-slate-100 pb-8">
            {product.shortDescription || product.description?.slice(0, 150) + "..."}
         </p>

         {/* Variant Selector */}
         {product.variants.length > 0 && (
            <div className="mb-8">
               <h3 className="font-bold text-slate-900 mb-3">Choose Option:</h3>
               <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                     <button
                       key={v.id}
                       onClick={() => {
                          setSelectedVariant(v);
                          if(v.image) setSelectedImage(v.image);
                       }}
                       className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          selectedVariant?.id === v.id 
                            ? "border-blue-600 bg-blue-50 text-blue-600" 
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                       }`}
                     >
                        {v.name}
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* Actions */}
         <div className="flex gap-4 mb-8">
            <button onClick={onAddToCart} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95">
               <ShoppingCart size={22}/> Add to Cart
            </button>
            <button className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
               <Heart size={22}/>
            </button>
         </div>

         {/* Features */}
         <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Truck size={16}/></div>
               Free Delivery over ৳5000
            </div>
            <div className="flex items-center gap-2">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><RefreshCcw size={16}/></div>
               30 Days Return
            </div>
         </div>
      </div>
    </div>
  );
}