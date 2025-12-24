// File: app/actions/settings/shipping/local.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ShippingMethodType } from "@prisma/client";

// --- GET DATA ---
export async function getShippingData() {
  try {
    const zones = await db.shippingZone.findMany({
      include: { rates: true },
      orderBy: { name: 'asc' }
    });

    const classes = await db.shippingClass.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true }
    });

    const config = settings?.generalConfig as any || {};

    const options = {
        enableShippingCalc: config.enableShippingCalc ?? true,
        hideShippingCosts: config.hideShippingCosts ?? false,
        shippingDestination: config.shippingDestination ?? 'billing',
        
        sellingLocation: config.sellingLocation || 'all',
        sellingCountries: config.sellingCountries || [],
        shippingLocation: config.shippingLocation || 'all',
        shippingCountries: config.shippingCountries || [],
    };

    return { 
      success: true, 
      zones, 
      classes, 
      options 
    };
  } catch (error) {
    console.error("GET_SHIPPING_DATA_ERROR", error);
    return { success: false, error: "Failed to fetch shipping data" };
  }
}

// --- ZONES ---
export async function createShippingZone(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const countries = JSON.parse(formData.get("countries") as string || "[]");

    await db.shippingZone.create({
      data: {
        name,
        countries: countries 
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Shipping zone created" };
  } catch (error) {
    return { success: false, error: "Failed to create zone" };
  }
}

export async function deleteShippingZone(id: string) {
  try {
    await db.shippingZone.delete({ where: { id } });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Zone deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete zone" };
  }
}

// --- RATES ---
export async function addShippingRate(formData: FormData) {
  try {
    const zoneId = formData.get("zoneId") as string;
    const name = formData.get("name") as string;
    const type = (formData.get("type") as ShippingMethodType) || "FLAT_RATE";
    const price = parseFloat(formData.get("price") as string) || 0;
    
    const minPrice = formData.get("minPrice") ? parseFloat(formData.get("minPrice") as string) : null;
    const minWeight = formData.get("minWeight") ? parseFloat(formData.get("minWeight") as string) : null;
    const maxWeight = formData.get("maxWeight") ? parseFloat(formData.get("maxWeight") as string) : null;

    const taxStatus = (formData.get("taxStatus") as string) || "taxable";
    const freeShippingRequirement = formData.get("freeShippingRequirement") as string || null;

    // ✅ NEW: Receive Carrier ID
    const carrierServiceId = formData.get("carrierServiceId") as string || null;

    await db.shippingRate.create({
      data: {
        zoneId,
        name,
        type,
        price,
        minPrice,
        minWeight,
        maxWeight,
        taxStatus,              
        freeShippingRequirement,
        carrierServiceId // ✅ Save to DB
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Rate added" };
  } catch (error) {
    console.error("ADD_RATE_ERROR", error);
    return { success: false, error: "Failed to add rate" };
  }
}

export async function updateShippingRate(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    
    const minPrice = formData.get("minPrice") ? parseFloat(formData.get("minPrice") as string) : null;
    const minWeight = formData.get("minWeight") ? parseFloat(formData.get("minWeight") as string) : null;
    const maxWeight = formData.get("maxWeight") ? parseFloat(formData.get("maxWeight") as string) : null;
    
    const taxStatus = (formData.get("taxStatus") as string) || "taxable";
    const freeShippingRequirement = formData.get("freeShippingRequirement") as string || null;

    // We typically don't update carrierServiceId once created, but logic can be added here if needed
    
    await db.shippingRate.update({
      where: { id },
      data: {
        name,
        price,
        minPrice,
        minWeight,
        maxWeight,
        taxStatus,
        freeShippingRequirement
      }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Rate updated successfully" };
  } catch (error) {
    console.error("UPDATE_RATE_ERROR", error);
    return { success: false, error: "Failed to update rate" };
  }
}

export async function deleteShippingRate(id: string) {
  try {
    await db.shippingRate.delete({ where: { id } });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Rate deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete rate" };
  }
}

// --- CLASSES ---
export async function createShippingClass(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;

    await db.shippingClass.create({
      data: { name, slug, description }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Shipping class created" };
  } catch (error) {
    return { success: false, error: "Failed to create class" };
  }
}

export async function deleteShippingClass(id: string) {
  try {
    await db.shippingClass.delete({ where: { id } });
    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Class deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete class" };
  }
}

// --- OPTIONS ---
export async function updateShippingOptions(formData: FormData) {
  try {
    const enableCalc = formData.get("enable_shipping_calc") === "true";
    const hideCosts = formData.get("hide_shipping_costs") === "true";
    const shipDest = formData.get("shipping_destination") as string;

    const existing = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const currentConfig = existing?.generalConfig as any || {};

    const newConfig = {
      ...currentConfig,
      enableShippingCalc: enableCalc,
      hideShippingCosts: hideCosts,
      shippingDestination: shipDest
    };

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { generalConfig: newConfig }
    });

    revalidatePath("/admin/settings/shipping");
    return { success: true, message: "Shipping options saved" };
  } catch (error) {
    return { success: false, error: "Failed to save options" };
  }
}