// File: app/actions/backend/support/support.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SupportQueryParams, GetTicketsResponse } from "@/app/(backend)/admin/support/types";
import { TicketStatus } from "@prisma/client";

// --- 1. GET TICKETS WITH PAGINATION, SEARCH, AND COUNTS ---
export async function getTickets(params: SupportQueryParams): Promise<GetTicketsResponse> {
  try {
    const { search = "", status = "ALL", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    // Search Logic (Ticket ID, Subject, Customer Name, or Email)
    if (search) {
      whereCondition.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status !== "ALL") {
      whereCondition.status = status as TicketStatus;
    }

    // Parallel Queries for Performance
    const [tickets, totalRecords, statusGroup] = await Promise.all([
      db.supportTicket.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, email: true, image: true } },
          assignedTo: { select: { name: true, email: true } },
          _count: { select: { messages: true } }, // Message Count
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.supportTicket.count({ where: whereCondition }),
      db.supportTicket.groupBy({
        by: ["status"],
        _count: { id: true },
      })
    ]);

    // Format Counts mapping
    const counts = { ALL: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    statusGroup.forEach((group) => {
      counts[group.status as TicketStatus] = group._count.id;
      counts.ALL += group._count.id;
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(tickets)), // Fix Next.js Decimal/Date warning
      meta: {
        total: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      counts,
    };
  } catch (error) {
    console.error("GET_TICKETS_ERROR", error);
    return { success: false, error: "Failed to fetch support tickets." };
  }
}

// --- 2. UPDATE SINGLE TICKET STATUS ---
export async function updateTicketStatus(id: string, status: TicketStatus) {
  try {
    await db.supportTicket.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/support");
    return { success: true, message: `Ticket marked as ${status}.` };
  } catch (error) {
    console.error("UPDATE_TICKET_ERROR", error);
    return { success: false, error: "Failed to update ticket status." };
  }
}

// --- 3. BULK ACTIONS (WooCommerce Style) ---
export async function bulkUpdateTickets(ids: string[], action: string) {
  try {
    if (ids.length === 0) return { success: false, error: "No tickets selected." };

    if (action === "delete") {
      // Delete tickets and their associated messages automatically (onDelete: Cascade in schema)
      await db.supportTicket.deleteMany({ where: { id: { in: ids } } });
      
    } else {
      // Bulk update status (e.g., mark all selected as RESOLVED or CLOSED)
      await db.supportTicket.updateMany({
        where: { id: { in: ids } },
        data: { status: action as TicketStatus },
      });
    }

    revalidatePath("/admin/support");
    return { success: true, message: "Bulk action applied successfully." };
  } catch (error) {
    console.error("BULK_TICKETS_ERROR", error);
    return { success: false, error: "Failed to perform bulk action." };
  }
}

// --- 4. DELETE SINGLE TICKET ---
export async function deleteTicket(id: string) {
  try {
    await db.supportTicket.delete({ where: { id } });
    revalidatePath("/admin/support");
    return { success: true, message: "Ticket deleted permanently." };
  } catch (error) {
    console.error("DELETE_TICKET_ERROR", error);
    return { success: false, error: "Failed to delete ticket." };
  }
}