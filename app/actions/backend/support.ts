// app/actions/support.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// 👇 ১. Enum ইম্পোর্ট করা হয়েছে
import { TicketStatus } from "@prisma/client"; 

// --- 1. GET ALL TICKETS ---
export async function getTickets(status?: string) {
  try {
    // 👇 ২. লজিক আপডেট: 'ALL' চেক করা হচ্ছে এবং Enum কাস্ট করা হচ্ছে
    const whereCondition: any = {};
    
    if (status && status !== 'ALL') {
        whereCondition.status = status as TicketStatus;
    }

    const tickets = await db.supportTicket.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true, image: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: tickets };
  } catch (error) {
    console.error("GET_TICKETS_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 2. GET SINGLE TICKET (Chat History) ---
export async function getTicketDetails(id: string) {
  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' } // Oldest first for chat flow
        }
      }
    });
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: "Ticket not found" };
  }
}

// --- 3. REPLY TO TICKET ---
export async function replyToTicket(formData: FormData) {
  try {
    const ticketId = formData.get("ticketId") as string;
    const message = formData.get("message") as string;
    const senderId = "ADMIN"; // In real app, get from session

    if (!message) return { success: false, error: "Message cannot be empty" };

    // Create Message
    await db.ticketMessage.create({
      data: {
        ticketId,
        message,
        senderId
      }
    });

    // Update ticket status
    // 👇 ৩. Enum ব্যবহার করা হয়েছে (String 'open' এর বদলে)
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.OPEN } // Re-open ticket on new reply
    });

    revalidatePath(`/admin/support/${ticketId}`);
    return { success: true, message: "Reply sent" };
  } catch (error) {
    console.error("REPLY_ERROR", error);
    return { success: false, error: "Failed to send" };
  }
}

// --- 4. UPDATE STATUS ---
export async function updateTicketStatus(formData: FormData) {
  try {
    const ticketId = formData.get("ticketId") as string;
    // 👇 ৪. ফর্ম ডাটা থেকে Enum হিসেবে নেওয়া হচ্ছে
    const status = formData.get("status") as TicketStatus;

    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status }
    });

    revalidatePath("/admin/support");
    revalidatePath(`/admin/support/${ticketId}`);
    return { success: true, message: "Status updated" };
  } catch (error) {
    console.error("STATUS_UPDATE_ERROR", error);
    return { success: false, error: "Failed to update" };
  }
}