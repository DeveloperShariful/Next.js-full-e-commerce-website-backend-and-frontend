//app/actions/admin/media/media-read.ts

"use server";

import { db } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache"; // 👈 ১. ক্যাশ অকার্যকর করার জন্য ইম্পোর্ট

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
  // Relation for "Used In" column
  productImages: {
    product: {
      id: string;
      name: string;
      slug: string;
      category: { name: string } | null;
    };
  }[];
};

export async function getAllMedia(
  query: string = "", 
  sortBy: string = "newest", 
  typeFilter: string = "ALL",
  usageFilter: string = "ALL"
) {
  noStore(); // 👈 ২. এই ফাংশনটি সার্ভারকে বলে ক্যাশ ব্যবহার না করতে

  try {
    const where: any = {};
    
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
      where.productImages = { some: {} }; // Attached to at least one product
    } else if (usageFilter === "UNUSED") {
      where.productImages = { none: {} }; // Not attached to any product
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

    const data = await db.media.findMany({
      where,
      orderBy,
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
    });

    return { success: true, data };

  } catch (error) {
    console.error("GET_MEDIA_ERROR", error);
    return { success: false, data: [] };
  }
}