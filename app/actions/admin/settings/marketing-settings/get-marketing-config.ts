// File: app/actions/admin/settings/marketing-settings/get-marketing-config.ts
"use server";

import { db } from "@/lib/prisma"; 

export async function getMarketingConfig() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
    });

    return config;
  } catch (error) {
    console.error("Failed to fetch marketing config:", error);
    return null;
  }
}