// components/ProductCard.tsx

'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { useCart } from '@/context/CartContext';
import { useCompare } from '@/context/CompareContext'; 
import toast from 'react-hot-toast';
import { StorefrontProduct } from '@/app/(storefront)/types'; // ১০০% ডাটাবেজ অরিজিনাল টাইপ ইম্পোর্ট

// পুরানো interface Product পুরোপুরি মুছে ফেলা হয়েছে। এখন সরাসরি StorefrontProduct ব্যবহার হচ্ছে।
interface ProductCardProps {
  product: StorefrontProduct;
}

const StarRating = ({ rating, count }: { rating: number, count: number }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="text-black-500 text-base mb-4 flex items-center justify-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
      {halfStar && <span key="half">⭐</span>}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
      
      {count > 0 && (
        <span className="text-gray-500 text-xs ml-2 font-normal">
          ({rating.toFixed(1)}) ({count} customer review{count > 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { addToCompare, compareItems } = useCompare(); 
  const router = useRouter();

  const parsePrice = (priceStr?: string | null): number => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const regularPriceNum = parsePrice(product.regularPrice);
  const salePriceNum = parsePrice(product.salePrice);
  const discountPercent = regularPriceNum > 0 && salePriceNum < regularPriceNum 
      ? Math.round(((regularPriceNum - salePriceNum) / regularPriceNum) * 100) 
      : 0;

  const isVariableProduct = product.__typename === 'VariableProduct';
  const isAlreadyInCompare = compareItems.some(item => item.databaseId === product.databaseId);

  const handleAddToCartClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVariableProduct) {
        router.push(`/product/${product.slug}`);
        return;
    }
    
    if (!product || !product.databaseId) {
      console.error("Incomplete product data in ProductCard:", product);
      return;
    }

    setIsAdding(true);
    
    try {
        await addToCart({
            id: product.id,
            databaseId: product.databaseId,
            name: product.name,
            price: product.price || "0.00",
            image: product.image?.sourceUrl || null,
            slug: product.slug,
        }, 1);
    } catch (error) {
        console.error("Error adding item from ProductCard", error);
    } finally {
        setIsAdding(false);
    }
  };

  const handleCompareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVariableProduct) {
      toast.error("Variable products cannot be compared directly. Please visit the product page.");
      return;
    }

    addToCompare({
      id: product.id,
      databaseId: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price || "0.00",
      image: product.image?.sourceUrl || undefined,
      attributes: product.attributes?.nodes || [] 
    });
  };

 return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group h-full relative">
        
        {/* Compare Button */}
        <button 
          onClick={handleCompareClick}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-20 shadow-sm transition-all duration-300 border ${
            isAlreadyInCompare 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-blue-600'
          }`}
          title={isAlreadyInCompare ? "Added to Compare" : "Add to Compare"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="3" x2="16" y2="21"></line><line x1="8" y1="3" x2="8" y2="21"></line><path d="M20 16l-4 4-4-4"></path><path d="M4 8l4-4 4 4"></path>
          </svg>
          <span className="text-xs font-bold leading-none tracking-wide">
            {isAlreadyInCompare ? 'Added' : 'Compare'}
          </span>
        </button>
        
        <Link href={`/product/${product.slug}`} className="flex flex-col flex-grow no-underline text-inherit z-10">
            <div className="relative w-full aspect-square bg-gray-50 p-1 overflow-hidden">
                {product.onSale && discountPercent > 0 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold z-10 shadow-sm">
                        -{discountPercent}%
                    </div>
                )}
                
                {product.image?.sourceUrl ? ( 
                  <Image 
                    src={product.image.sourceUrl} 
                    width={1000} 
                    height={1000} 
                    alt={product.name} 
                    className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:scale-110" 
                  /> 
                ) : ( 
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div> 
                )}
            </div>
            
            <div className="p-5 text-center flex flex-col flex-grow">
                 <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight min-h-[3rem] line-clamp-2">
                    {product.name}
                 </h3>

                {typeof product.averageRating === 'number' ? (
                    <StarRating rating={product.averageRating} count={product.reviewCount || 0} />
                ) : (
                    <div className="h-6 mb-4"></div> 
                )}
                
                <div className="flex justify-center items-baseline gap-2 mb-4 h-2">
                    {product.onSale && product.salePrice ? (
                        <>
                            <span className="text-sm font-semibold text-gray-400 line-through" dangerouslySetInnerHTML={{ __html: product.regularPrice || '' }} />
                            <span className="text-xl font-extrabold text-red-600" dangerouslySetInnerHTML={{ __html: product.salePrice }} />
                        </>
                    ) : (
                        <div className="text-xl font-extrabold text-gray-900" dangerouslySetInnerHTML={{ __html: product.price || 'Price not available' }} />
                    )}
                </div>
            </div>
        </Link>
        
        <div className="px-2 pb-5 z-10">
            <button 
                className="w-full py-2 px-3 text-base font-bold text-white bg-gray-900 border-2 border-gray-900 rounded-full cursor-pointer transition-all duration-300 hover:bg-white hover:text-gray-900 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 disabled:hover:bg-gray-300" 
                onClick={handleAddToCartClick}
                disabled={isAdding} 
            >
                {isAdding ? 'Adding...' : (isVariableProduct ? 'Select Options' : 'Add to Cart')}
            </button>
        </div>
    </div>
  );
}