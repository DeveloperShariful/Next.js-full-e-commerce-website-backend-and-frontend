// app/product/[slug]/page.tsx

import { notFound } from "next/navigation";
import { serializePrismaData } from "@/lib/format-data"; 
import { getSingleProduct, getRelatedProducts } from "@/app/actions/storefront/product/get-single-related-product";
import { getProductReviews, getReviewStats } from "@/app/actions/storefront/product/review-actions";
import ProductBreadcrumb from "./_components/product-breadcrumb";
import ProductDetailsTabs from "./_components/product-details-tabs";
import RelatedProductsGrid from "./_components/related-products-grid";
import ProductView from "./_components/product-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

export default async function SingleProductPage({ params }: PageProps) {
  const { slug } = await params;
  const rawProduct = await getSingleProduct(slug);

  if (!rawProduct) return notFound();
  const [rawRelatedProducts, rawReviews, rawReviewStats] = await Promise.all([
      getRelatedProducts(rawProduct.categoryId, rawProduct.id),
      getProductReviews(rawProduct.id), 
      getReviewStats(rawProduct.id)     
  ]);
  const product = serializePrismaData(rawProduct);
  const relatedProducts = serializePrismaData(rawRelatedProducts);
  const reviews = serializePrismaData(rawReviews);
  const reviewStats = serializePrismaData(rawReviewStats);

  return (
    <div className="bg-white min-h-screen">
      
      <ProductBreadcrumb productName={product.name} />

      <div className="container mx-auto px-6 pb-20">
         <ProductView product={product} />
         <ProductDetailsTabs 
            description={product.description} 
            productId={product.id}
            reviews={reviews}
            stats={reviewStats}
         />
         <RelatedProductsGrid products={relatedProducts} />

      </div>
    </div>
  );
}