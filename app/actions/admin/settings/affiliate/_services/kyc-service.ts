// File: app/actions/admin/settings/affiliate/_services/kyc-service.ts

"use server";

import { db } from "@/lib/prisma";
// ✅ ১. সঠিক Enum টি ইমপোর্ট করুন
import { Prisma, AffiliateDocumentStatus } from "@prisma/client"; 
import { auditService } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";
import { protectAction } from "../permission-service";

// =========================================
// READ OPERATIONS
// =========================================
export async function getDocuments(page: number = 1, limit: number = 20, status?: string) {
  await protectAction("MANAGE_PARTNERS"); 

  const skip = (page - 1) * limit;

  // ✅ ২. Type Guard: চেক করুন status স্ট্রিংটি আসলে Valid Enum কি না
  let whereStatus: AffiliateDocumentStatus | undefined;

  // যদি status থাকে, "ALL" না হয় এবং সেটি Enum লিস্টের মধ্যে থাকে
  if (status && status !== "ALL") {
    const isValid = Object.values(AffiliateDocumentStatus).includes(status as AffiliateDocumentStatus);
    if (isValid) {
      whereStatus = status as AffiliateDocumentStatus;
    }
  }

  // ✅ ৩. এখন আর 'as any' দরকার নেই, কারণ whereStatus এখন সঠিক টাইপের
  const where: Prisma.AffiliateDocumentWhereInput = whereStatus ? { status: whereStatus } : {};

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
// WRITE OPERATIONS (Transactional)
// =========================================

export async function verifyDocumentAction(documentId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { affiliate: { include: { user: true } } } 
      });

      if (!doc) throw new Error("Document not found");
      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: AffiliateDocumentStatus.APPROVED, 
          verifiedAt: new Date(),
          rejectionReason: null
        }
      });
      const pendingDocs = await tx.affiliateDocument.count({
        where: {
          affiliateId: doc.affiliateId,
          status: { not: AffiliateDocumentStatus.APPROVED } 
        }
      });

      if (pendingDocs === 0) {
        await tx.affiliateAccount.update({
          where: { id: doc.affiliateId },
          data: { kycStatus: "VERIFIED" } 
        });
      }
      await tx.notificationQueue.create({
          data: {
              channel: "EMAIL",
              recipient: doc.affiliate.user.email,
              templateSlug: "KYC_VERIFIED",
              status: "PENDING",
              userId: doc.affiliate.userId,
              content: "", 
              metadata: { 
                  affiliate_name: doc.affiliate.user.name || "Partner",
                  document_type: doc.type.replace("_", " ") 
              }
          }
      });

      await auditService.log({
        userId: actor.id,
        action: "VERIFY_KYC",
        entity: "AffiliateDocument",
        entityId: documentId,
        meta: { affiliateId: doc.affiliateId }
      });
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

    await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { affiliate: { include: { user: true } } } 
      });

      if (!doc) throw new Error("Document not found");

      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: AffiliateDocumentStatus.REJECTED, 
          rejectionReason: reason,
          verifiedAt: null
        }
      });

      await tx.affiliateAccount.update({
        where: { id: doc.affiliateId },
        data: { kycStatus: "REJECTED" }
      });

      await tx.notificationQueue.create({
          data: {
              channel: "EMAIL",
              recipient: doc.affiliate.user.email,
              templateSlug: "KYC_REJECTED",
              status: "PENDING",
              userId: doc.affiliate.userId,
              content: "",
              metadata: { 
                  affiliate_name: doc.affiliate.user.name || "Partner",
                  document_type: doc.type.replace("_", " "),
                  rejection_reason: reason
              }
          }
      });

      await auditService.log({
        userId: actor.id,
        action: "REJECT_KYC",
        entity: "AffiliateDocument",
        entityId: documentId,
        meta: { reason, affiliateId: doc.affiliateId }
      });
    });

    revalidatePath("/admin/settings/affiliate/kyc");
    return { success: true, message: "Document rejected." };
  } catch (error: any) {
    return { success: false, message: error.message || "Rejection failed." };
  }
}