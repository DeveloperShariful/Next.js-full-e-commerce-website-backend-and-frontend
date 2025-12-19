// File: app/actions/settings/general.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getGeneralSettings() {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
    });
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateGeneralSettings(formData: FormData) {
  try {
    // 1. Basic Info
    const storeName = formData.get("storeName") as string;
    const storeEmail = formData.get("storeEmail") as string;
    const storePhone = formData.get("storePhone") as string;

    // 2. Address
    const storeAddress = {
      address1: formData.get("addr_address1"),
      address2: formData.get("addr_address2"),
      city: formData.get("addr_city"),
      country: formData.get("addr_country"),
      postcode: formData.get("addr_postcode"),
    };

    // 3. Currency Options
    const currencyOptions = {
        currency: formData.get("curr_currency"),
        currencyPosition: formData.get("curr_position"),
        thousandSeparator: formData.get("curr_thousand"),
        decimalSeparator: formData.get("curr_decimal"),
        numDecimals: parseInt(formData.get("curr_decimals") as string) || 2,
    };

    // 4. Configs
    const taxSettings = {
      enableTax: formData.get("enable_tax") === "true",
      pricesIncludeTax: formData.get("prices_include_tax") === "true",
    };

    // ✅ FIX: Parse JSON arrays correctly safely
    let sellingCountries = [];
    let shippingCountries = [];
    
    try {
        const sellRaw = formData.get("conf_selling_countries") as string;
        const shipRaw = formData.get("conf_shipping_countries") as string;
        sellingCountries = sellRaw ? JSON.parse(sellRaw) : [];
        shippingCountries = shipRaw ? JSON.parse(shipRaw) : [];
    } catch (e) {
        console.error("JSON Parse Error", e);
    }

    const generalConfig = {
      sellingLocation: formData.get("conf_selling_location"),
      sellingCountries: sellingCountries, // Saved as Array
      shippingLocation: formData.get("conf_shipping_location"),
      shippingCountries: shippingCountries, // Saved as Array
      defaultCustomerLocation: formData.get("conf_customer_location"),
      enableCoupons: formData.get("enable_coupons") === "true",
      calcCouponsSequentially: formData.get("calc_coupons_seq") === "true",
      currencyOptions: currencyOptions // Save currency inside config too
    };

    const currency = currencyOptions.currency as string;
    const currencySymbol = ""; 

    // ✅ FIX: Single DB Call using UPSERT
    await db.storeSettings.upsert({
      where: { id: "settings" },
      update: {
        storeName, storeEmail, storePhone,
        currency, currencySymbol,
        storeAddress: storeAddress as any,
        taxSettings: taxSettings as any,
        generalConfig: generalConfig as any,
      },
      create: {
        id: "settings",
        storeName, storeEmail, storePhone,
        currency, currencySymbol,
        storeAddress: storeAddress as any,
        taxSettings: taxSettings as any,
        generalConfig: generalConfig as any,
      }
    });

    revalidatePath("/admin/settings/general");
    return { success: true, message: "Settings saved successfully!" };

  } catch (error) {
    console.error("SETTINGS_UPDATE_ERROR:", error);
    return { success: false, error: "Failed to update settings." };
  }
}