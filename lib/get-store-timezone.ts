import { getCachedStoreSettings } from "@/lib/global-settings-cache";

export async function getStoreTimezone(): Promise<string> {
  try {
    const settings = await getCachedStoreSettings();
    return settings?.timezone || "UTC";
  } catch {
    return "UTC";
  }
}
