"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// --- SCHEMAS ---
const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role),
});

// Update Schema (Password is optional here)
const UpdateStaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(), // Optional for edit
  role: z.nativeEnum(Role),
});

export type ActionState = {
  success: boolean;
  message?: string;
  error?: string;
};

// 1. GET ALL STAFF (No Change)
export async function getStaffs() {
  try {
    const staffs = await db.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.MANAGER, Role.EDITOR, Role.SUPPORT, Role.SUPER_ADMIN] }
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, image: true, createdAt: true }
    });
    return { success: true, data: staffs };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 2. CREATE STAFF (No Change)
export async function createStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = CreateStaffSchema.safeParse(rawData);
    
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, password, role } = validated.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "Email already in use!" };

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: { name, email, password: hashedPassword, role, emailVerified: new Date() }
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff account created successfully" };
  } catch (error) {
    return { success: false, error: "Internal server error" };
  }
}

// 3. UPDATE STAFF (NEW FUNCTION)
export async function updateStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    // If password is empty string, remove it from validation data so Zod doesn't complain if min length check exists
    if (rawData.password === "") delete rawData.password;

    const validated = UpdateStaffSchema.safeParse(rawData);
    
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, name, email, role, password } = validated.data;

    // Check if email belongs to another user
    const existingUser = await db.user.findFirst({
      where: { 
        email,
        NOT: { id } // Exclude self
      } 
    });
    if (existingUser) return { success: false, error: "Email already taken by another user" };

    // Prepare update data
    const updateData: any = { name, email, role };
    
    // Only update password if provided
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff profile updated" };

  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// 4. DELETE STAFF (No Change)
export async function deleteStaff(id: string): Promise<ActionState> {
  try {
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff member removed" };
  } catch (error) {
    return { success: false, error: "Failed to delete staff" };
  }
}