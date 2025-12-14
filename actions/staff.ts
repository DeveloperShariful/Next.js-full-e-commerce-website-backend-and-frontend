// actions/staff.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// 1. GET ALL STAFF
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

// 2. CREATE STAFF
export async function createStaff(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    if (!name || !email || !password || !role) {
      return { success: false, error: "All fields required" };
    }

    // Check existing
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "Email already in use!" };

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        image: null,
      }
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff created successfully" };

  } catch (error) {
    return { success: false, error: "Failed to create staff" };
  }
}

// 3. DELETE STAFF
export async function deleteStaff(id: string) {
  try {
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff removed" };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}