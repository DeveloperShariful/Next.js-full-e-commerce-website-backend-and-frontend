// app/actions/storefront/product/submitReviewAction.ts
"use server";

import { db } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function submitReviewAction(formData: FormData) {
  try {
    const author = formData.get("author") as string;
    const email = formData.get("email") as string;
    const comment = formData.get("comment") as string;
    const rating = parseInt(formData.get("rating") as string, 10) || 5;
    
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

    // ৩. Image/Video Upload Handle (লোকাল ফোল্ডারে সেভ করা হচ্ছে)
    const uploadedFileUrls: string[] = [];
    
    if (mediaFiles && mediaFiles.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
      
      // ফোল্ডার না থাকলে তৈরি করা
      await mkdir(uploadDir, { recursive: true }).catch(() => {});

      for (const file of mediaFiles) {
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          // ফাইলের নামের স্পেস ও স্পেশাল ক্যারেক্টার রিমুভ করা হচ্ছে
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "");
          const filename = `${Date.now()}-${cleanFileName}`;
          const filepath = path.join(uploadDir, filename);
          
          await writeFile(filepath, buffer);
          // ডাটাবেজে সেভ করার জন্য পাবলিক URL
          uploadedFileUrls.push(`/uploads/reviews/${filename}`);
        }
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