// app/actions/banner.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- GET BANNERS ---
export async function getBanners() {
  try {
    const banners = await db.banner.findMany({
      orderBy: { position: 'asc' }
    });
    return { success: true, data: banners };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// --- CREATE / UPDATE BANNER ---
export async function saveBanner(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const image = formData.get("image") as string;
    const link = formData.get("link") as string;
    const isActive = formData.get("isActive") === "true";
    const position = parseInt(formData.get("position") as string) || 0;

    if (!title || !image) return { success: false, error: "Title and Image required" };

    const data = { title, image, link, isActive, position };

    if (id) {
      await db.banner.update({ where: { id }, data });
    } else {
      await db.banner.create({ data });
    }

    revalidatePath("/admin/banners");
    return { success: true, message: "Banner saved successfully" };
  } catch (error) {
    return { success: false, error: "Operation failed" };
  }
}

// --- DELETE BANNER ---
export async function deleteBanner(id: string) {
  try {
    await db.banner.delete({ where: { id } });
    revalidatePath("/admin/banners");
    return { success: true, message: "Banner deleted" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}