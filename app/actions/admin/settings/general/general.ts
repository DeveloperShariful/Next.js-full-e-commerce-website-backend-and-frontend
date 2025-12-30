// File: app/actions/settings/general/general.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to extract symbol from code (e.g., USD -> $)
// আমরা এখানে Intl ব্যবহার করছি যাতে তোমার helper ফাইলের লজিকের সাথে মিল থাকে
const getSymbolFromCode = (currencyCode: string) => {
  try {
    const parts = new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).formatToParts(1);
    const symbol = parts.find(part => part.type === 'currency')?.value;
    return symbol || currencyCode;
  } catch (e) {
    return "";
  }
};

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
    // 1. Basic Info (Including Store Email for Admin Notifications)
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
    const currencyCode = formData.get("curr_currency") as string;
    const currencyOptions = {
        currency: currencyCode,
        currencyPosition: formData.get("curr_position"),
        thousandSeparator: formData.get("curr_thousand"),
        decimalSeparator: formData.get("curr_decimal"),
        numDecimals: parseInt(formData.get("curr_decimals") as string) || 2,
    };

    // ✅ FIX: Currency Symbol Generated Automatically from Code
    const currencySymbol = getSymbolFromCode(currencyCode);

    // 4. Configs
    const taxSettings = {
      enableTax: formData.get("enable_tax") === "true",
      pricesIncludeTax: formData.get("prices_include_tax") === "true",
    };

    // JSON Parsing
    let sellingCountries = [];
    let shippingCountries = [];
    try {
        const sellRaw = formData.get("conf_selling_countries") as string;
        const shipRaw = formData.get("conf_shipping_countries") as string;
        sellingCountries = sellRaw ? JSON.parse(sellRaw) : [];
        shippingCountries = shipRaw ? JSON.parse(shipRaw) : [];
    } catch (e) { console.error("JSON Parse Error", e); }

    const generalConfig = {
      sellingLocation: formData.get("conf_selling_location"),
      sellingCountries: sellingCountries,
      shippingLocation: formData.get("conf_shipping_location"),
      shippingCountries: shippingCountries,
      defaultCustomerLocation: formData.get("conf_customer_location"),
      enableCoupons: formData.get("enable_coupons") === "true",
      calcCouponsSequentially: formData.get("calc_coupons_seq") === "true",
      enableReviews: formData.get("enable_reviews") === "true",
      enableGuestCheckout: formData.get("enable_guest_checkout") === "true",
      currencyOptions: currencyOptions 
    };

    // ✅ 5. NEW FIELDS (Schema Compliance)
    const weightUnit = formData.get("weightUnit") as string || "kg";
    const dimensionUnit = formData.get("dimensionUnit") as string || "cm";
    const maintenance = formData.get("maintenance") === "true";

    const socialLinks = {
        facebook: formData.get("social_facebook"),
        instagram: formData.get("social_instagram"),
        twitter: formData.get("social_twitter"),
        youtube: formData.get("social_youtube"),
        linkedin: formData.get("social_linkedin"),
    };

    // Database Update
    await db.storeSettings.upsert({
      where: { id: "settings" },
      update: {
        storeName, storeEmail, storePhone,
        currency: currencyCode, 
        currencySymbol, // Symbol saved here
        weightUnit, 
        dimensionUnit,
        maintenance,
        socialLinks: socialLinks as any,
        storeAddress: storeAddress as any,
        taxSettings: taxSettings as any,
        generalConfig: generalConfig as any,
      },
      create: {
        id: "settings",
        storeName, storeEmail, storePhone,
        currency: currencyCode, 
        currencySymbol,
        weightUnit, 
        dimensionUnit,
        maintenance,
        socialLinks: socialLinks as any,
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