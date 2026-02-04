// File: app/actions/settings/payments/payments-dashboard.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/services/audit-service"
import { auth } from "@clerk/nextjs/server"
import { PaymentMode } from "@prisma/client"

export async function getAllPaymentMethods() {
  try {
    const methods = await db.paymentMethodConfig.findMany({
      include: {
        stripeConfig: true,
        paypalConfig: true,
        offlineConfig: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    })

    const decryptedMethods = methods.map((method) => {
      if (method.stripeConfig) {
        method.stripeConfig.liveSecretKey = decrypt(method.stripeConfig.liveSecretKey ?? "")
        method.stripeConfig.liveWebhookSecret = decrypt(method.stripeConfig.liveWebhookSecret ?? "")
        method.stripeConfig.testSecretKey = decrypt(method.stripeConfig.testSecretKey ?? "")
        method.stripeConfig.testWebhookSecret = decrypt(method.stripeConfig.testWebhookSecret ?? "")
      }

      if (method.paypalConfig) {
        method.paypalConfig.liveClientSecret = decrypt(method.paypalConfig.liveClientSecret ?? "")
        method.paypalConfig.sandboxClientSecret = decrypt(method.paypalConfig.sandboxClientSecret ?? "")
      }

      return method
    })

    return { success: true, data: JSON.parse(JSON.stringify(decryptedMethods)) }
  } catch (error) {
    return { success: false, error: "Failed to fetch payment methods" }
  }
}

export async function togglePaymentMethodStatus(id: string, isEnabled: boolean) {
  const { userId } = await auth();
  
  try {
    const oldData = await db.paymentMethodConfig.findUnique({ where: { id } });

    await db.paymentMethodConfig.update({
      where: { id },
      data: { isEnabled },
    });

    await auditService.log({
        userId: userId ?? "system",
        action: isEnabled ? "ENABLE_PAYMENT_METHOD" : "DISABLE_PAYMENT_METHOD",
        entity: "PaymentMethodConfig",
        entityId: id,
        oldData: { isEnabled: oldData?.isEnabled },
        newData: { isEnabled: isEnabled }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

export async function resetPaymentMethodsDB() {
  const { userId } = await auth();
  
  try {
    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.deleteMany({})
      
      const methods = [
        { identifier: "stripe", name: "Credit / Debit Card", description: "Pay securely with Visa, Mastercard.", isEnabled: true, mode: "TEST" },
        { identifier: "paypal", name: "PayPal", description: "Pay with PayPal account.", isEnabled: true, mode: "TEST" },
        { identifier: "bank_transfer", name: "Bank Transfer", description: "Direct bank wire transfer.", isEnabled: false, mode: "LIVE" },
        { identifier: "cheque", name: "Cheque Payment", description: "Pay by sending a cheque.", isEnabled: false, mode: "LIVE" },
        { identifier: "cod", name: "Cash on Delivery", description: "Pay upon delivery.", isEnabled: false, mode: "LIVE" }
      ]

      for (const m of methods) {
        const config = await tx.paymentMethodConfig.create({
          data: {
            identifier: m.identifier,
            name: m.name,
            description: m.description,
            isEnabled: m.isEnabled,
            mode: m.mode as PaymentMode
          }
        })

        if (m.identifier === "stripe") {
            await tx.stripeConfig.create({ data: { paymentMethodId: config.id } })
        } 
        else if (m.identifier === "paypal") {
            await tx.paypalConfig.create({ data: { paymentMethodId: config.id } })
        } 
        else {
            await tx.offlinePaymentConfig.create({ data: { paymentMethodId: config.id } })
        }
      }
    });

    await auditService.log({
        userId: userId ?? "system",
        action: "RESET_PAYMENT_DB",
        entity: "PaymentMethodConfig",
        entityId: "ALL",
        newData: { status: "Resetted to defaults" }
    });

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    await auditService.systemLog("CRITICAL", "RESET_DB_ERROR", "Database reset failed", { error });
    return { success: false, error: "Failed to reset DB." }
  }
}