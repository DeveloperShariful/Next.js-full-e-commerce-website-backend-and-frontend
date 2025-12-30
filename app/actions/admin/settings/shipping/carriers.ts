// File: app/actions/settings/shipping/carriers.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- GET CARRIERS ---
export async function getCarrierServices() {
  try {
    const carriers = await db.carrierService.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, carriers };
  } catch (error) {
    return { success: false, error: "Failed to fetch carriers" };
  }
}

// --- TOGGLE STATUS ---
export async function toggleCarrierStatus(id: string, isEnabled: boolean) {
  try {
    await db.carrierService.update({
      where: { id },
      data: { isEnabled }
    });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Carrier status updated" };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

// --- SAVE / UPDATE CARRIER ---
export async function saveCarrierService(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/ /g, '-');
    const apiKey = formData.get("apiKey") as string;
    const apiSecret = formData.get("apiSecret") as string;
    const isSandbox = formData.get("isSandbox") === "true";

    if (id) {
        await db.carrierService.update({
            where: { id },
            data: { name, apiKey, apiSecret, isSandbox }
        });
    } else {
        await db.carrierService.create({
            data: { name, slug, apiKey, apiSecret, isSandbox, isEnabled: true }
        });
    }

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Carrier details saved" };
  } catch (error) {
    return { success: false, error: "Failed to save carrier" };
  }
}

// --- DELETE CARRIER ---
export async function deleteCarrierService(id: string) {
    try {
      await db.carrierService.delete({ where: { id } });
      revalidatePath("/admin/settings/shipping");
      return { success: true, message: "Carrier removed" };
    } catch (error) {
      return { success: false, error: "Failed to delete carrier" };
    }
  }