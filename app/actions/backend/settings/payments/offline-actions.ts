//File 5: app/actions/backend/settings/payments/offline-actions.ts

"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/audit-service"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { SharedGatewaySchema, OfflineSettingsSchema, OfflineSettingsType } from "@/app/(backend)/admin/settings/payments/types-and-schemas"

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  return user?.id || null;
}

// 1. UPDATE OFFLINE SETTINGS (Bank Transfer, COD, Cheque)
export async function updateOfflineSettings(
  id: string, 
  sharedValues: z.infer<typeof SharedGatewaySchema>, 
  settingsValues: OfflineSettingsType
) {
  const userId = await getDbUserId();
  
  try {
    const validatedShared = SharedGatewaySchema.parse(sharedValues);
    const validatedSettings = OfflineSettingsSchema.parse(settingsValues);

    const oldData = await db.paymentGateway.findUnique({ where: { id } });
    if (!oldData) throw new Error("Payment method not found.");

    await db.paymentGateway.update({
      where: { id },
      data: {
        name: validatedShared.name,
        title: validatedShared.title,
        description: validatedShared.description,
        isEnabled: validatedShared.isEnabled,
        mode: validatedShared.mode, // Usually LIVE for offline methods
        minOrderAmount: validatedShared.minOrderAmount,
        maxOrderAmount: validatedShared.maxOrderAmount,
        surchargeEnabled: validatedShared.surchargeEnabled,
        surchargeAmount: validatedShared.surchargeAmount ?? 0,
        // Save JSON settings securely (Bank details, instructions etc.)
        settings: validatedSettings as unknown as Prisma.InputJsonValue 
      }
    });

    await auditService.log({
      userId: userId || "SYSTEM",
      action: "UPDATE_OFFLINE_PAYMENT",
      entity: "PaymentGateway",
      entityId: id,
      oldData: { isEnabled: oldData.isEnabled },
      newData: { isEnabled: validatedShared.isEnabled, method: validatedShared.name }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: `${validatedShared.name} updated successfully.` };
  } catch (error: unknown) {
    console.error("Offline Update Error:", error);
    return { success: false, error: "Failed to update offline payment settings." };
  }
}