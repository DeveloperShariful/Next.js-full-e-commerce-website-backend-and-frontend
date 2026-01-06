//app/actions/admin/media/media-delete.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, // Ensure this is in .env
  api_secret: process.env.CLOUDINARY_API_SECRET, // Ensure this is in .env
});

export async function bulkDeleteMedia(ids: string[]) {
  try {
    // ১. প্রথমে ডাটাবেস থেকে পাবলিক আইডিগুলো খুঁজে বের করা
    const filesToDelete = await db.media.findMany({
      where: { id: { in: ids } },
      select: { id: true, publicId: true }
    });

    // ২. যাদের পাবলিক আইডি আছে, তাদের Cloudinary থেকে ডিলিট করা
    const publicIds = filesToDelete
        .map(f => f.publicId)
        .filter(id => id !== null) as string[];

    if (publicIds.length > 0) {
      // Cloudinary Delete API Call
      await cloudinary.api.delete_resources(publicIds);
    }

    // ৩. ডাটাবেস থেকে রেকর্ড ডিলিট করা
    await db.media.deleteMany({
      where: { id: { in: ids } }
    });

    revalidatePath("/admin/media");
    return { success: true, message: `Successfully deleted ${ids.length} files` };

  } catch (error: any) {
    console.error("DELETE_MEDIA_ERROR", error);
    return { success: false, message: error.message || "Failed to delete files" };
  }
}