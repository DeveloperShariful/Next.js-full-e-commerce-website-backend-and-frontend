// app/actions/admin/staff-role/staff.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";
// ✅ Use global syncUser instead of manual implementation
import { syncUser } from "@/lib/auth-sync";

// --- ZOD SCHEMA ---
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
    // ✅ Security: Use centralized auth
    const currentUser = await syncUser();
    
    // Only internal staff can view this list
    if (!currentUser || currentUser.role === 'CUSTOMER') {
        return { success: false, data: [] };
    }

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
    console.error("GET_STAFFS_ERROR", error);
    return { success: false, data: [] };
  }
}

// 2. CREATE STAFF
export async function createStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const currentUser = await syncUser();
    if (!currentUser) return { success: false, error: "Unauthorized" };

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

    // [LOGIC] Only SUPER_ADMIN can create another SUPER_ADMIN
    if (role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
        return { success: false, error: "Only Super Admins can create other Super Admins." };
    }

    // [LOGIC] Only ADMIN or SUPER_ADMIN can create staff
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN) {
        return { success: false, error: "You do not have permission to add staff." };
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "User already exists with this email!" };

    // ✅ Note: Created without clerkId. Will be linked when they sign up via email.
    await db.user.create({
      data: {
        name,
        email,
        role,
        image: null, 
      }
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff added! Ask them to Sign Up." };

  } catch (error) {
    console.error("CREATE_STAFF_ERROR", error);
    return { success: false, error: "Internal server error" };
  }
}

// 3. UPDATE STAFF
export async function updateStaff(prevState: any, formData: FormData): Promise<ActionState> {
  try {
    const currentUser = await syncUser();
    if (!currentUser) return { success: false, error: "Unauthorized" };

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
    if (!id) return { success: false, error: "ID required" };

    // Fetch target user
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) return { success: false, error: "Staff not found" };

    // [LOGIC] Protect SUPER_ADMIN
    if (targetUser.role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
         return { success: false, error: "You cannot edit a Super Admin." };
    }

    // [LOGIC] Promote check
    if (role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
        return { success: false, error: "Only Super Admins can assign the Super Admin role." };
    }

    // Check duplicate email (excluding self)
    const existingEmail = await db.user.findFirst({
        where: { email, NOT: { id } }
    });
    if (existingEmail) return { success: false, error: "Email taken by another user" };

    await db.user.update({
        where: { id },
        data: { name, email, role }
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff profile updated" };

  } catch (error) {
    console.error("UPDATE_STAFF_ERROR", error);
    return { success: false, error: "Update failed" };
  }
}

// 4. DELETE STAFF
export async function deleteStaff(id: string): Promise<ActionState> {
  try {
    const currentUser = await syncUser();
    if (!currentUser) return { success: false, error: "Unauthorized" };

    // Prevent self-delete
    if (currentUser.id === id) {
        return { success: false, error: "You cannot delete yourself." };
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) return { success: false, error: "User not found" };

    // [LOGIC] Super Admin Protection
    if (targetUser.role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
        return { success: false, error: "Only Super Admins can delete other Super Admins." };
    }
    
    // [LOGIC] Permission check
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN) {
         return { success: false, error: "Permission denied." };
    }

    await db.user.delete({ where: { id } });
    revalidatePath("/admin/staff");
    return { success: true, message: "Staff removed" };
  } catch (error) {
    console.error("DELETE_STAFF_ERROR", error);
    return { success: false, error: "Failed to delete staff" };
  }
}