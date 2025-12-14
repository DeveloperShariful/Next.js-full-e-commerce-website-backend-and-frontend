// app/actions/profile.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    // Password change logic can be added here later

    await db.user.update({
      where: { id: session.user.id },
      data: { name, phone }
    });

    revalidatePath("/admin/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}