
// app/actions/admin/customer.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs"; 

// ==========================================
// 1. ZOD SCHEMAS
// ==========================================

const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
});

// ==========================================
// 2. GET CUSTOMERS (LIST WITH ANALYTICS)
// ==========================================

export async function getCustomers(
  page: number = 1, 
  limit: number = 20, 
  query?: string
) {
  try {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      role: 'CUSTOMER', // Only fetch customers
      AND: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ]
      } : {}
    };

    // Fetch Users with necessary fields for analytics
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
          isActive: true,
          addresses: {
            where: { isDefault: true },
            take: 1
          },
          // Fetching only minimal order data for calculation
          orders: {
            select: {
              total: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereCondition })
    ]);

    // Calculate Analytics in Memory (Total Spent, Last Order, AOV)
    const formattedUsers = users.map(user => {
      // 🔥 FIX: Convert Decimal to Number before adding
      const totalSpent = user.orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
      
      const orderCount = user.orders.length;
      const lastOrderDate = user.orders[0]?.createdAt || null;
      const aov = orderCount > 0 ? totalSpent / orderCount : 0;

      // Remove the heavy orders array before sending to client
      const { orders, ...userData } = user;

      return {
        ...userData,
        stats: {
          totalSpent,
          orderCount,
          lastOrderDate,
          aov
        }
      };
    });

    return { 
      success: true, 
      data: formattedUsers, 
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit) } 
    };

  } catch (error) {
    console.error("GET_CUSTOMERS_ERROR", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

// ==========================================
// 3. CREATE CUSTOMER (ADD NEW)
// ==========================================

export async function createCustomer(prevState: any, formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      address: formData.get("address"),
    };

    const validated = CreateCustomerSchema.safeParse(rawData);

    if (!validated.success) {
      return { success: false, errors: validated.error.flatten().fieldErrors };
    }

    const { name, email, phone, password, address } = validated.data;

    // Check if email exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, message: "Email already exists" };

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
        isActive: true,
      }
    });

    // Add Address if provided
    if (address) {
      await db.address.create({
        data: {
          userId: newUser.id,
          firstName: name.split(" ")[0],
          lastName: name.split(" ")[1] || "",
          address1: address,
          city: "Dhaka", // Default or add input
          country: "Bangladesh",
          phone: phone || "",
          postcode: "1000",
          isDefault: true
        }
      });
    }

    revalidatePath("/admin/customers");
    return { success: true, message: "Customer created successfully" };

  } catch (error) {
    console.error("CREATE_CUSTOMER_ERROR", error);
    return { success: false, message: "Internal Server Error" };
  }
}

// ==========================================
// 4. GET SINGLE CUSTOMER DETAILS (FOR DRAWER)
// ==========================================

export async function getCustomerDetails(id: string) {
  try {
    const customer = await db.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          take: 10, // Limit to last 10 orders for the preview
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            paymentStatus: true
          }
        }
      }
    });

    if (!customer) return { success: false, message: "Customer not found" };

    // 🔥 FIX: Serialize Decimal fields to Numbers for Client Components
    const serializedCustomer = {
      ...customer,
      orders: customer.orders.map(order => ({
        ...order,
        total: Number(order.total)
      }))
    };
    
    return { success: true, data: serializedCustomer };
  } catch (error) {
    console.error("GET_CUSTOMER_DETAILS_ERROR", error);
    return { success: false, message: "Error fetching details" };
  }
}

// ==========================================
// 5. UPDATE STATUS (BLOCK/UNBLOCK)
// ==========================================

export async function toggleCustomerStatus(userId: string, isActive: boolean) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive }
    });
    revalidatePath("/admin/customers");
    return { success: true, message: isActive ? "Customer Activated" : "Customer Blocked" };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// ==========================================
// 6. DELETE CUSTOMER (SINGLE)
// ==========================================

export async function deleteCustomer(userId: string) {
  try {
    await db.user.delete({ where: { id: userId } });
    revalidatePath("/admin/customers");
    return { success: true, message: "Customer deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete. Customer may have associated orders." };
  }
}

// ==========================================
// 7. BULK DELETE CUSTOMERS
// ==========================================

export async function bulkDeleteCustomers(ids: string[]) {
  try {
    await db.user.deleteMany({
      where: {
        id: { in: ids },
        role: 'CUSTOMER' // Safety check to prevent deleting admins
      }
    });
    revalidatePath("/admin/customers");
    return { success: true, message: `${ids.length} customers deleted successfully` };
  } catch (error) {
    console.error("BULK_DELETE_ERROR", error);
    return { success: false, message: "Failed to delete selected customers" };
  }
}