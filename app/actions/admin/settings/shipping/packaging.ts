// File: app/actions/settings/shipping/packaging.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- GET DATA ---
export async function getPackagingData() {
  try {
    const shippingBoxes = await db.shippingBox.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const transdirectBoxes = await db.transdirectBox.findMany({
      where: { isActive: true },
      orderBy: { description: 'asc' }
    });

    return { 
      success: true, 
      shippingBoxes, 
      transdirectBoxes 
    };
  } catch (error) {
    console.error("GET_PACKAGING_ERROR", error);
    return { success: false, error: "Failed to fetch packaging data" };
  }
}

// --- CREATE / UPDATE CUSTOM BOX ---
export async function saveShippingBox(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    
    const length = parseFloat(formData.get("length") as string) || 0;
    const width = parseFloat(formData.get("width") as string) || 0;
    const height = parseFloat(formData.get("height") as string) || 0;
    const maxWeight = formData.get("maxWeight") ? parseFloat(formData.get("maxWeight") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null; 

    if (id) {
        await db.shippingBox.update({
            where: { id },
            data: { name, length, width, height, maxWeight, weight }
        });
    } else {
        await db.shippingBox.create({
            data: { name, length, width, height, maxWeight, weight, isEnabled: true }
        });
    }

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: id ? "Box updated successfully" : "New box added successfully" };
  } catch (error) {
    console.error("SAVE_BOX_ERROR", error);
    return { success: false, error: "Failed to save box details" };
  }
}

// --- DELETE BOX ---
export async function deleteShippingBox(id: string) {
  try {
    await db.shippingBox.delete({ where: { id } });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Box removed successfully" };
  } catch (error) {
    return { success: false, error: "Failed to delete box" };
  }
}

// --- TOGGLE STATUS ---
export async function toggleBoxStatus(id: string, isEnabled: boolean) {
    try {
      await db.shippingBox.update({
          where: { id },
          data: { isEnabled }
      });
      revalidatePath("/admin/settings/shipping");
      return { success: true, message: "Box status updated" };
    } catch (error) {
      return { success: false, error: "Failed to update status" };
    }
  }