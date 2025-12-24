// File: app/actions/settings/shipping/locations.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- GET DATA ---
export async function getLocationsData() {
  try {
    // পিকআপ লোকেশনগুলো ফেচ করা
    const pickupLocations = await db.pickupLocation.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // মেইন শিপিং অরিজিন (Default Warehouse/Location) ফেচ করা
    const originLocation = await db.location.findFirst({
      where: { isDefault: true }
    });

    return { 
      success: true, 
      pickupLocations,
      originLocation
    };
  } catch (error) {
    console.error("GET_LOCATIONS_ERROR", error);
    return { success: false, error: "Failed to fetch location data" };
  }
}

// --- SAVE PICKUP LOCATION ---
export async function savePickupLocation(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const postcode = formData.get("postcode") as string;
    const country = formData.get("country") as string || "BD";
    const instructions = formData.get("instructions") as string;
    
    // Optional: Opening Hours (Storing as JSON string if needed, or simple text for now)
    // For simplicity in this form, we aren't parsing detailed JSON hours yet.

    const data = {
        name,
        address,
        city,
        state,
        postcode,
        country,
        instructions,
        isActive: true
    };

    if (id) {
        await db.pickupLocation.update({ where: { id }, data });
    } else {
        await db.pickupLocation.create({ data });
    }

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: id ? "Pickup location updated" : "Pickup location added" };
  } catch (error) {
    console.error("SAVE_PICKUP_ERROR", error);
    return { success: false, error: "Failed to save pickup location" };
  }
}

// --- DELETE PICKUP ---
export async function deletePickupLocation(id: string) {
  try {
    await db.pickupLocation.delete({ where: { id } });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Location removed" };
  } catch (error) {
    return { success: false, error: "Failed to delete location" };
  }
}

// --- TOGGLE PICKUP STATUS ---
export async function togglePickupStatus(id: string, isActive: boolean) {
  try {
    await db.pickupLocation.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Status updated" };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

// --- SAVE ORIGIN ADDRESS (Main Warehouse) ---
export async function saveOriginAddress(formData: FormData) {
  try {
    const id = formData.get("id") as string; // Location ID
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    
    if (id) {
        await db.location.update({
            where: { id },
            data: { name, address, isDefault: true }
        });
    } else {
        // If no default location exists, create one
        await db.location.create({
            data: { 
                name: name || "Main Warehouse", 
                address, 
                isDefault: true,
                isActive: true
            }
        });
    }

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Shipping origin saved" };
  } catch (error) {
    return { success: false, error: "Failed to save origin address" };
  }
}