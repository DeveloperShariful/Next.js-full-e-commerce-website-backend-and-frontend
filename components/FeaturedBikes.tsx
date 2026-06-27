// components/FeaturedBikes.tsx

import ProductCard from '@/components/ProductCard';
import { StorefrontProduct } from '@/app/(frontend)/types';

interface Props {
  products: StorefrontProduct[];
}

export default function FeaturedBikes({ products }: Props) {
  if (products.length === 0) return null;

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
