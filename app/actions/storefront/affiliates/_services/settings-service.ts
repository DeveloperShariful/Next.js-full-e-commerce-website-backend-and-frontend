//app/actions/storefront/affiliates/_services/settings-service.ts

import { db } from "@/lib/prisma";

export const settingsService = {
  async getSettings(userId: string) {
    const affiliate = await db.affiliateAccount.findUnique({
      where: { userId },
      include: {
        pixels: true // Include tracking pixels
      }
    });

    if (!affiliate) return null;

    return {
      id: affiliate.id,
      paypalEmail: affiliate.paypalEmail,
      bankDetails: affiliate.bankDetails as any, 
      pixels: affiliate.pixels.map(p => ({
        id: p.id,
        // ✅ FIX: 'provider' -> 'type'
        provider: p.type, 
        pixelId: p.pixelId,
        // ✅ FIX: 'enabled' -> 'isEnabled'
        enabled: p.isEnabled 
      }))
    };
  }
};