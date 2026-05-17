// app/actions/admin/media/media-create.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MediaType } from "@prisma/client";
import { auth } from "@/auth";

interface SaveMediaParams {
  url: string;
  publicId: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export async function saveMedia(fileData: SaveMediaParams) {
  try {
    const session = await auth();
    const uploadedBy = session?.user?.name || session?.user?.email || "Admin";

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
        publicId: fileData.publicId,
        filename: fileData.filename,
        originalName: fileData.originalName,
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