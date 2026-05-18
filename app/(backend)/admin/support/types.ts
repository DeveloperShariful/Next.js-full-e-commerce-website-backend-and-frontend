// File: app/admin/support/types.ts

import { Prisma, TicketStatus, TicketPriority } from "@prisma/client";

// Prisma-এর জেনারেট করা টাইপ থেকে Ticket (with Relations & Counts) বের করা হলো
export type TicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: {
    user: {
      select: { name: true; email: true; image: true };
    };
    assignedTo: {
      select: { name: true; email: true };
    };
    _count: {
      select: { messages: true };
    };
  };
}>;

// ফ্রন্টএন্ড থেকে সার্চ ও পেজিনেশনের জন্য প্যারামিটার
export interface SupportQueryParams {
  search?: string;
  status?: "ALL" | TicketStatus;
  page?: number;
  limit?: number;
}

// উপরের স্ট্যাটাস লিংকের কাউন্ট রাখার জন্য
export type SupportCounts = {
  ALL: number;
} & Record<TicketStatus, number>;

// সার্ভার অ্যাকশনের রেসপন্স টাইপ
export interface GetTicketsResponse {
  success: boolean;
  data?: TicketWithRelations[];
  meta?: {
    total: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  counts?: SupportCounts;
  error?: string;
}