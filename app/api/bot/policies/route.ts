// GET /api/bot/policies
//
// Store contact details + any general config the bot can safely quote.
// Returns/warranty/shipping prose that isn't stored structurally stays as
// curated text inside the bot itself.

import { db } from "@/lib/prisma";
import { assertBotAuth, botJson } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = assertBotAuth(req);
  if (denied) return denied;

  try {
    const settings = await db.storeSettings.findFirst({
      select: {
        storeName: true,
        storeEmail: true,
        storePhone: true,
        currency: true,
        currencySymbol: true,
        socialLinks: true,
        timezone: true,
        storeAddress: true,
        generalConfig: true,
      },
    });

    return botJson({
      storeName: settings?.storeName || "GoBike",
      storeEmail: settings?.storeEmail || null,
      storePhone: settings?.storePhone || null,
      currency: settings?.currency || "AUD",
      currencySymbol: settings?.currencySymbol || "$",
      socialLinks: settings?.socialLinks || null,
      timezone: settings?.timezone || "Australia/Sydney",
      storeAddress: settings?.storeAddress || null,
      generalConfig: settings?.generalConfig || null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[bot/policies] failed:", err);
    return botJson({ error: "Failed to load policies." }, { status: 500 });
  }
}
