// File: app/product/[slug]/_components/product-view.tsx

"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { addToCart } from "@/app/actions/storefront/product/add-to-cart"; 
import { 
  ShoppingCart, Heart, Minus, Plus, CheckCircle2, 
  PackageX, AlertCircle, Loader2, CalendarClock, Download, RefreshCw 
} from "lucide-react";
import { toast } from "sonner"; 
import { useGlobalStore } from "@/app/providers/global-store-provider"; 
import { format } from "date-fns";

interface ProductViewProps {
  product: {
    id: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    price: number;
    salePrice: number | null;
    images: { url: string; altText: string | null }[];
    featuredImage: string | null;
    category: { name: string } | null;
    brand: { name: string } | null;
    sku: string | null;
    
    // Inventory
    stock: number;
    trackQuantity: boolean;
    backorderStatus: "DO_NOT_ALLOW" | "ALLOW" | "ALLOW_BUT_NOTIFY";
    
    // Schema Updates
    isPreOrder: boolean;
    preOrderReleaseDate: string | Date | null;
    isDownloadable: boolean;

    // Variants & Plans
    variants: { 
      id: string; 
      name: string; 
      price: number | null;
      salePrice: number | null;
      stock: number; 
      trackQuantity: boolean; 
    }[];
    subscriptionPlans: {
      id: string;
      name: string;
      price: number;
      interval: string;
      intervalCount: number;
    }[];
  }
}

