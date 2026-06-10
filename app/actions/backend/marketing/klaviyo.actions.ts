//app/actions/backend/marketing/klaviyo.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const KLAVIYO_REVISION = "2024-02-15";

export interface KlaviyoSettings {
  klaviyoEnabled: boolean;
  klaviyoPublicKey: string;
  klaviyoPrivateKey: string;
  selectedListId: string;
}

// ============================================================================
// 1. FETCH LIVE KLAVIYO LISTS FROM API
// ============================================================================
export async function fetchKlaviyoLists(privateKey: string) {
  try {
    if (!privateKey || privateKey.trim() === "") {
      return { success: false, error: "Private API Key is required to fetch lists." };
    }

    const response = await fetch("https://a.klaviyo.com/api/lists/", {
      method: "GET",
      headers: {
        "Authorization": `Klaviyo-API-Key ${privateKey.trim()}`,
        "revision": KLAVIYO_REVISION,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.errors?.[0]?.detail || "Invalid Private API Key or API error.";
      return { success: false, error: errMsg };
    }

    const resData = await response.json();
    const lists = resData.data || [];

    const formattedLists = lists.map((list: any) => ({
      id: list.id, 
      name: list.attributes?.name || "Unnamed List"
    }));

    return { success: true, lists: formattedLists };
  } catch (error: any) {
    console.error("Klaviyo List Fetch Error:", error);
    return { success: false, error: error.message || "Failed to connect to Klaviyo." };
  }
}

// ============================================================================
// 2. SAVE & CONNECT KLAVIYO SETTINGS
// ============================================================================
export async function saveKlaviyoSettings(data: KlaviyoSettings) {
  try {
    const listConfig = {
      newsletter: data.selectedListId 
    };

    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        klaviyoEnabled: data.klaviyoEnabled,
        klaviyoPublicKey: data.klaviyoPublicKey.trim(),
        klaviyoPrivateKey: data.klaviyoPrivateKey.trim(),
        klaviyoListIds: listConfig,
      },
      create: {
        id: "marketing_config",
        klaviyoEnabled: data.klaviyoEnabled,
        klaviyoPublicKey: data.klaviyoPublicKey.trim(),
        klaviyoPrivateKey: data.klaviyoPrivateKey.trim(),
        klaviyoListIds: listConfig,
      }
    });

    revalidatePath("/admin/marketing/klaviyo");
    return { success: true, message: "Klaviyo integration configured successfully!" };
  } catch (error: any) {
    console.error("Save Klaviyo Settings Error:", error);
    return { success: false, error: "Failed to save Klaviyo settings." };
  }
}

// ============================================================================
// 3. GET CURRENT KLAVIYO CONFIG FROM DATABASE
// ============================================================================
export async function getKlaviyoConfig() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        klaviyoEnabled: true,
        klaviyoPublicKey: true,
        klaviyoPrivateKey: true,
        klaviyoListIds: true
      }
    });

    if (!config) {
      return {
        success: true,
        data: { klaviyoEnabled: false, klaviyoPublicKey: "", klaviyoPrivateKey: "", selectedListId: "" }
      };
    }

    const listIds = config.klaviyoListIds as Record<string, any> | null;
    const selectedListId = listIds?.newsletter || "";

    return {
      success: true,
      data: {
        klaviyoEnabled: config.klaviyoEnabled,
        klaviyoPublicKey: config.klaviyoPublicKey || "",
        klaviyoPrivateKey: config.klaviyoPrivateKey || "",
        selectedListId
      }
    };
  } catch (error: any) {
    console.error("Get Klaviyo Config Error:", error);
    return { success: false, error: "Failed to load configuration." };
  }
}

// ============================================================================
// 4. SERVER ACTION: SUBSCRIBE EMAIL TO KLAVIYO NEWSLETTER LIST
// ============================================================================
export async function subscribeUserToKlaviyo(email: string) {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { klaviyoEnabled: true, klaviyoPrivateKey: true, klaviyoListIds: true }
    });

    if (!config?.klaviyoEnabled || !config.klaviyoPrivateKey || !config.klaviyoListIds) {
      return { success: false, error: "Klaviyo integration is disabled." };
    }

    const listIds = config.klaviyoListIds as Record<string, any>;
    const targetListId = listIds.newsletter; 

    if (!targetListId) {
      return { success: false, error: "No target newsletter list configured." };
    }

    const requestBody = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: email.trim().toLowerCase()
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: targetListId
            }
          }
        }
      }
    };

    const response = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${config.klaviyoPrivateKey.trim()}`,
        "revision": KLAVIYO_REVISION,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody),
      cache: "no-store"
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Klaviyo Subscription Failed:", err);
      return { success: false, error: err?.errors?.[0]?.detail || "Failed to subscribe." };
    }

    return { success: true, message: "Successfully subscribed to newsletter!" };
  } catch (error: any) {
    console.error("Klaviyo Subscription Exception:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 🚀 5. NEW: FETCH SUBSCRIBERS FROM SPECIFIC KLAVIYO LIST
// ============================================================================
export async function fetchKlaviyoListProfiles(listId: string) {
  try {
    if (!listId || listId.trim() === "") return { success: true, profiles: [] };

    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { klaviyoPrivateKey: true }
    });

    if (!config?.klaviyoPrivateKey) {
      return { success: false, error: "Private API Key missing in DB." };
    }

    // 🚀 ক্লাভিও v3 Profiles List এপিআই কল (ইমেইল, নাম ও ফোন নম্বর নিয়ে আসবে)
    const response = await fetch(`https://a.klaviyo.com/api/lists/${listId}/profiles/?fields[profile]=email,first_name,last_name,phone_number`, {
      method: "GET",
      headers: {
        "Authorization": `Klaviyo-API-Key ${config.klaviyoPrivateKey.trim()}`,
        "revision": KLAVIYO_REVISION,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err?.errors?.[0]?.detail || "Failed to fetch profiles." };
    }

    const resData = await response.json();
    const data = resData.data || [];

    const formattedProfiles = data.map((profile: any) => {
      const attr = profile.attributes || {};
      const email = attr.email || "No Email";
      const firstName = attr.firstName || "";
      const lastName = attr.lastName || "";
      const phone = attr.phoneNumber || "No Phone";
      
      const name = `${firstName} ${lastName}`.trim() || "Anonymous Subscriber";

      return {
        id: profile.id,
        email,
        name,
        phone
      };
    });

    return { success: true, profiles: formattedProfiles };
  } catch (error: any) {
    console.error("Klaviyo Profiles Fetch Error:", error);
    return { success: false, error: error.message || "Failed to load profiles." };
  }
}