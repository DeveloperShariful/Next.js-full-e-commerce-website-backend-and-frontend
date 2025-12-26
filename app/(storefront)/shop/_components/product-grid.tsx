// File: app/(routes)/shop/_components/product-grid.tsx

// Note: Adjust this import path if your ProductCard is in a different location
import ProductCard from "@/app/(storefront)/product/[slug]/_components/product-card"; 

interface Props {
  products: any[];
}

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-lg font-medium text-slate-600">No products found.</p>
        <p className="text-slate-400 text-sm">Try changing your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        // @ts-ignore - Assuming ProductCard handles types correctly
        <ProductCard key={product.id} data={product} />
      ))}
    </div>
  );
}