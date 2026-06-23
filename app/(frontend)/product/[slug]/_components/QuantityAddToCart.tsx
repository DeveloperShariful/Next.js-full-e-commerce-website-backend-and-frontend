// app/product/[slug]/_components/QuantityAddToCart.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCompare } from '@/context/CompareContext'; 
import { toast } from 'sonner';

interface ProductForCart {
  id: string;
  databaseId: number;
  name: string;
  price?: string | null;
  image?: string | null;
  slug: string;
}

export default function QuantityAddToCart({ product }: { product: ProductForCart }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, loading: isCartLoading, closeMiniCart } = useCart();
  const { addToCompare, compareItems } = useCompare(); // <-- Compare Hook
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const router = useRouter();

  // প্রোডাক্টটি আগে থেকেই Compare লিস্টে আছে কিনা চেক করা হচ্ছে
  const isAlreadyInCompare = compareItems.some(item => item.databaseId === product.databaseId);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await addToCart(product, quantity);
      closeMiniCart();
      toast.dismiss();
      router.push('/checkout');
    } catch (error) {
      console.error("Failed to process 'Buy Now':", error);
      toast.dismiss();
      toast.error('Could not process order.');
      setIsBuying(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleCompareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCompare({
      id: product.id,
      databaseId: product.databaseId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image
    });
  };

  const isLoading = isCartLoading || isAdding || isBuying;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex w-full gap-2 mt-4">
        
        {/* ১. Quantity (Qty) */}
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={isLoading || quantity <= 1}
            aria-label="Decrease quantity"
            className="bg-gray-100 border-none py-1.5 px-3 md:px-4 cursor-pointer text-xl disabled:bg-gray-200 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            -
          </button>
          <span className="px-3 md:px-4 font-bold">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={isLoading}
            aria-label="Increase quantity"
            className="bg-gray-100 border-none py-1.5 px-3 md:px-4 cursor-pointer text-xl disabled:bg-gray-200 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            +
          </button>
        </div>
        
        {/* ২. Add to Cart */}
        <button
          className="flex-grow bg-black text-white border-none py-1.5 px-2 md:px-5 text-[1.2rem] md:text-2xl font-bold cursor-pointer rounded-md transition-colors duration-300 ease-in-out hover:bg-gray-800 disabled:bg-[#cccccc] disabled:cursor-not-allowed"
          onClick={handleAddToCart}
          disabled={isLoading}
        >
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>

        {/* ৩. Compare Button */}
        <button
          onClick={handleCompareClick}
          disabled={isAlreadyInCompare}
          title={isAlreadyInCompare ? "Added to Compare" : "Add to Compare"}
          className={`flex items-center justify-center p-2.5 rounded-md transition-colors duration-300 border ${
            isAlreadyInCompare 
              ? 'bg-blue-600 text-white border-blue-600 cursor-not-allowed' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="3" x2="16" y2="21"></line><line x1="8" y1="3" x2="8" y2="21"></line><path d="M20 16l-4 4-4-4"></path><path d="M4 8l4-4 4 4"></path>
          </svg>
        </button>

      </div>
      
      {/* ৪. Buy Now */}
      <button
        className="w-full bg-[#01d382] text-white border-none py-1.5 px-6 text-xl font-bold cursor-pointer rounded-md text-center transition-colors duration-300 ease-in-out hover:bg-[#2ee001] disabled:bg-[#cccccc] disabled:cursor-not-allowed"
        onClick={handleBuyNow}
        disabled={isLoading}
      >
        {isBuying ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}