// File: app/actions/admin/settings/affiliate/_services/kyc-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification";
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service"; // ✅ Security

// =========================================
// READ OPERATIONS
// =========================================
export async function getDocuments(page: number = 1, limit: number = 20, status?: string) {
  await protectAction("MANAGE_PARTNERS"); // Or MANAGE_FINANCE

  const skip = (page - 1) * limit;
  const where: Prisma.AffiliateDocumentWhereInput = status && status !== "ALL" ? { status } : {};

  const [total, data] = await Promise.all([
    db.affiliateDocument.count({ where }),
    db.affiliateDocument.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: {
          select: {
            id: true,
            slug: true,
            kycStatus: true,
            user: {
              select: { name: true, email: true, image: true }
            }
          }
        }
      }
    })
  ]);

  return {
    documents: data,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

// =========================================
// WRITE OPERATIONS
// =========================================

export async function verifyDocumentAction(documentId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    const result = await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { affiliate: { include: { user: true } } } 
      });

      if (!doc) throw new Error("Document not found");

      // 1. Update Document Status
      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          rejectionReason: null
        }
      });

      // 2. Check if ALL documents are verified to update Account Status
      const pendingDocs = await tx.affiliateDocument.count({
        where: {
          affiliateId: doc.affiliateId,
          status: { not: "VERIFIED" }
        }
      });

      if (pendingDocs === 0) {
        await tx.affiliateAccount.update({
          where: { id: doc.affiliateId },
          data: { kycStatus: "VERIFIED" }
        });
      }

      await auditService.log({
        userId: actor.id,
        action: "VERIFY_KYC",
        entity: "AffiliateDocument",
        entityId: documentId,
        meta: { affiliateId: doc.affiliateId }
      });

      return doc;
    });

    await sendNotification({
        trigger: "KYC_VERIFIED",
        recipient: result.affiliate.user.email,
        data: { 
            affiliate_name: result.affiliate.user.name || "Partner",
            document_type: result.type.replace("_", " ") 
        },
        userId: result.affiliate.userId
    });

    revalidatePath("/admin/settings/affiliate/kyc");
    return { success: true, message: "Document verified successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Verification failed." };
  }
}

export async function rejectDocumentAction(documentId: string, reason: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");
    
    if (!reason) return { success: false, message: "Rejection reason is required." };

    const result = await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { affiliate: { include: { user: true } } } 
      });

      if (!doc) throw new Error("Document not found");

      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          verifiedAt: null
        }
      });

      // Downgrade Account Status
      await tx.affiliateAccount.update({
        where: { id: doc.affiliateId },
        data: { kycStatus: "REJECTED" }
      });

      await auditService.log({
        userId: actor.id,
        action: "REJECT_KYC",
        entity: "AffiliateDocument",
        entityId: documentId,
        meta: { reason, affiliateId: doc.affiliateId }
      });

      return doc;
    });

    await sendNotification({
        trigger: "KYC_REJECTED",
        recipient: result.affiliate.user.email,
        data: { 
            affiliate_name: result.affiliate.user.name || "Partner",
            document_type: result.type.replace("_", " "),
            rejection_reason: reason
        },
        userId: result.affiliate.userId
    });

    revalidatePath("/admin/settings/affiliate/kyc");
    return { success: true, message: "Document rejected." };
  } catch (error: any) {
    return { success: false, message: error.message || "Rejection failed." };
  }
}