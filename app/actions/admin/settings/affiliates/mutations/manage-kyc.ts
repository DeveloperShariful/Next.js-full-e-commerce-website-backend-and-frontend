//File: app/actions/admin/settings/affiliates/mutations/manage-kyc.ts
"use server";

import { revalidatePath } from "next/cache";
import { kycService } from "../_services/kyc-service";
import { ActionResponse } from "../types";
// আপনার এক্সিস্টিং রিয়েল অথেন্টিকেশন ইম্পোর্ট করা হলো
import { syncUser } from "@/lib/auth-sync"; 

export async function verifyDocumentAction(documentId: string): Promise<ActionResponse> {
  try {
    // 1. Auth Check (Real Database User via Clerk)
    const user = await syncUser();

    // চেক করা হচ্ছে ইউজার অ্যাডমিন কিনা (আপনার Schema-তে Role Enum আছে)
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized access." };
    }

    // 2. Service Call
    await kycService.verifyDocument(documentId, user.id);

    // 3. Revalidate
    revalidatePath("/admin/settings/affiliate/kyc");
    return { success: true, message: "Document verified successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Verification failed." };
  }
}

export async function rejectDocumentAction(documentId: string, reason: string): Promise<ActionResponse> {
  try {
    // 1. Auth Check
    const user = await syncUser();
    
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized access." };
    }

    if (!reason) return { success: false, message: "Rejection reason is required." };

    await kycService.rejectDocument(documentId, reason);

    revalidatePath("/admin/settings/affiliate/kyc");
    return { success: true, message: "Document rejected." };
  } catch (error: any) {
    return { success: false, message: error.message || "Rejection failed." };
  }
}