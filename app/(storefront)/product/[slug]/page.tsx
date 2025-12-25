// app/product/[slug]/page.tsx

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductView from "@/components/front/product-view";
import Link from "next/link";
import ProductCard from "@/components/ui/product-card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.metaTitle || product.name,
    description: product.metaDesc || product.shortDescription,
  };
}

export default async function SingleProductPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch Product
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: true,
      attributes: true,
      variants: true,
    },
  });

  if (!product) return notFound();

  // 2. Fetch Related Products
  const relatedProducts = await db.product.findMany({
    where: { 
      categoryId: product.categoryId,
      id: { not: product.id },
      status: 'active' // Only show active products
    },
    take: 4,
    include: { images: true, category: true }
  });

  return (
    <div className="bg-white min-h-screen">
      
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-4 mb-8">
         <div className="container mx-auto px-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link> / 
            <Link href="/shop" className="hover:text-blue-600 mx-1">Shop</Link> / 
            <span className="text-gray-800 mx-1 font-medium">{product.name}</span>
         </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
         
         {/* Main Product View */}
         {/* @ts-ignore - Type matching is handled in component */}
         <ProductView product={product} />

         {/* Description Tab */}
         <div className="mt-20 border-t border-slate-100 pt-10">
            <div className="flex gap-8 mb-6 border-b border-slate-200 pb-4">
               <button className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-4 -mb-4.5">Description</button>
               <button className="text-lg font-medium text-slate-500 hover:text-slate-800">Reviews</button>
            </div>
            <div className="prose max-w-none text-slate-600 leading-relaxed">
               <p>{product.description}</p>
            </div>
         </div>

         {/* Related Products */}
         {relatedProducts.length > 0 && (
           <div className="mt-20">
              <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-gray-200">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                 {relatedProducts.map((related) => {
                    // Safety check before rendering card
                    if (!related || !related.price) return null;
                    return (
                        // @ts-ignore
                        <ProductCard key={related.id} data={related} />
                    );
                 })}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}