// app/actions/admin/media/media-read.ts

"use server";

import { db } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache"; 

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
  createdAt: Date;
  updatedAt: Date;
  productImages: {
    product: {
      id: string;
      name: string;
      slug: string;
      category: { name: string } | null;
    };
  }[];
};

// 🔥 UPDATE: Added Pagination Parameters (page, limit)
export async function getAllMedia(
  query: string = "", 
  sortBy: string = "newest", 
  typeFilter: string = "ALL",
  usageFilter: string = "ALL",
  page: number = 1,
  limit: number = 30
) {
  noStore(); 

  try {
    const where: any = {};
    const skip = (page - 1) * limit;
    
    // 1. Search Query
    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // 2. Type Filter
    if (typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    // 3. Usage Filter
    if (usageFilter === "USED") {
      where.productImages = { some: {} }; 
    } else if (usageFilter === "UNUSED") {
      where.productImages = { none: {} }; 
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

    // 🔥 Parallel Fetch: Data + Count
    const [data, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          productImages: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: { select: { name: true } }
                }
              }
            }
          }
        }
      }),
      db.media.count({ where })
    ]);

    const hasMore = skip + data.length < total;

    return { success: true, data, meta: { total, page, hasMore } };

  } catch (error) {
    console.error("GET_MEDIA_ERROR", error);
    return { success: false, data: [], meta: { total: 0, page: 1, hasMore: false } };
  }
}