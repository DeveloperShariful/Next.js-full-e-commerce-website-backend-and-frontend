// File: app/actions/settings/payments/offline-payment-method.ts


"use server"

import { db } from "@/lib/prisma"
import { BankTransferSchema, ChequeSchema, CodSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/services/audit-service"
import { auth } from "@clerk/nextjs/server"

// Helper to fetch DB User ID
async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  return user?.id || null;
}

// 1. BANK TRANSFER
export async function updateBankTransferSettings(id: string, values: z.infer<typeof BankTransferSchema>) {
  const userId = await getDbUserId();
  
  try {
    const validated = BankTransferSchema.parse(values)
    const oldData = await db.paymentMethodConfig.findUnique({
        where: { id },
        include: { offlineConfig: true }
    });

    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
          isEnabled: validated.isEnabled ?? false,
          minOrderAmount: validated.minOrderAmount ? Number(validated.minOrderAmount) : null,
          maxOrderAmount: validated.maxOrderAmount ? Number(validated.maxOrderAmount) : null,
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType ?? "fixed",
          surchargeAmount: validated.surchargeAmount ? Number(validated.surchargeAmount) : 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        },
      })

      await tx.offlinePaymentConfig.upsert({
        where: { paymentMethodId: id },
        create: { paymentMethodId: id, bankDetails: validated.bankDetails ?? [] },
        update: { bankDetails: validated.bankDetails ?? [] }
      })
    })

    await auditService.log({
        userId: userId,
        action: "UPDATE_BANK_TRANSFER",
        entity: "PaymentMethodConfig",
        entityId: id,
        oldData: { enabled: oldData?.isEnabled },
        newData: { enabled: validated.isEnabled }
    });

    revalidatePath("/admin/settings/payments")
    return { success: true, message: "Bank Transfer settings updated." }
  } catch (error: any) {
    await auditService.systemLog("ERROR", "UPDATE_BANK_TRANSFER", "Failed to update", { error });
    return { success: false, error: "Failed to update bank settings" }
  }
}

// 2. CHEQUE
export async function updateChequeSettings(id: string, values: z.infer<typeof ChequeSchema>) {
  const userId = await getDbUserId(); 
  try {
    const validated = ChequeSchema.parse(values)
    
    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
          isEnabled: validated.isEnabled ?? false,
          minOrderAmount: validated.minOrderAmount ? Number(validated.minOrderAmount) : null,
          maxOrderAmount: validated.maxOrderAmount ? Number(validated.maxOrderAmount) : null,
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType ?? "fixed",
          surchargeAmount: validated.surchargeAmount ? Number(validated.surchargeAmount) : 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        },
      })

      await tx.offlinePaymentConfig.upsert({
        where: { paymentMethodId: id },
        create: { paymentMethodId: id, chequePayTo: validated.chequePayTo, addressInfo: validated.addressInfo },
        update: { chequePayTo: validated.chequePayTo, addressInfo: validated.addressInfo }
      })
    })
    revalidatePath("/admin/settings/payments")
    return { success: true, message: "Cheque settings updated." }
  } catch (error) {
    return { success: false, error: "Failed to update cheque settings" }
  }
}

// 3. COD
export async function updateCodSettings(id: string, values: z.infer<typeof CodSchema>) {
  try {
    const validated = CodSchema.parse(values)
    
    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
          isEnabled: validated.isEnabled ?? false,
          minOrderAmount: validated.minOrderAmount ? Number(validated.minOrderAmount) : null,
          maxOrderAmount: validated.maxOrderAmount ? Number(validated.maxOrderAmount) : null,
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType ?? "fixed",
          surchargeAmount: validated.surchargeAmount ? Number(validated.surchargeAmount) : 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        },
      })

      await tx.offlinePaymentConfig.upsert({
        where: { paymentMethodId: id },
        create: { paymentMethodId: id, enableForShippingMethods: validated.enableForShippingMethods ?? [] },
        update: { enableForShippingMethods: validated.enableForShippingMethods ?? [] }
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true, message: "COD settings updated." }
  } catch (error) {
    return { success: false, error: "Failed to update COD settings" }
  }
}