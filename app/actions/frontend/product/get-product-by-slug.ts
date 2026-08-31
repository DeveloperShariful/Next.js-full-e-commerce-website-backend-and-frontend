// File: app/actions/storefront/product/get-product-by-slug.ts
"use server";

import { db } from "@/lib/prisma";

export async function getProductBySlugAction(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { slug: slug, status: "ACTIVE", deletedAt: null },
      include: {
        attributes: true,
        images: true, 
        variants: {
          where: { deletedAt: null },
        },
        categories: {
          take: 1,
          select: {
            id: true,
            name: true,
            slug: true,
            products: {
              where: { status: "ACTIVE", deletedAt: null, slug: { not: slug } },
              take: 4,
              include: { attributes: true },
            }
          }
        },
        reviews: {
          where: { status: "APPROVED", deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, image: true } }
          }
        }
      },
    });

    if (!product) return { success: false, product: null };

    // --- Decimal & Data Formatting ---
    const regularPriceNum = product.price ? Number(product.price.toString()) : 0;
    const salePriceNum = product.salePrice ? Number(product.salePrice.toString()) : null;
    const now = new Date();
    const isOnSale = salePriceNum !== null &&
      salePriceNum < regularPriceNum &&
      (!product.saleStart || now >= product.saleStart) &&
      (!product.saleEnd || now <= product.saleEnd);

    const formatPrice = (amount: number) =>
      new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(amount);

    const formattedProduct = {
      id: product.id,
      databaseId: product.productCode,
      slug: product.slug,
      createdAt: product.createdAt.toISOString(), // videoUrl-এর VideoObject uploadDate approximation-এর জন্য
      name: product.name,
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      image: product.featuredImage ? { sourceUrl: product.featuredImage } : undefined,
      galleryImages: {
        nodes: product.images.map(img => ({ sourceUrl: img.url }))
      },
      price: formatPrice(isOnSale && salePriceNum ? salePriceNum : regularPriceNum),
      regularPrice: formatPrice(regularPriceNum),
      salePrice: salePriceNum ? formatPrice(salePriceNum) : undefined,
      sku: product.sku || product.productCode.toString(),
      barcode: product.barcode || undefined, // GTIN — structured data (gtin14)-এর জন্য
      mpn: product.mpn || undefined, // structured data (mpn)-এর জন্য
      stockStatus: (!product.trackQuantity || product.stock > 0) ? "IN_STOCK" : "OUT_OF_STOCK",
      stockQuantity: product.trackQuantity ? product.stock : null,
      onSale: isOnSale,
      weight: product.weight ? Number(product.weight.toString()) : undefined,
      length: product.length ? Number(product.length.toString()) : undefined,
      width: product.width ? Number(product.width.toString()) : undefined,
      height: product.height ? Number(product.height.toString()) : undefined,
      averageRating: product.rating ? Number(product.rating.toString()) : 0,
      reviewCount: product.reviewCount || 0,
      videoUrl: product.videoUrl || null,
      videoThumbnail: product.videoThumbnail || null,
      videoTitle: product.videoTitle || undefined,
      videoDescription: product.videoDescription || undefined,
      // Structured data (size/audience/color ইত্যাদি)-এর জন্য — আগে fetch হতো
      // কিন্তু formattedProduct-এ কপি হতো না, তাই page পর্যন্ত পৌঁছাত না।
      size: product.size || undefined,
      color: product.color || undefined,
      material: product.material || undefined,
      pattern: product.pattern || undefined,
      gender: product.gender || undefined,
      ageGroup: product.ageGroup || undefined,
      googleProductCategory: product.googleProductCategory || undefined,
      // 🚀 Admin SEO বক্স (metaTitle/metaDesc/OG/Twitter/noIndex) — আগে fetch-ই
      // হতো না, তাই admin panel-এ যা-ই টাইপ করা হোক, product page-এ কখনো
      // পৌঁছাত না। এখন generateMetadata() এই ফিল্ডগুলো read করে।
      metaTitle: product.metaTitle || undefined,
      metaDesc: product.metaDesc || undefined,
      seoCanonicalUrl: product.seoCanonicalUrl || undefined,
      seoSchema: (product.seoSchema as { ogTitle?: string; ogDescription?: string; ogImage?: string; robots?: string } | null) || null,
      noIndex: product.noIndex || false,
      twitterTitle: product.twitterTitle || undefined,
      twitterDescription: product.twitterDescription || undefined,
      faqs: (product.faqs as { question: string; answer: string }[] | null) ?? [],
      primaryCategory: product.categories?.[0]
        ? { name: product.categories[0].name, slug: product.categories[0].slug }
        : null,
      
      // Attributes
      attributes: {
        nodes: product.attributes.map(attr => ({
          name: attr.name,
          options: attr.values
        }))
      },

      // Variations
      variations: {
        nodes: product.variants.map(variant => {
          const varReg = Number(variant.price.toString());
          const varSale = variant.salePrice ? Number(variant.salePrice.toString()) : null;
          return {
            // ✅ FIX: Passed real UUID string 'id' from database
            id: variant.id, 
            databaseId: parseInt(variant.id.replace(/\D/g, '').substring(0, 8)) || 0,
            price: formatPrice(varSale || varReg),
            regularPrice: formatPrice(varReg),
            salePrice: varSale ? formatPrice(varSale) : undefined,
            stockStatus: (!variant.trackQuantity || variant.stock > 0) ? "IN_STOCK" : "OUT_OF_STOCK",
            stockQuantity: variant.trackQuantity ? variant.stock : null,
            name: variant.name,
            // ProductGroup schema-র প্রতিটা variant-এর নিজস্ব gtin-এর জন্য
            barcode: variant.barcode || undefined,
            attributes: {
              nodes: Object.entries(variant.attributes as Record<string, string>).map(([key, val]) => ({
                name: key,
                value: val
              }))
            },
            image: variant.image ? { sourceUrl: variant.image } : undefined
          };
        })
      },

      // Reviews
      reviews: {
        edges: product.reviews.map(review => {
          const reviewMedia = (review.images || []).map((url) => {
            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
            return { url: url, type: isVideo ? "video" : "image" };
          });

          return {
            rating: review.rating,
            node: {
              id: review.id,
              databaseId: parseInt(review.id.replace(/\D/g, '').substring(0, 8)) || 0,
              author: { node: { name: review.user?.name || "Customer", avatar: { url: review.user?.image || "" } } },
              content: review.content || "",
              date: review.createdAt.toISOString(),
              reviewMedia: reviewMedia,
              replies: { edges: [] } 
            }
          };
        })
      },

      // Related Products
      related: {
        nodes: (product.categories?.[0]?.products || []).map(related => {
          const relReg = Number(related.price.toString());
          const relSale = related.salePrice ? Number(related.salePrice.toString()) : null;
          const relOnSale = relSale !== null && relSale < relReg;
          return {
            id: related.id,
            databaseId: related.productCode,
            name: related.name,
            slug: related.slug,
            image: related.featuredImage ? { sourceUrl: related.featuredImage } : undefined,
            price: formatPrice(relOnSale && relSale ? relSale : relReg),
            regularPrice: formatPrice(relReg),
            salePrice: relSale ? formatPrice(relSale) : undefined,
            onSale: relOnSale,
            averageRating: related.rating ? Number(related.rating.toString()) : 0,
            reviewCount: related.reviewCount || 0
          };
        })
      }
    };

    return { success: true, product: formattedProduct };
  } catch (error) {
    console.error("[getProductBySlugAction] Error:", error);
    return { success: false, product: null };
  }
}