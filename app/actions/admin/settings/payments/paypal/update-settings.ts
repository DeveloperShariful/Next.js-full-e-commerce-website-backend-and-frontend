// File: app/actions/settings/payments/paypal/update-settings.ts

"use server"

import { db } from "@/lib/prisma"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { secureAction } from "@/lib/server-action-wrapper"
import { encrypt } from "../crypto"
import { z } from "zod"

const UpdatePaypalSchema = PaypalSettingsSchema.extend({
  paymentMethodId: z.string()
});

export async function updatePaypalSettings(paymentMethodId: string, values: z.infer<typeof PaypalSettingsSchema>) {
  return secureAction(
    { paymentMethodId, ...values },
    {
      actionName: "UPDATE_PAYPAL_SETTINGS",
      auditEntity: "PaypalConfig",
      schema: UpdatePaypalSchema,
      role: "ADMIN",
      idExtractor: (data) => data.id
    },
    async (input, user) => {
      // 1. Fetch Old Data
      const oldConfig = await db.paypalConfig.findUnique({
        where: { paymentMethodId: input.paymentMethodId },
        include: { paymentMethod: true }
      });

      // 2. Encryption
      const liveClientSecret = input.liveClientSecret ? encrypt(input.liveClientSecret) : undefined;
      const sandboxClientSecret = input.sandboxClientSecret ? encrypt(input.sandboxClientSecret) : undefined;

      // 3. DB Transaction
      const result = await db.$transaction(async (tx) => {
        // Update Parent
        await tx.paymentMethodConfig.update({
          where: { id: input.paymentMethodId },
          data: {
            isEnabled: input.isEnabled ?? false,
            name: input.title,
            description: input.description ?? "",
            mode: input.sandbox ? "TEST" : "LIVE",
            minOrderAmount: input.minOrderAmount ? Number(input.minOrderAmount) : null,
            maxOrderAmount: input.maxOrderAmount ? Number(input.maxOrderAmount) : null,
            surchargeEnabled: input.surchargeEnabled ?? false,
            surchargeType: input.surchargeType ?? "fixed",
            surchargeAmount: input.surchargeAmount ? Number(input.surchargeAmount) : 0,
            taxableSurcharge: input.taxableSurcharge ?? false
          }
        });

        // Update PayPal Config (ALL FIELDS MAPPED)
        return await tx.paypalConfig.update({
          where: { paymentMethodId: input.paymentMethodId },
          data: {
            sandbox: input.sandbox ?? false,
            
            // Credentials
            liveEmail: input.liveEmail ?? null,
            liveClientId: input.liveClientId ?? null,
            ...(liveClientSecret && { liveClientSecret }),
            sandboxEmail: input.sandboxEmail ?? null,
            sandboxClientId: input.sandboxClientId ?? null,
            ...(sandboxClientSecret && { sandboxClientSecret }),
            
            // General
            title: input.title,
            description: input.description ?? "",
            intent: input.intent ?? "CAPTURE",
            instantPayments: input.instantPayments ?? false,
            brandName: input.brandName ?? null,
            landingPage: input.landingPage ?? "LOGIN",
            
            // Buttons & Funding
            disableFunding: input.disableFunding ?? [],
            advancedCardEnabled: input.advancedCardEnabled ?? false,
            advancedCardTitle: input.advancedCardTitle ?? "Debit & Credit Cards",
            vaultingEnabled: input.vaultingEnabled ?? false,
            smartButtonLocations: input.smartButtonLocations ?? [],
            requireFinalConfirmation: input.requireFinalConfirmation ?? true,
            buttonLabel: input.buttonLabel ?? "PAYPAL",
            buttonLayout: input.buttonLayout ?? "VERTICAL",
            buttonColor: input.buttonColor ?? "GOLD",
            buttonShape: input.buttonShape ?? "RECT",
            
            // Pay Later
            payLaterEnabled: input.payLaterEnabled ?? true,
            payLaterLocations: input.payLaterLocations ?? [],
            payLaterMessaging: input.payLaterMessaging ?? true,
            payLaterMessageTheme: input.payLaterMessageTheme ?? "light",
            
            // Technical
            subtotalMismatchBehavior: input.subtotalMismatchBehavior ?? "add_line_item",
            invoicePrefix: input.invoicePrefix ?? null,
            debugLog: input.debugLog ?? false,
          }
        });
      });

      return { 
        success: true, 
        data: result, 
        oldData: oldConfig, 
        message: "PayPal settings updated successfully." 
      };
    }
  );
}