// app/actions/customer.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

// --- 1. GET CUSTOMERS (With Analytics) ---
export async function getCustomers(
  page: number = 1, 
  limit: number = 20, 
  query?: string
) {
  try {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      role: 'CUSTOMER', // Only fetch customers, not admins
      AND: [
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    // Fetch Users with Order Summary
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

    // Process Analytics (Total Spent, Last Order)
    const formattedUsers = users.map(user => {
      const totalSpent = user.orders.reduce((acc, order) => acc + (order.total || 0), 0);
      const orderCount = user.orders.length;
      const lastOrderDate = user.orders[0]?.createdAt || null;
      const aov = orderCount > 0 ? totalSpent / orderCount : 0; // Average Order Value

      // Remove heavy orders array before sending to client
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

  } catch (error: any) {
    console.error("GET_CUSTOMERS_ERROR", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

// --- 2. DELETE CUSTOMER ---
export async function deleteCustomer(userId: string) {
  try {
    // Optional: Check if user has orders. Usually we don't delete users with orders for history.
    // Instead we might soft delete or ban them. For now, we perform standard delete.
    
    await db.user.delete({ where: { id: userId } });
    revalidatePath("/admin/customers");
    return { success: true, message: "Customer deleted successfully" };
  } catch (error) {
    return { success: false, error: "Failed to delete. Customer might have active orders." };
  }
}

// --- 3. BLOCK/UNBLOCK CUSTOMER ---
export async function toggleCustomerStatus(userId: string, isActive: boolean) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive }
    });
    revalidatePath("/admin/customers");
    return { success: true, message: isActive ? "Customer Unblocked" : "Customer Blocked" };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}