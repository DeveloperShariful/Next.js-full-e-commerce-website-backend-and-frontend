//File: app/actions/admin/settings/payments/stripe/disconnect-stripe.ts

"use server"

import { db } from "@/lib/prisma"
import { secureAction } from "@/lib/security/server-action-wrapper"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const DisconnectSchema = z.object({
  paymentMethodId: z.string()
});

export async function disconnectStripe(paymentMethodId: string) {
  return secureAction(
    { paymentMethodId },
    {
      actionName: "DISCONNECT_STRIPE",
      auditEntity: "StripeConfig",
      schema: DisconnectSchema,
      role: "ADMIN",
      idExtractor: (data) => data.paymentMethodId
    },
    async (input, user) => {
      // 1. Wipe Keys from Database
      await db.$transaction(async (tx) => {
        await tx.stripeConfig.update({
          where: { paymentMethodId: input.paymentMethodId },
          data: {
            livePublishableKey: "",
            liveSecretKey: null, // Wipe Key
            liveWebhookSecret: null, // Wipe Webhook
            testPublishableKey: "",
            testSecretKey: null, // Wipe Key
            testWebhookSecret: null, // Wipe Webhook
            isConnected: false
          }
        });

        // 2. Disable the Method
        await tx.paymentMethodConfig.update({
          where: { id: input.paymentMethodId },
          data: { isEnabled: false }
        });
      });

      revalidatePath("/admin/settings/payments");

      return { 
        success: true, 
        message: "Stripe disconnected and keys removed." 
      };
    }
  );
}