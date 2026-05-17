// app/actions/admin/media/media-read.ts

"use server";

import { db } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache"; 

export type MediaUsage = {
  inProducts: number;
  inCategories: number;
  inBrands: number;
  inBlogs: number;
  inStoreSettings: number;
  inCollections: number;
  details: string[]; 
};

// ✅ Updated Type Definition
export type MediaItem = {
  id: string;
  url: string;
  type: string;
  filename: string;
  originalName?: string | null;
  publicId?: string | null;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  folderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  usage: MediaUsage; // ✅ Usage Object added
  
  // ✅ Explicit Relation Type (Optional but good for strict check)
  productImages?: {
    product: {
      id: string;
      name: string;
      slug: string;
      category: { name: string } | null;
    };
  }[];
};

// ... (Rest of the getAllMedia function remains same as previous step)
// 🔥 Ultra-Advanced Fetch Function
export async function getAllMedia(
  query: string = "", 
  sortBy: string = "newest", 
  typeFilter: string = "ALL",
  usageFilter: string = "ALL",
  folderId: string | null = null, // ✅ Null means Root, string means specific folder
  page: number = 1,
  limit: number = 40
) {
  noStore(); 

  try {
    const where: any = {};
    const skip = (page - 1) * limit;
    
    if (folderId !== "ALL_MEDIA_SEARCH") {
        where.folderId = folderId === "root" ? null : folderId;
    }

    // 2. Search Query (Searching overrides folder view usually, but here we keep it strict or loose based on UX)
    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
      ];
      // If searching, we might want to search EVERYWHERE, not just current folder
      if(folderId !== "root") delete where.folderId; 
    }

    // 3. Type Filter
    if (typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    // 4. Sort Logic
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case "oldest": orderBy = { createdAt: 'asc' }; break;
      case "name_asc": orderBy = { filename: 'asc' }; break;
      case "name_desc": orderBy = { filename: 'desc' }; break;
      case "size_asc": orderBy = { size: 'asc' }; break;
      case "size_desc": orderBy = { size: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const [mediaRaw, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          productImages: { select: { product: { select: { name: true } } } },
          categories: { select: { name: true } },
          brands: { select: { name: true } },
          products: { select: { name: true } }, // Featured Image of Product
          variants: { select: { name: true } },
          blogPosts: { select: { title: true } },
          storeLogos: { select: { storeName: true } },
          storeFavicons: { select: { storeName: true } },
          collections: { select: { name: true } },
          seoConfigs: { select: { siteName: true } } // OG Image
        }
      }),
      db.media.count({ where })
    ]);

    // 6. Transform Data & Calculate Usage
    const data: MediaItem[] = mediaRaw.map((m) => {
        const details: string[] = [];
        
        // Push human readable usage
        m.productImages.forEach(p => details.push(`Product Gallery: ${p.product.name}`));
        m.categories.forEach(c => details.push(`Category: ${c.name}`));
        m.brands.forEach(b => details.push(`Brand Logo: ${b.name}`));
        m.products.forEach(p => details.push(`Product Featured: ${p.name}`));
        m.blogPosts.forEach(b => details.push(`Blog: ${b.title}`));
        if(m.storeLogos.length > 0) details.push("Store Logo");
        
        const usageStats: MediaUsage = {
            inProducts: m.productImages.length + m.products.length + m.variants.length,
            inCategories: m.categories.length,
            inBrands: m.brands.length,
            inBlogs: m.blogPosts.length,
            inStoreSettings: m.storeLogos.length + m.storeFavicons.length + m.seoConfigs.length,
            inCollections: m.collections.length,
            details: details.slice(0, 5) // Limit details to 5 items to keep payload light
        };

        return {
            id: m.id,
            url: m.url,
            type: m.type,
            filename: m.filename,
            originalName: m.originalName,
            publicId: m.publicId,
            mimeType: m.mimeType,
            size: m.size,
            width: m.width,
            height: m.height,
            altText: m.altText,
            caption: m.caption,
            description: m.description,
            folderId: m.folderId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            usage: usageStats
        };
    });

    // 7. Apply Usage Filter (In-Memory because complex relation count query is heavy)
    let filteredData = data;
    if (usageFilter === "USED") {
        filteredData = data.filter(d => d.usage.details.length > 0);
    } else if (usageFilter === "UNUSED") {
        filteredData = data.filter(d => d.usage.details.length === 0);
    }

    const hasMore = skip + filteredData.length < total;

    return { 
        success: true, 
        data: filteredData, 
        meta: { total, page, hasMore } 
    };

  } catch (error) {
    console.error("GET_MEDIA_ERROR", error);
    return { success: false, data: [], meta: { total: 0, page: 1, hasMore: false } };
  }
}