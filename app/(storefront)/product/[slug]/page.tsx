// app/product/[slug]/page.tsx

import { notFound } from "next/navigation";
import { ProductStatus } from "@prisma/client"; // 🚀 Import Enum for Type Safety

// Actions Imports
import { getSingleProduct } from "@/app/actions/storefront/product/get-single-product";
import { getRelatedProducts } from "@/app/actions/storefront/product/get-related-products";
import { getProductReviews, getReviewStats } from "@/app/actions/storefront/product/review-actions";

// Components Imports (Updated paths based on your structure)
import ProductBreadcrumb from "./_components/product-breadcrumb";
import ProductDetailsTabs from "./_components/product-details-tabs";
import RelatedProductsGrid from "./_components/related-products-grid";
import ProductView from "./_components/product-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// --- Metadata Generation ---
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getSingleProduct(slug);
  
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.metaTitle || product.name,
    description: product.metaDesc || product.shortDescription,
    openGraph: {
        images: product.featuredImage ? [product.featuredImage] : [],
    }
  };
}

// --- Main Page Component ---
export default async function SingleProductPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch Main Product First (To get ID and Category)
  const product = await getSingleProduct(slug);

  if (!product) return notFound();

  // 2. Fetch Related Data in Parallel (Faster Loading)
  const [relatedProducts, reviews, reviewStats] = await Promise.all([
      getRelatedProducts(product.categoryId, product.id),
      getProductReviews(product.id), 
      getReviewStats(product.id)     
  ]);

  return (
    <div className="bg-white min-h-screen">
      
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb productName={product.name} />

      <div className="container mx-auto px-6 pb-20">
         
         {/* Main Product View (Gallery + Info + Add to Cart) */}
         {/* @ts-ignore - Component handles null checks internally */}
         <ProductView product={product} />

         {/* Details Tabs (Description & Reviews) */}
         {/* Passing review data to handle dynamic reviews */}
         <ProductDetailsTabs 
            description={product.description} 
            productId={product.id}
            reviews={reviews}
            stats={reviewStats}
         />

         {/* Related Products Grid */}
         <RelatedProductsGrid products={relatedProducts} />

      </div>
    </div>
  );
}