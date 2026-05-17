//app/actions/admin/media/media-update.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    console.error("UPDATE_MEDIA_ERROR", error);
    return { success: false, message: "Update failed" };
  }
}