"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role, Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import {
  parseTabVisibility,
  TOGGLEABLE_TABS,
  type TabVisibility,
} from "./tab-config";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role === Role.CUSTOMER || user.role === Role.SUBSCRIBER) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getMyAccountTabVisibility(): Promise<TabVisibility> {
  await requireAdmin();
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
    select: { generalConfig: true },
  });
  return parseTabVisibility(settings?.generalConfig);
}

export async function updateMyAccountTabVisibility(input: TabVisibility) {
  await requireAdmin();

  // Build a clean, whitelisted map — only known toggleable ids are accepted.
  const cleaned: TabVisibility = {};
  for (const tab of TOGGLEABLE_TABS) {
    cleaned[tab.id] = input[tab.id] !== false; // anything not explicitly false stays visible
  }

  try {
    const existing = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true },
    });

    // Preserve every existing key inside generalConfig — only set myAccountTabs.
    const base =
      existing?.generalConfig &&
      typeof existing.generalConfig === "object" &&
      !Array.isArray(existing.generalConfig)
        ? (existing.generalConfig as Prisma.JsonObject)
        : {};

    const nextConfig: Prisma.JsonObject = {
      ...base,
      myAccountTabs: cleaned,
    };

    await db.storeSettings.upsert({
      where: { id: "settings" },
      update: { generalConfig: nextConfig },
      create: { id: "settings", generalConfig: nextConfig },
    });

    // Invalidate the cached store settings so the new visibility applies immediately
    // (read-your-own-writes); if nothing is saved, the cached value keeps serving.
    updateTag("store-settings");
    revalidatePath("/my-account");
    revalidatePath("/admin/settings");
    return { success: true, message: "My Account visibility saved." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    return { success: false, message };
  }
}
