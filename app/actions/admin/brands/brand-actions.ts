// File: app/actions/admin/brands/brand-actions.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Fetch All Brands
export async function getBrands() {
  try {
    const brands = await db.brand.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true } } }
    });
    return { success: true, data: brands };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 2. Fetch Single Brand
export async function getBrand(id: string) {
  try {
    const brand = await db.brand.findUnique({ where: { id } });
    return brand;
  } catch (error) {
    return null;
  }
}

// 3. Create or Update Brand (Upsert)
export async function upsertBrand(formData: FormData, id?: string) {
  const name = formData.get("name") as string;
  // Slug Logic: যদি ইউজার স্লাগ দেয় ভালো, না দিলে নেম থেকে জেনারেট হবে
  let slug = (formData.get("slug") as string) || name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  
  const description = formData.get("description") as string;
  const website = formData.get("website") as string;
  const countryOfOrigin = formData.get("countryOfOrigin") as string;
  const metaTitle = formData.get("metaTitle") as string;
  const metaDesc = formData.get("metaDesc") as string;
  // Note: Logo upload logic should be handled separately (e.g. Cloudinary), assuming string URL here for now
  const logo = formData.get("logo") as string; 

  if (!name) return { success: false, message: "Name is required" };

  try {
    const data = {
      name,
      slug,
      description,
      website,
      countryOfOrigin,
      metaTitle,
      metaDesc,
      logo,
    };

    if (id) {
      // Update
      await db.brand.update({ where: { id }, data });
    } else {
      // Create
      await db.brand.create({ data });
    }

    revalidatePath("/admin/brands");
    return { success: true, message: id ? "Brand updated successfully!" : "Brand created successfully!" };
  } catch (error: any) {
    // Unique Constraint Error handling (P2002)
    if (error.code === 'P2002') {
        return { success: false, message: "This slug is already in use." };
    }
    return { success: false, message: "Something went wrong." };
  }
}

// 4. Delete Brand
export async function deleteBrand(id: string) {
  try {
    await db.brand.delete({ where: { id } });
    revalidatePath("/admin/brands");
    return { success: true, message: "Brand deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete brand" };
  }
}