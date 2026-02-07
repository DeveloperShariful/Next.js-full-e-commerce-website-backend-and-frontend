// File: app/product/[slug]/_components/related-products-grid.tsx

import ProductCard from "@/app/(storefront)/product/[slug]/_components/product-card";

interface Props {
  products: any[];
}

export default function RelatedProductsGrid({ products }: Props) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-gray-200">
        You May Also Like
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((related) => {
          if (!related) return null;
          return (
            <ProductCard key={related.id} data={related} />
          );
        })}
      </div>
    </div>
  );
}