// app/product/[slug]/page.tsx

import { notFound } from "next/navigation";
import { serializePrismaData } from "@/lib/format-data"; // ✅ Import utility function

// Actions Imports
import { getSingleProduct } from "@/app/actions/storefront/product/get-single-product";
import { getRelatedProducts } from "@/app/actions/storefront/product/get-related-products";
import { getProductReviews, getReviewStats } from "@/app/actions/storefront/product/review-actions";

// Components Imports
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

  // 1. Fetch Main Product First (Raw Data from Database)
  const rawProduct = await getSingleProduct(slug);

  if (!rawProduct) return notFound();

  // 2. Fetch Related Data in Parallel (Raw Data)
  const [rawRelatedProducts, rawReviews, rawReviewStats] = await Promise.all([
      getRelatedProducts(rawProduct.categoryId, rawProduct.id),
      getProductReviews(rawProduct.id), 
      getReviewStats(rawProduct.id)     
  ]);

  // 3. Serialize Data (Convert Decimal to Number, Date to String)
  // ✅ This fixes the "Decimal objects are not supported" error
  const product = serializePrismaData(rawProduct);
  const relatedProducts = serializePrismaData(rawRelatedProducts);
  const reviews = serializePrismaData(rawReviews);
  const reviewStats = serializePrismaData(rawReviewStats);

  return (
    <div className="bg-white min-h-screen">
      
      {/* Breadcrumb Navigation */}
      <ProductBreadcrumb productName={product.name} />

      <div className="container mx-auto px-6 pb-20">
         
         {/* Main Product View (Gallery + Info + Add to Cart) */}
         {/* No need for @ts-ignore anymore, clean data is passed */}
         <ProductView product={product} />

         {/* Details Tabs (Description & Reviews) */}
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