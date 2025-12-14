// app/actions/shipping.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- 1. GET ZONES & RATES ---
export async function getShippingZones() {
  try {
    const zones = await db.shippingZone.findMany({
      include: { rates: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: zones };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// --- 2. CREATE ZONE ---
export async function createZone(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Zone name required" };

    await db.shippingZone.create({
      data: {
        name,
        countries: ["BD"] // ডিফল্ট বাংলাদেশ, পরে মাল্টি-কান্ট্রি করা যাবে
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Shipping zone created" };
  } catch (error) {
    return { success: false, error: "Failed to create zone" };
  }
}

// --- 3. DELETE ZONE ---
export async function deleteZone(id: string) {
  try {
    await db.shippingZone.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true, message: "Zone deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

// --- 4. ADD RATE TO ZONE ---
export async function addRate(formData: FormData) {
  try {
    const zoneId = formData.get("zoneId") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const minPrice = formData.get("minPrice") ? parseFloat(formData.get("minPrice") as string) : null;

    if (!zoneId || !name) return { success: false, error: "Missing fields" };

    await db.shippingRate.create({
      data: {
        zoneId,
        name,
        price,
        minPrice, // কন্ডিশন (যেমন: ৫০০০ টাকার উপরে ফ্রি)
      }
    });

    revalidatePath("/admin/settings");
    return { success: true, message: "Rate added successfully" };
  } catch (error) {
    return { success: false, error: "Failed to add rate" };
  }
}

// --- 5. DELETE RATE ---
export async function deleteRate(id: string) {
  try {
    await db.shippingRate.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true, message: "Rate deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}