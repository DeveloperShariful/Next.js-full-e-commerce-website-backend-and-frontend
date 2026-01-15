//app/actions/admin/media/media-move.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function moveMediaToFolder(mediaIds: string[], targetFolderId: string | null) {
  try {
    if (!mediaIds || mediaIds.length === 0) {
        return { success: false, message: "No items selected" };
    }

    // Validate Target Folder (if not root)
    if (targetFolderId) {
        const folder = await db.mediaFolder.findUnique({ where: { id: targetFolderId } });
        if (!folder) return { success: false, message: "Target folder does not exist" };
    }

    // Bulk Update
    await db.media.updateMany({
      where: {
        id: { in: mediaIds }
      },
      data: {
        folderId: targetFolderId
      }
    });

    revalidatePath("/admin/media");
    return { success: true, message: `Moved ${mediaIds.length} items successfully.` };

  } catch (error) {
    console.error("MOVE_MEDIA_ERROR", error);
    return { success: false, message: "Failed to move items" };
  }
}