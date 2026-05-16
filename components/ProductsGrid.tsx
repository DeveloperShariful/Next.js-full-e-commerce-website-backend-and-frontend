'use client'; 

import ProductCard from '@/components/ProductCard'; // পাথ ঠিক থাকলে এভাবেই রাখুন
import { StorefrontProduct } from '@/app/(storefront)/types'; // আমাদের ১০০% অরিজিনাল ডাটাবেজ টাইপ

// পুরানো interface Product পুরোপুরি মুছে ফেলা হয়েছে
interface ProductsGridProps {
    products: StorefrontProduct[]; // এখানে StorefrontProduct ব্যবহার করা হলো
}

export default function ProductsGrid({ products }: ProductsGridProps) {
    if (!products || products.length === 0) {
        return <p className="text-center py-10 text-gray-500 text-xl">No products found for this category.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}