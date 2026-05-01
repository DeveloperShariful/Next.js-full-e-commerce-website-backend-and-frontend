"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMode } from "@prisma/client";

const DEFAULT_PROVIDERS =[
  { providerId: "stripe", name: "Stripe (Credit/Debit Card)" },
  { providerId: "paypal", name: "PayPal" },
  { providerId: "cod", name: "Cash on Delivery" },
];

export async function getPaymentProviders() {
  try {
    let providers = await db.paymentProvider.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (providers.length === 0) {
      await db.paymentProvider.createMany({
        data: DEFAULT_PROVIDERS.map((p) => ({
          providerId: p.providerId,
          name: p.name,
          isEnabled: false,
          mode: "TEST",
        })),
      });
      providers = await db.paymentProvider.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return { success: true, providers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePaymentProvider(id: string, data: any) {
  try {
    const updated = await db.paymentProvider.update({
      where: { id },
      data: {
        name: data.name,
        isEnabled: data.isEnabled,
        mode: data.mode as PaymentMode,
        publicKey: data.publicKey,
        secretKey: data.secretKey,
        webhookSecret: data.webhookSecret,
        instructions: data.instructions,
      },
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: `${updated.name} settings updated!` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}