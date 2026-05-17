// app/product/[slug]/_components/StickyAddToCart.tsx

'use client';

import Image from 'next/image';
import StickyActions from './StickyActions';

interface ProductForCart {
  id: string;
  databaseId: number;
  variationId?: string;
  name: string;
  price?: string | null;
  image?: string | null;
  slug: string;
}

const StickyAddToCart = ({ 
  product, 
  isVisible, 
  isValid = true 
}: { 
  product: ProductForCart; 
  isVisible: boolean; 
  isValid?: boolean; 
}) => {
  if (!product) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 w-full bg-white border-t border-[#e5e5e5] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-[1000] flex items-center transition-transform duration-300 ease-in-out
      ${isVisible ? 'translate-y-0 visible' : 'translate-y-full invisible'}
      /* Mobile Styles (Default) */
      justify-between p-[8px_10px] gap-[10px]
      /* Desktop Styles (Min-width: 769px approx to md) */
      md:justify-center md:gap-[10rem] md:p-[0px_5px]`}
    >
      <div className="flex items-center gap-0.5 min-w-0 flex-1 md:flex-initial">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            width={50}
            height={50}
            className="rounded-md shrink-0 w-[45px] h-[45px] md:w-[50px] md:h-[50px]"
          />
        )}
        <div className="flex flex-col">
             <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-[14px] md:text-[16px]">
                {product.name}
             </span>
             <span className="hidden" dangerouslySetInnerHTML={{ __html: product.price || '' }} />
        </div>
      </div>
      <div className="flex items-center shrink-0">
        <StickyActions product={product} isValid={isValid} /> 
      </div>
    </div>
  );
};

export default StickyAddToCart;