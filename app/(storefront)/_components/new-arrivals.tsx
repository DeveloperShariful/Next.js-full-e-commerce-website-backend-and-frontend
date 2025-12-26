// File: app/(storefront)/_components/new-arrivals.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";
// Note: Ensure this path matches where you saved your ProductCard
import ProductCard from "@/app/(storefront)/product/[slug]/_components/product-card"; 

interface Props {
  products: any[];
}

export default function NewArrivals({ products }: Props) {
  return (
    <section className="py-20 container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">New Arrivals</h2>
          <p className="text-slate-500 mt-2">Check out the latest products added to our store.</p>
        </div>
        <Link href="/shop" className="px-6 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center gap-2">
          View All Products <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          // @ts-ignore - Assuming ProductCard handles types correctly
          <ProductCard key={product.id} data={product} />
        ))}
      </div>
    </section>
  );
}