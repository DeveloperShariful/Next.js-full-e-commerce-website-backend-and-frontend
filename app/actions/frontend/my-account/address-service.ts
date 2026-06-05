// File: app/actions/frontend/my-account/address-service.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { AddressType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addressSchema = z.object({
  type: z.nativeEnum(AddressType),
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  company: z.string().optional().or(z.literal("")),
  address1: z.string().min(3, "Address is required."),
  address2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  postcode: z.string().min(3, "Postcode is required."),
  country: z.string().min(2, "Country code required.").default("AU"),
  phone: z.string().min(5, "Valid phone number required."),
});

type AddressInput = z.infer<typeof addressSchema>;

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Customer session not found.");
  return user;
}

// ==========================================
// WRITE OPERATIONS (MUTATIONS)
// ==========================================
export async function saveAddressAction(data: AddressInput) {
  try {
    const customer = await getAuthCustomer();

    const result = addressSchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        message: result.error.issues[0].message 
      };
    }

    const payload = result.data;

    // Check if address already exists for this type
    const existingAddress = await db.address.findFirst({
      where: {
        userId: customer.id,
        type: payload.type
      }
    });

    const dbPayload = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      company: payload.company ? payload.company.trim() : null,
      address1: payload.address1.trim(),
      address2: payload.address2 ? payload.address2.trim() : null,
      city: payload.city.trim(),
      state: payload.state.trim(),
      postcode: payload.postcode.trim(),
      country: payload.country.trim(),
      phone: payload.phone.trim(),
      isDefault: true // Customer account addresses are default by nature
    };

    if (existingAddress) {
      await db.address.update({
        where: { id: existingAddress.id },
        data: dbPayload
      });
    } else {
      await db.address.create({
        data: {
          userId: customer.id,
          type: payload.type,
          ...dbPayload
        }
      });
    }

    revalidatePath("/my-account");
    return { success: true, message: `${payload.type === "BILLING" ? "Billing" : "Shipping"} address saved successfully.` };

  } catch (error: any) {
    console.error("Address Save Error:", error);
    return { success: false, message: error.message || "Failed to save address." };
  }
}