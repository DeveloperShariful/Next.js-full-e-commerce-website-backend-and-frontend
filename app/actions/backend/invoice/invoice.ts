// File: app/actions/backend/invoice/invoice.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { InvoiceQueryParams, GetInvoicesResponse } from "@/app/(backend)/admin/invoices/types";

export async function getInvoices(params: InvoiceQueryParams): Promise<GetInvoicesResponse> {
  try {
    const { 
      search = "", 
      status = "ALL", 
      page = 1, 
      limit = 20,
      startDate,
      endDate
    } = params;

    const skip = (page - 1) * limit;

    // ১. ডায়নামিক Where কন্ডিশন বিল্ড করা
    const whereCondition: any = {
      deletedAt: null, // ডিলিট হওয়া ডেটা বাদ দেওয়া
    };

    if (search) {
      whereCondition.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { guestEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== "ALL") {
      whereCondition.status = status as OrderStatus;
    }

    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // ২. প্যারালাল কুয়েরি (পারফরম্যান্স বুস্টের জন্য একবারে ডেটা ও কাউন্ট আনা)
    const [orders, totalRecords, statusGroup] = await Promise.all([
      // মেইন ডেটা ফেচ
      db.order.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      // টোটাল রেকর্ড কাউন্ট (পেজিনেশনের জন্য)
      db.order.count({ where: whereCondition }),
      // স্ট্যাটাস অনুযায়ী কাউন্ট (WooCommerce Status Links এর জন্য)
      db.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null } // ওভারঅল কাউন্ট দেখার জন্য
      })
    ]);

    // ৩. স্ট্যাটাস কাউন্ট ফরম্যাটিং
    const counts: any = { ALL: 0 };
    statusGroup.forEach((group) => {
      counts[group.status] = group._count.id;
      counts.ALL += group._count.id;
    });

    // Decimal এবং Date অবজেক্ট ফিক্স করার জন্য Parse/Stringify
    const serializedOrders = JSON.parse(JSON.stringify(orders));

    return { 
      success: true, 
      data: serializedOrders,
      meta: {
        total: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      counts
    };

  } catch (error) {
    console.error("GET_INVOICES_ERROR", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}

// Bulk Actions (WooCommerce-এর মতো একসাথে অনেকগুলোর স্ট্যাটাস চেঞ্জ করা বা ডিলিট করা)
export async function bulkUpdateInvoices(ids: string[], action: string) {
  try {
    if (action === "trash") {
      await db.order.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      });
    } else {
      // action এর ভ্যালু যদি স্ট্যাটাস হয় (যেমন- PROCESSING, CANCELLED)
      await db.order.updateMany({
        where: { id: { in: ids } },
        data: { status: action as OrderStatus }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("BULK_UPDATE_ERROR", error);
    return { success: false, error: "Failed to perform bulk action" };
  }
}