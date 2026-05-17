// app/product/[slug]/_components/StickyActions.tsx

'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface ProductForCart {
  id: string;
  databaseId: number;
  variationId?: string;
  name: string;
  price?: string | null;
  image?: string | null;
  slug: string;
}

interface StickyActionsProps {
  product: ProductForCart;
  isValid: boolean; 
}

export default function StickyActions({ product, isValid }: StickyActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, loading: isCartLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isValid) return;

    setIsAdding(true);
    await addToCart({
        id: product.id,
        databaseId: product.databaseId,
        variationId: product.variationId,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug
    }, quantity);
    setIsAdding(false);
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const buttonText = isAdding ? 'Adding...' : (isValid ? 'Add to Cart' : 'Select color and size');

  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
      <div className="flex items-center border border-[#e0e0e0] rounded-md overflow-hidden h-[40px] md:h-[42px]">
        <button 
          onClick={() => handleQuantityChange(-1)} 
          disabled={isCartLoading || isAdding || quantity <= 1 || !isValid}
          className="bg-[#f9f9f9] border-none text-base font-medium h-full flex items-center justify-center px-3 md:px-[14px] cursor-pointer hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="bg-white min-w-[30px] h-full flex items-center justify-center text-base font-medium">
            {quantity}
        </span>
        <button 
          onClick={() => handleQuantityChange(1)} 
          disabled={isCartLoading || isAdding || !isValid}
          className="bg-[#f9f9f9] border-none text-base font-medium h-full flex items-center justify-center px-3 md:px-[14px] cursor-pointer hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      <button 
        onClick={handleAddToCart}
        disabled={isCartLoading || isAdding || !isValid}
        className={`bg-black text-white border-none rounded-md h-[40px] md:h-[42px] px-4 md:px-6 text-sm md:text-[15px] font-semibold whitespace-nowrap transition-colors duration-200 flex-grow md:flex-grow-0 hover:bg-[#333] disabled:bg-[#888] disabled:cursor-not-allowed`}
        style={{ 
            opacity: isValid ? 1 : 0.6, 
            cursor: isValid ? 'pointer' : 'not-allowed' 
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}