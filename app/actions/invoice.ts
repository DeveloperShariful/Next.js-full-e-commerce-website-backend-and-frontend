// app/actions/invoice.ts

"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// --- TYPES ---
export interface InvoiceData {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  total: number;
  user: { name: string | null; email: string } | null;
  guestEmail: string | null;
  items: any[];
  billingAddress: any;
  shippingAddress: any;
}

// --- 1. GET ALL INVOICES ---
export async function getInvoices(query?: string) {
  try {
    const whereCondition: any = query ? {
      OR: [
        { orderNumber: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { email: { contains: query, mode: 'insensitive' } } }
      ]
    } : {};

    const orders = await db.order.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // সাম্প্রতিক ৫০টি ইনভয়েস
    });

    return { success: true, data: orders };

  } catch (error) {
    console.error("GET_INVOICES_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 2. GET SINGLE INVOICE ---
export async function getInvoiceById(id: string) {
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: true,
      }
    });

    if (!order) return { success: false, error: "Invoice not found" };
    return { success: true, data: order };

  } catch (error) {
    return { success: false, error: "Error fetching invoice" };
  }
}