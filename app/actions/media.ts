// app/actions/media.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { MediaType } from "@prisma/client";

// --- TYPES ---
export type MediaItem = {
  id: string;
  url: string;
  type: string;
  filename: string;
  mimeType: string;
  size: number;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ==========================================
// 1. GET MEDIA (WITH FILTER & SORT)
// ==========================================
export async function getAllMedia(
  query: string = "", 
  sortBy: string = "newest", // newest, oldest, name_asc, name_desc, size_asc, size_desc
  typeFilter: string = "ALL" // ALL, IMAGE, VIDEO, DOCUMENT
) {
  try {
    // 1. Filter Logic
    const where: any = {};
    
    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    // 2. Sort Logic
    let orderBy: any = { createdAt: 'desc' };
    
    switch (sortBy) {
      case "oldest": orderBy = { createdAt: 'asc' }; break;
      case "name_asc": orderBy = { filename: 'asc' }; break;
      case "name_desc": orderBy = { filename: 'desc' }; break;
      case "size_asc": orderBy = { size: 'asc' }; break;
      case "size_desc": orderBy = { size: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' }; // newest
    }

    const data = await db.media.findMany({
      where,
      orderBy
    });

    return { success: true, data };

  } catch (error) {
    console.error("GET_MEDIA_ERROR", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 2. SAVE MEDIA (UPLOAD)
// ==========================================
export async function saveMedia(fileData: { url: string, filename: string, size: number, mimeType: string }) {
  try {
    // Determine type based on mime
    let type = "DOCUMENT";
    if (fileData.mimeType.startsWith("image/")) type = "IMAGE";
    else if (fileData.mimeType.startsWith("video/")) type = "VIDEO";

    const newMedia = await db.media.create({
      data: {
        url: fileData.url,
        filename: fileData.filename,
        mimeType: fileData.mimeType,
        size: fileData.size,
        type: type as MediaType,
        uploadedBy: "Admin", 
        altText: fileData.filename.split('.')[0] 
    });

    revalidatePath("/admin/media");
    return { success: true, data: newMedia };

  } catch (error) {
    console.error("SAVE_MEDIA_ERROR", error);
    return { success: false, message: "Failed to save file info" };
  }
}

// ==========================================
// 3. UPDATE METADATA (DETAILS DRAWER)
// ==========================================
export async function updateMediaMetadata(id: string, data: { filename: string, altText: string, caption: string, description: string }) {
  try {
    await db.media.update({
      where: { id },
      data: {
        filename: data.filename,
        altText: data.altText,
        caption: data.caption,
        description: data.description
      }
    });

    revalidatePath("/admin/media");
    return { success: true, message: "File details updated" };

  } catch (error) {
    return { success: false, message: "Update failed" };
  }
}

// ==========================================
// 4. BULK DELETE
// ==========================================
export async function bulkDeleteMedia(ids: string[]) {
  try {
    // Note: In a real production app, you should also delete the actual files 
    // from your storage provider (Uploadthing/S3) here using their SDK.
    
    await db.media.deleteMany({
      where: { id: { in: ids } }
    });

    revalidatePath("/admin/media");
    return { success: true, message: `Successfully deleted ${ids.length} files` };

  } catch (error) {
    return { success: false, message: "Failed to delete files" };
  }
}