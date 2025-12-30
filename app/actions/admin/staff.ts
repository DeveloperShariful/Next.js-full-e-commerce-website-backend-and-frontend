// app/actions/staff.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";

// --- ZOD SCHEMAS ---
// Clerk এর কারণে পাসওয়ার্ড ফিল্ড বাদ দেওয়া হয়েছে
const StaffSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.nativeEnum(Role),
});

export type ActionState = {
  success: boolean;
  message?: string;
  error?: string;
};

// 1. GET STAFFS
export async function getStaffs() {
  try {
    const staffs = await db.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.MANAGER, Role.EDITOR, Role.SUPPORT, Role.SUPER_ADMIN]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: staffs };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 2. CREATE STAFF (Pre-seed in DB)
export async function createStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    };

    const validated = StaffSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, role } = validated.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "User already exists with this email!" };

    // Create user in DB (Clerk will link automatically via Webhook when they sign up)
    await db.user.create({
      data: {
        name,
        email,
        role,
        image: null, 
      }
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff added! Ask them to Sign Up using this email." };

  } catch (error) {
    console.error("CREATE_STAFF_ERROR", error);
    return { success: false, error: "Internal server error" };
  }
}

// 3. UPDATE STAFF
export async function updateStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const rawData = {
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    };

    const validated = StaffSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, name, email, role } = validated.data;

    // Check duplicate email (excluding self)
    if (id) {
        const existingUser = await db.user.findFirst({
            where: { email, NOT: { id } }
        });
        if (existingUser) return { success: false, error: "Email taken by another user" };

        await db.user.update({
            where: { id },
            data: { name, email, role }
        });
    }

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff profile updated" };

  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// 4. DELETE STAFF
export async function deleteStaff(id: string): Promise<ActionState> {
  try {
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff removed from database" };
  } catch (error) {
    return { success: false, error: "Failed to delete staff" };
  }
}