//app/actions/admin/media/media-create.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MediaType } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

interface SaveMediaParams {
  url: string;
  publicId: string;      // ✅ Cloudinary ID
  originalName: string;  // ✅ User's original filename
  filename: string;      // ✅ Clean filename
  mimeType: string;
  size: number;
  width: number;         // ✅ For SEO
  height: number;        // ✅ For SEO
}

export async function saveMedia(fileData: SaveMediaParams) {
  try {
    const user = await currentUser();
    const uploadedBy = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Admin";

    // Determine type
    let type = "DOCUMENT";
    if (fileData.mimeType.startsWith("image/")) type = "IMAGE";
    else if (fileData.mimeType.startsWith("video/")) type = "VIDEO";

    const cleanUrl = fileData.url.replace(/\/v\d+\//, "/");

    const altText = fileData.originalName
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

    const newMedia = await db.media.create({
      data: {
        url: cleanUrl,
        publicId: fileData.publicId,     // ✅ Saving Public ID
        filename: fileData.filename,
        originalName: fileData.originalName, // ✅ Saving Original Name
        mimeType: fileData.mimeType,
        size: fileData.size,
        width: fileData.width,          
        height: fileData.height,       
        type: type as MediaType,
        uploadedBy: uploadedBy, 
        altText: altText                
      }
    });

    revalidatePath("/admin/media");
    return { success: true, data: newMedia };

  } catch (error) {
    console.error("SAVE_MEDIA_ERROR", error);
    return { success: false, message: "Failed to save file info" };
  }
}