//app/actions/admin/settings/affiliates/mutations/manage-contests.ts

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { contestService } from "../_services/contest-service";
import { ActionResponse } from "../types";

// Schema for Contest Creation
const contestSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title is required."),
  description: z.string().optional(),
  
  startDate: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
    message: "Valid start date is required.",
  }),
  endDate: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
    message: "Valid end date is required.",
  }),
  
  criteria: z.enum(["sales_amount", "referral_count"]).default("sales_amount"),
  isActive: z.boolean().default(true),
  
  // Prizes mapped to JSON
  prizes: z.object({
    firstPlace: z.string().min(1, "1st Place prize is required"),
    secondPlace: z.string().optional(),
    thirdPlace: z.string().optional(),
  }),
});

type ContestInput = z.infer<typeof contestSchema>;

/**
 * SERVER ACTION: Upsert Contest
 */
export async function upsertContest(data: ContestInput): Promise<ActionResponse> {
  try {
    const result = contestSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation Failed",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;

    // Validate Dates
    if (new Date(payload.startDate) >= new Date(payload.endDate)) {
      return { success: false, message: "End date must be after start date." };
    }

    const dbPayload = {
      title: payload.title,
      description: payload.description,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      criteria: payload.criteria,
      isActive: payload.isActive,
      prizes: payload.prizes, // Stores as JSON
    };

    if (payload.id) {
      await db.affiliateContest.update({
        where: { id: payload.id },
        data: dbPayload,
      });
    } else {
      await contestService.createContest(dbPayload);
    }

    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest saved successfully." };

  } catch (error: any) {
    console.error("Contest Mutation Error:", error);
    return { success: false, message: "Failed to save contest." };
  }
}

/**
 * SERVER ACTION: Delete Contest
 */
export async function deleteContestAction(id: string): Promise<ActionResponse> {
  try {
    await contestService.deleteContest(id);
    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete contest." };
  }
}

// Helper to access DB directly in action file if service doesn't expose update
import { db } from "@/lib/prisma";