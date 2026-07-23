// app/actions/storefront/product/submitReviewAction.ts
"use server";

import { db } from "@/lib/prisma";
import { stripHtml } from "@/lib/sanitize";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_REVIEW_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov']);
const MAX_REVIEW_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_REVIEW_FILES = 5;

async function isValidReviewMedia(file: File): Promise<boolean> {
  if (file.size > MAX_REVIEW_FILE_BYTES) return false;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_REVIEW_EXTENSIONS.has(ext)) return false;
  // Magic byte check — actual file content verify করা হচ্ছে (extension spoofing ঠেকাতে)
  const hdr = Buffer.from(await file.slice(0, 12).arrayBuffer());
  if (ext === 'jpg' || ext === 'jpeg') return hdr[0] === 0xFF && hdr[1] === 0xD8 && hdr[2] === 0xFF;
  if (ext === 'png')  return hdr[0] === 0x89 && hdr[1] === 0x50 && hdr[2] === 0x4E && hdr[3] === 0x47;
  if (ext === 'webp') return hdr[0] === 0x52 && hdr[1] === 0x49 && hdr[2] === 0x46 && hdr[3] === 0x46 && hdr[8] === 0x57 && hdr[9] === 0x45 && hdr[10] === 0x42 && hdr[11] === 0x50;
  if (ext === 'gif')  return hdr[0] === 0x47 && hdr[1] === 0x49 && hdr[2] === 0x46 && hdr[3] === 0x38;
  if (ext === 'webm') return hdr[0] === 0x1A && hdr[1] === 0x45;
  if (ext === 'mp4' || ext === 'mov') return hdr[4] === 0x66 && hdr[5] === 0x74 && hdr[6] === 0x79 && hdr[7] === 0x70;
  return false;
}

export async function submitReviewAction(formData: FormData) {
  try {
    // Sanitize all text inputs — strip any HTML/script before saving to DB
    const author = stripHtml(formData.get("author") as string);
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const comment = stripHtml(formData.get("comment") as string);
    const rating = Math.min(5, Math.max(1, parseInt(formData.get("rating") as string, 10) || 5));
    
    // ফর্ম থেকে প্রোডাক্টের databaseId (productCode) আসছে
    const productCode = parseInt(formData.get("comment_post_ID") as string, 10);
    
    // মিডিয়া ফাইলস (ছবি/ভিডিও)
    const mediaFiles = formData.getAll("media[]") as File[];

    if (!author || !email || !comment || !productCode) {
      return { success: false, message: "Please fill in all required fields." };
    }

    // ১. Product ID বের করা (databaseId দিয়ে)
    const product = await db.product.findUnique({
      where: { productCode: productCode },
      select: { id: true }
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    // ২. User Handle (গেস্ট ইউজার হলে নতুন তৈরি করা হবে)
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name: author,
          email: email.toLowerCase(),
          role: "CUSTOMER",
          isActive: true,
        }
      });
    }

    // ৩. Image/Video Upload Handle (type + magic byte validation, safe filename)
    const uploadedFileUrls: string[] = [];

    if (mediaFiles && mediaFiles.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
      await mkdir(uploadDir, { recursive: true }).catch(() => {});

      const filesToProcess = mediaFiles.filter(f => f.size > 0).slice(0, MAX_REVIEW_FILES);

      for (const file of filesToProcess) {
        const valid = await isValidReviewMedia(file);
        if (!valid) continue; // invalid file হলে silently skip

        const ext = file.name.split('.').pop()!.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filepath = path.join(uploadDir, safeFilename);
        const buffer = Buffer.from(await file.arrayBuffer());

        await writeFile(filepath, buffer);
        uploadedFileUrls.push(`/uploads/reviews/${safeFilename}`);
      }
    }

    // ৪. Review Database এ সেভ করা (PENDING স্ট্যাটাস দিয়ে)
    await db.review.create({
      data: {
        rating: rating,
        content: comment,
        status: "PENDING", 
        images: uploadedFileUrls,
        userId: user.id,
        productId: product.id,
      }
    });

    return { 
      success: true, 
      message: "Review submitted successfully! It will appear after approval." 
    };

  } catch (error: any) {
    console.error("[submitReviewAction] Error:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred while submitting your review." 
    };
  }
}