export default function ProductView({ product }: ProductViewProps) {
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();
  
  // States
  const [selectedImage, setSelectedImage] = useState(product.featuredImage || product.images[0]?.url || "");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false); 

  // New States for Schema Support
  const [purchaseType, setPurchaseType] = useState<"onetime" | "subscription">("onetime");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    product.subscriptionPlans.length > 0 ? product.subscriptionPlans[0].id : null
  );

  const currentVariant = product.variants.find(v => v.id === selectedVariantId);
  const currentPlan = product.subscriptionPlans.find(p => p.id === selectedPlanId);

  // Stock & Status Logic (Updated for Pre-order & Digital)
  const getStockStatus = () => {
    // 1. Pre-order Logic
    if (product.isPreOrder) {
        const dateStr = product.preOrderReleaseDate 
            ? format(new Date(product.preOrderReleaseDate), "MMM d") 
            : "Soon";
        return { 
            available: true, 
            label: `Pre-Order (Ships ${dateStr})`, 
            color: "text-purple-600", 
            icon: CalendarClock,
            btnText: "Pre-Order Now"
        };
    }

    // 2. Digital Product Logic
    if (product.isDownloadable) {
        return { 
            available: true, 
            label: "Instant Download", 
            color: "text-blue-600", 
            icon: Download,
            btnText: "Download Now"
        };
    }

    const stockLevel = currentVariant ? currentVariant.stock : product.stock;
    const shouldTrack = currentVariant ? currentVariant.trackQuantity : product.trackQuantity;
    
    if (!shouldTrack) return { available: true, label: "In Stock", color: "text-green-600", icon: CheckCircle2, btnText: "Add to Cart" };

    const backorder = product.backorderStatus;

    if (stockLevel > 0) {
      if (stockLevel < 5) return { available: true, label: `Only ${stockLevel} left!`, color: "text-orange-600", icon: AlertCircle, btnText: "Add to Cart" };
      return { available: true, label: "In Stock", color: "text-green-600", icon: CheckCircle2, btnText: "Add to Cart" };
    } else {
      if (backorder === "ALLOW" || backorder === "ALLOW_BUT_NOTIFY") {
        return { available: true, label: "Available on Backorder", color: "text-blue-600", icon: AlertCircle, btnText: "Backorder" };
      }
      return { available: false, label: "Out of Stock", color: "text-red-600", icon: PackageX, btnText: "Out of Stock" };
    }
  };

  const { available, label, color, icon: StockIcon, btnText } = getStockStatus();

  // Price Logic (Updated for Subscription)
  const getDisplayPrice = () => {
    if (purchaseType === "subscription" && currentPlan) {
        return Number(currentPlan.price);
    }
    if (currentVariant) {
        return Number(currentVariant.salePrice || currentVariant.price);
    }
    return Number(product.salePrice || product.price);
  };

  const getOriginalPrice = () => {
    if (purchaseType === "subscription") return null;
    if (currentVariant) {
        return currentVariant.salePrice ? Number(currentVariant.price) : null;
    }
    return product.salePrice ? Number(product.price) : null;
  };

  const displayPrice = getDisplayPrice();
  const originalPrice = getOriginalPrice();

  // 🛒 Add to Cart Handler
  const onAddToCart = () => {
    if (product.variants.length > 0 && purchaseType === 'onetime' && !selectedVariantId) {
      toast.error("Please select an option first!");
      return;
    }

    if (!available) {
      toast.error("Sorry, this item is out of stock.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await addToCart({
            productId: product.id,
            quantity: quantity,
            variantId: purchaseType === 'onetime' ? (selectedVariantId || undefined) : undefined,
            // Logic to handle subscription plan would go here if backend supports it
        });

        if (res.success) {
            toast.success("Added to cart successfully!");
        } else {
            toast.error(res.message);
        }
      } catch (error) {
        console.error("Error calling server action:", error);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pt-8">
      
      {/* --- LEFT: IMAGE GALLERY --- */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
           <Image 
             src={selectedImage || "/placeholder.jpg"} 
             alt={product.name} 
             fill 
             className="object-cover transition-transform duration-500 group-hover:scale-105"
             priority
           />
           {(product.salePrice || (currentVariant && currentVariant.salePrice)) && (
             <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
               SALE
             </span>
           )}
        </div>
        
        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
             {product.images.map((img, i) => (
               <button 
                 key={i} 
                 onClick={() => setSelectedImage(img.url)}
                 className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                   selectedImage === img.url ? "border-slate-900 opacity-100" : "border-transparent opacity-70 hover:opacity-100"
                 }`}
               >
                  <Image src={img.url} alt={img.altText || "Product thumbnail"} fill className="object-cover"/>
               </button>
             ))}
          </div>
        )}
      </div>

      {/* --- RIGHT: PRODUCT INFO --- */}
      <div className="flex flex-col h-full">
         
         {product.brand && (
            <span className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wider">
              {product.brand.name}
            </span>
         )}

         <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 leading-tight">
           {product.name}
         </h1>

         {/* ✅ FIX: Added break-words and max-w-full to prevent layout breakage */}
         {product.shortDescription && (
           <div className="text-slate-500 text-base leading-relaxed mb-6 border-b border-gray-100 pb-6 max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: product.shortDescription }} 
           />
         )}

         <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
               <span className="text-3xl font-bold text-slate-900">{formatPrice(displayPrice)}</span>
               {originalPrice && (
                 <span className="text-lg text-slate-400 line-through decoration-slate-300">
                   {formatPrice(originalPrice)}
                 </span>
               )}
               {purchaseType === 'subscription' && currentPlan && (
                 <span className="text-sm font-medium text-slate-500">
                   / {currentPlan.interval}
                 </span>
               )}
            </div>

            <div className={`flex items-center gap-1.5 text-sm font-bold ${color} bg-gray-50 px-3 py-1.5 rounded-lg border border-slate-100`}>
               <StockIcon size={16}/>
               {label}
            </div>
         </div>

         {/* ✅ SUBSCRIPTION SELECTOR (Minimal Design) */}
         {product.subscriptionPlans.length > 0 && (
             <div className="mb-6 space-y-3">
                 <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${purchaseType === 'onetime' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}>
                     <input type="radio" name="ptype" checked={purchaseType === 'onetime'} onChange={() => setPurchaseType('onetime')} className="accent-slate-900 w-4 h-4"/>
                     <span className="font-medium text-slate-700">One-time purchase</span>
                 </label>

                 <div className={`p-3 rounded-xl border transition-all ${purchaseType === 'subscription' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="ptype" checked={purchaseType === 'subscription'} onChange={() => setPurchaseType('subscription')} className="accent-slate-900 w-4 h-4"/>
                        <span className="font-medium text-slate-700 flex items-center gap-2">Subscribe & Save <RefreshCw size={14}/></span>
                    </label>
                    
                    {purchaseType === 'subscription' && (
                        <select 
                          value={selectedPlanId || ""} 
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="mt-3 w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none bg-white"
                        >
                            {product.subscriptionPlans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} ({formatPrice(Number(plan.price))} / {plan.interval})
                                </option>
                            ))}
                        </select>
                    )}
                 </div>
             </div>
         )}

         {/* Variants Selector */}
         {product.variants.length > 0 && purchaseType === 'onetime' && (
            <div className="space-y-4 mb-8">
               <label className="text-sm font-bold text-slate-900 uppercase tracking-wide flex justify-between">
                 Select Option 
                 {currentVariant && <span className="text-slate-500 font-normal normal-case">{currentVariant.name}</span>}
               </label>
               <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => {
                      const isVariantOOS = v.trackQuantity && v.stock <= 0 && product.backorderStatus === 'DO_NOT_ALLOW';
                      
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          disabled={isVariantOOS}
                          className={`
                            relative px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all
                            ${selectedVariantId === v.id 
                              ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" 
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }
                            ${isVariantOOS ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 decoration-slice" : ""}
                          `}
                        >
                          {v.name} 
                          {isVariantOOS && <span className="text-xs ml-1 text-red-400">(OOS)</span>}
                        </button>
                      );
                  })}
               </div>
            </div>
         )}

         {/* --- UPDATED RESPONSIVE QUANTITY & ACTIONS SECTION --- */}
         <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 mt-auto">
            
            {/* Quantity Selector - Mobile Full Width */}
            <div className="flex w-full sm:w-32 items-center border border-slate-300 rounded-xl h-12">
               <button 
                 onClick={() => setQuantity(Math.max(1, quantity - 1))}
                 className="flex-1 sm:flex-none w-auto sm:w-10 h-full flex items-center justify-center hover:bg-slate-50 transition text-slate-600 rounded-l-xl disabled:opacity-50"
                 disabled={isPending}
               >
                  <Minus size={16}/>
               </button>
               <span className="flex-1 text-center font-bold text-slate-800 tabular-nums">{quantity}</span>
               <button 
                 onClick={() => setQuantity(quantity + 1)}
                 className="flex-1 sm:flex-none w-auto sm:w-10 h-full flex items-center justify-center hover:bg-slate-50 transition text-slate-600 rounded-r-xl disabled:opacity-50"
                 disabled={isPending}
               >
                  <Plus size={16}/>
               </button>
            </div>

            {/* Action Buttons Wrapper - Mobile Stacked below, Desktop Side-by-Side */}
            <div className="flex w-full gap-4 sm:flex-1">
                <button 
                   onClick={onAddToCart}
                   disabled={!available || isPending}
                   className={`
                     flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap
                     ${available && !isPending
                       ? "bg-slate-900 hover:bg-slate-800 hover:shadow-xl" 
                       : "bg-gray-400 cursor-not-allowed shadow-none"
                     }
                   `}
                >
                   {isPending ? (
                     <Loader2 className="animate-spin h-5 w-5" />
                   ) : available ? (
                     <> <ShoppingCart size={20}/> {btnText} </>
                   ) : (
                     "Out of Stock"
                   )}
                </button>

                <button 
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`h-12 w-12 border rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                    isWishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                  }`}
                >
                   <Heart size={22} fill={isWishlisted ? "currentColor" : "none"}/>
                </button>
            </div>

         </div>

         {/* Footer Meta */}
         <div className="flex items-center gap-6 mt-6 text-xs text-slate-400 font-medium border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2">
               <span className="text-slate-300">SKU:</span>
               <span className="text-slate-600">{currentVariant?.id ? "N/A (Var)" : product.sku || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-slate-300">Category:</span>
               <span className="text-slate-600">{product.category?.name || "Uncategorized"}</span>
            </div>
         </div>

      </div>
    </div>
  );
}