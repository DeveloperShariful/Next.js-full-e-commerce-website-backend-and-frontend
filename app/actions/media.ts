// app/actions/media.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type MediaItem = {
  id: string;
  url: string;
  type: "PRODUCT" | "CATEGORY" | "USER" | "UPLOADED"; // ✅ UPLOADED Type Added
  name: string;
  createdAt: Date;
};

// --- 1. GET ALL MEDIA ---
export async function getAllMedia() {
  try {
    let mediaList: MediaItem[] = [];

    // A. Manually Uploaded Images (From Media Table)
    const uploadedItems = await db.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const uploadedImages: MediaItem[] = uploadedItems.map(item => ({
      id: item.id,
      url: item.url,
      type: "UPLOADED", // ✅ Type set to UPLOADED
      name: item.filename || "Uploaded Image",
      createdAt: item.createdAt
    }));

    // B. Product Images
    const productImages = await db.productImage.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { id: 'desc' },
      take: 50
    });
    const products: MediaItem[] = productImages.map(img => ({
      id: img.id,
      url: img.url,
      type: "PRODUCT",
      name: img.product.name,
      createdAt: new Date()
    }));

    // C. Category Images
    const categories = await db.category.findMany({
      where: { image: { not: null } },
      select: { id: true, name: true, image: true }
    });
    const categoryImages: MediaItem[] = categories.map(cat => ({
      id: cat.id,
      url: cat.image!,
      type: "CATEGORY",
      name: cat.name,
      createdAt: new Date()
    }));

    // D. User Images
    const users = await db.user.findMany({
      where: { image: { not: null } },
      select: { id: true, name: true, image: true }
    });
    const userImages: MediaItem[] = users.map(user => ({
      id: user.id,
      url: user.image!,
      type: "USER",
      name: user.name || "User",
      createdAt: new Date()
    }));

    // Merge All
    mediaList = [...uploadedImages, ...products, ...categoryImages, ...userImages];

    // Sort: Latest first
    mediaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: mediaList };

  } catch (error) {
    console.error("GET_MEDIA_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 2. SAVE MEDIA (Returns the new object) ---
export async function saveMedia(url: string) {
  try {
    const filename = url.split('/').pop() || "uploaded-image.jpg";

    const newMedia = await db.media.create({
      data: {
        url,
        type: "IMAGE",
        filename: filename,       
        mimeType: "image/jpeg",   
        size: 0,                  
        uploadedBy: "Admin"       
      }
    });

    revalidatePath("/admin/media");
    
    // Return the new item to frontend
    return { 
      success: true, 
      data: {
        id: newMedia.id,
        url: newMedia.url,
        type: "UPLOADED",
        name: newMedia.filename,
        createdAt: newMedia.createdAt
      } as MediaItem
    };

  } catch (error) {
    console.log(error);
    return { success: false };
  }
}

// --- 3. DELETE MEDIA ---
export async function deleteMedia(id: string) {
  try {
    await db.media.delete({ where: { id } });
    revalidatePath("/admin/media");
    return { success: true, message: "Deleted successfully" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}