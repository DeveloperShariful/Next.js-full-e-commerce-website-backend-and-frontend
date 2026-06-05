// File: app/actions/frontend/my-account/ticket-service.ts

"use server";

import { db } from "@/lib/prisma";
import { syncUser } from "@/lib/auth-sync";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
});

const replySchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1, "Message content cannot be empty."),
});

type TicketInput = z.infer<typeof ticketSchema>;
type ReplyInput = z.infer<typeof replySchema>;

async function getAuthCustomer() {
  const user = await syncUser();
  if (!user) throw new Error("Unauthorized: Customer session not found.");
  return user;
}

// ==========================================
// WRITE OPERATIONS (MUTATIONS)
// ==========================================

export async function createSupportTicketAction(data: TicketInput) {
  try {
    const customer = await getAuthCustomer();

    const result = ticketSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const { subject, message, priority } = result.data;

    await db.$transaction(async (tx) => {
      // 1. Create Ticket
      const ticket = await tx.supportTicket.create({
        data: {
          userId: customer.id,
          subject: subject.trim(),
          priority: priority,
          status: TicketStatus.OPEN
        }
      });

      // 2. Create Initial Message
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: customer.id,
          message: message.trim()
        }
      });
    });

    revalidatePath("/my-account");
    return { success: true, message: "Support ticket opened successfully. We will reply soon." };

  } catch (error: any) {
    console.error("Ticket Create Error:", error);
    return { success: false, message: error.message || "Failed to open support ticket." };
  }
}

export async function sendTicketReplyAction(data: ReplyInput) {
  try {
    const customer = await getAuthCustomer();

    const result = replySchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    const { ticketId, message } = result.data;

    // Verify ownership of ticket
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket || ticket.userId !== customer.id) {
      return { success: false, message: "Unauthorized: Ticket not found." };
    }

    await db.$transaction(async (tx) => {
      // 1. Add Message
      await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: customer.id,
          message: message.trim()
        }
      });

      // 2. Update Ticket Status back to OPEN when customer replies
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN }
      });
    });

    revalidatePath("/my-account");
    return { success: true, message: "Reply sent." };

  } catch (error: any) {
    console.error("Ticket Reply Error:", error);
    return { success: false, message: "Failed to send reply." };
  }
}