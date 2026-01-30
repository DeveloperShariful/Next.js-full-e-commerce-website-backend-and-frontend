//app/actions/admin/media/media-delete.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type DeleteResult = {
  success: boolean;
  deletedCount: number;
  skippedCount: number;
  message: string;
  details?: string[]; // List of reasons why skipped
};

export async function bulkDeleteMedia(ids: string[], force: boolean = false): Promise<DeleteResult> {
  try {
    // 1. Fetch files with relations to check USAGE
    const files = await db.media.findMany({
      where: { id: { in: ids } },
      include: {
        productImages: { select: { product: { select: { name: true } } } },
        categories: { select: { name: true } },
        brands: { select: { name: true } },
        products: { select: { name: true } }, // Featured Image
        blogPosts: { select: { title: true } },
        storeLogos: true,
        storeFavicons: true,
        
      }
    });

    const idsToDelete: string[] = [];
    const publicIdsToDelete: string[] = [];
    const skippedDetails: string[] = [];

    // 2. Logic Check
    for (const file of files) {
        const usage: string[] = [];
        
        if (file.productImages.length > 0) usage.push(`Product Gallery (${file.productImages[0].product.name})`);
        if (file.products.length > 0) usage.push(`Product Featured (${file.products[0].name})`);
        if (file.categories.length > 0) usage.push(`Category (${file.categories[0].name})`);
        if (file.brands.length > 0) usage.push(`Brand Logo (${file.brands[0].name})`);
        if (file.blogPosts.length > 0) usage.push(`Blog Post (${file.blogPosts[0].title})`);
        if (file.storeLogos.length > 0) usage.push(`Store Logo`);

        // If force is TRUE, we ignore usage (Admin Override)
        // If force is FALSE, we verify usage
        if (!force && usage.length > 0) {
            skippedDetails.push(`Skipped "${file.filename}": Used in ${usage.join(", ")}`);
        } else {
            idsToDelete.push(file.id);
            if (file.publicId) publicIdsToDelete.push(file.publicId);
        }
    }

    if (idsToDelete.length === 0) {
        return {
            success: false,
            deletedCount: 0,
            skippedCount: skippedDetails.length,
            message: "No files deleted. All selected files are currently in use.",
            details: skippedDetails
        };
    }

    // 3. Delete from Cloudinary
    if (publicIdsToDelete.length > 0) {
        await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    // 4. Delete from DB
    await db.media.deleteMany({
      where: { id: { in: idsToDelete } }
    });

    revalidatePath("/admin/media");

    return {
        success: true,
        deletedCount: idsToDelete.length,
        skippedCount: skippedDetails.length,
        message: skippedDetails.length > 0 
            ? `Deleted ${idsToDelete.length} files. ${skippedDetails.length} files were skipped (In Use).`
            : `Successfully deleted ${idsToDelete.length} files.`,
        details: skippedDetails
    };

  } catch (error: any) {
    console.error("DELETE_MEDIA_ERROR", error);
    return { success: false, deletedCount: 0, skippedCount: 0, message: "Internal Server Error" };
  }
}