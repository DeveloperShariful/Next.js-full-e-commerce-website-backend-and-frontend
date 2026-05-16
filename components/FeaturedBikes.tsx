// components/FeaturedBikes.tsx
'use client';

import { useState, useEffect } from 'react';
import { getFeaturedBikesAction } from '@/app/actions/storefront/home/getFeaturedBikesAction';
import ProductCard from '@/components/ProductCard'; 
import { StorefrontProduct } from '@/app/(storefront)/types'; 

export default function FeaturedBikes() {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; 

    async function getFeaturedBikes() {
      try {
        setLoading(true);
        const response = await getFeaturedBikesAction();
        
        if (response.success && response.products && isMounted) {
            setProducts(response.products);
        }
      } catch (error) {
        console.error("Error fetching featured bikes:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    getFeaturedBikes();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
        <section className="w-full py-16 bg-white">
            <div className="max-w-[1300px] mx-auto px-4">
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
            </div>
        </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-[1500px] mx-auto px-2 md:px-6">
        
        <div className="text-center mb-12">
          <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold mb-4 text-[#1a1a1a]">Explore Our Top Kids Electric Bikes</h2>
          <p className="text-[1rem] md:text-[1.1rem] text-[#555] max-w-[700px] mx-auto leading-[1.6]">
            Discover our best-selling Kids electric bike, engineered for safety, performance, and endless fun. 
            Each GoBike is built to grow with your child, making it the perfect choice for young Aussie adventurers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
      </div>
    </section>
  );
}