// File: app/actions/settings/shipping/update-order-customer.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderCustomerDetails(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    
    // Personal Info
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Shipping Address
    const shipAddress1 = formData.get("ship_address1") as string;
    const shipCity = formData.get("ship_city") as string;
    const shipState = formData.get("ship_state") as string;
    const shipPostcode = formData.get("ship_postcode") as string;
    const shipCountry = formData.get("ship_country") as string;

    // Billing Address (Same logic, simple implementation)
    // For simplicity, we are saving same or updated object structure
    const shippingAddress = {
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
        address1: shipAddress1,
        city: shipCity,
        state: shipState,
        postcode: shipPostcode,
        country: shipCountry,
        phone: phone,
        email: email
    };

    // Update DB
    await db.order.update({
        where: { id: orderId },
        data: {
            guestEmail: email, // গেস্ট হলে ইমেইল আপডেট হবে
            shippingAddress: shippingAddress,
            billingAddress: shippingAddress // আপনি চাইলে বিলিং এর জন্য আলাদা ইনপুট নিতে পারেন
        }
    });

    // Add Note for Audit
    await db.orderNote.create({
        data: {
            orderId,
            content: "Customer details and shipping address updated manually by admin.",
            isSystem: true
        }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Customer details updated successfully" };

  } catch (error) {
    console.error("UPDATE_CUSTOMER_ERROR:", error);
    return { success: false, error: "Failed to update details" };
  }
}