////app/actions/admin/media/media-sync.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// হেল্পার ফাংশন: মিডিয়া তৈরি বা খুঁজে বের করা
async function ensureMediaExists(url: string, filename: string) {
  if (!url) return null;

  // ১. চেক করি এই URL অলরেডি মিডিয়াতে আছে কিনা
  const existing = await db.media.findFirst({
    where: { url: url }
  });

  if (existing) return existing.id;

  // ২. না থাকলে নতুন তৈরি করি
  try {
    const newMedia = await db.media.create({
      data: {
        url: url,
        filename: filename,
        mimeType: "image/unknown",
        size: 0,
        type: "IMAGE",
        uploadedBy: "Migration Script",
        altText: filename.replace(/[-_]/g, " "),
      }
    });
    return newMedia.id;
  } catch (e) {
    console.error("Failed to create media for:", url);
    return null;
  }
}

export async function syncOldMedia() {
  try {
    let count = 0;

    // --- ১. CATEGORIES SYNC ---
    const categories = await db.category.findMany({ 
        where: { image: { not: null }, mediaId: null } 
    });
    
    for (const cat of categories) {
      if (cat.image) {
        const name = `category-${cat.slug}.jpg`;
        const mediaId = await ensureMediaExists(cat.image, name);
        if (mediaId) {
          await db.category.update({
            where: { id: cat.id },
            data: { mediaId: mediaId }
          });
          count++;
        }
      }
    }

    // --- ২. BRANDS SYNC ---
    const brands = await db.brand.findMany({ 
        where: { logo: { not: null }, logoMediaId: null } 
    });

    for (const brand of brands) {
      if (brand.logo) {
        const name = `brand-${brand.name}.jpg`;
        const mediaId = await ensureMediaExists(brand.logo, name);
        if (mediaId) {
          await db.brand.update({
            where: { id: brand.id },
            data: { logoMediaId: mediaId }
          });
          count++;
        }
      }
    }

    // --- ৩. PRODUCTS (Featured Image) SYNC ---
    const products = await db.product.findMany({ 
        where: { featuredImage: { not: null }, featuredMediaId: null } 
    });

    for (const prod of products) {
      if (prod.featuredImage) {
        const name = `product-${prod.slug}.jpg`;
        const mediaId = await ensureMediaExists(prod.featuredImage, name);
        if (mediaId) {
          await db.product.update({
            where: { id: prod.id },
            data: { featuredMediaId: mediaId }
          });
          count++;
        }
      }
    }

    // --- ৪. GALLERY IMAGES SYNC (FIXED) ---
    // আমরা রিলেশন সহ প্রোডাক্টগুলো কল করছি
    const productsWithGallery = await db.product.findMany({
        include: {
            images: true // ✅ Fix 1: ইমেজ রিলেশন ইনক্লুড করা হলো
        }
    });

    for (const prod of productsWithGallery) {
        // ✅ Fix 2: 'galleryImages' এর বদলে 'images' ব্যবহার করা হলো
        if (prod.images && prod.images.length > 0) {
            
            for (const imgObj of prod.images) {
                // ✅ Fix 3: অবজেক্ট থেকে URL বের করা হলো
                const imgUrl = imgObj.url;

                if (imgUrl) {
                    const name = `gallery-${prod.slug}-${imgObj.id}.jpg`;
                    const mediaId = await ensureMediaExists(imgUrl, name);

                    // Optional: যদি চান ProductImage টেবিলেও mediaId আপডেট হোক
                    if (mediaId && !imgObj.mediaId) {
                        await db.productImage.update({
                            where: { id: imgObj.id },
                            data: { mediaId: mediaId }
                        });
                        count++;
                    }
                }
            }
        }
    }

    revalidatePath("/admin/media");
    return { success: true, message: `Synced ${count} images to Media Library!` };

  } catch (error) {
    console.error("SYNC ERROR:", error);
    return { success: false, message: "Sync failed" };
  }
}