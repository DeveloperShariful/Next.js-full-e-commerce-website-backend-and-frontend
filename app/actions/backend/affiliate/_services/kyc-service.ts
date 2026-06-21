// File: app/actions/backend/affiliate/_services/kyc-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auditService } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { ActionResponse, AffiliateKycDocument } from "../types";
import { protectAction } from "../permission-service";

interface KycDocumentListItem extends AffiliateKycDocument {
  id: string;
  accountId: string;
  docIndex: number;
  affiliate: {
    id: string;
    slug: string;
    kycStatus: string;
    user: { name: string | null; email: string; image: string | null };
  };
}

// =========================================
// READ OPERATIONS (Dynamic JSON Aggregation)
// =========================================
export async function getDocuments(page: number = 1, limit: number = 20, status?: string) {
  await protectAction("MANAGE_PARTNERS"); 

  // Since documents are stored in JSON inside AffiliateAccount, 
  // we fetch accounts that have KYC documents.
  const accounts = await db.affiliateAccount.findMany({
    where: {
      kycDocuments: { not: Prisma.DbNull }, // Fetch only users who submitted docs
    },
    select: {
      id: true,
      slug: true,
      kycStatus: true,
      kycDocuments: true,
      user: { select: { name: true, email: true, image: true } }
    }
  });

  // Flatten the documents array into a standard list for the table
  let allDocs: KycDocumentListItem[] = [];

  accounts.forEach(acc => {
    const docs = (acc.kycDocuments as unknown as AffiliateKycDocument[]) || [];
    docs.forEach((doc, index) => {
      if (!status || status === "ALL" || doc.status === status) {
        allDocs.push({
          ...doc,
          id: `${acc.id}-${index}`, // Generate temporary ID for UI rendering
          accountId: acc.id,
          docIndex: index,
          affiliate: {
            id: acc.id,
            slug: acc.slug,
            kycStatus: acc.kycStatus,
            user: acc.user
          }
        });
      }
    });
  });

  // In-memory pagination (Perfect for JSON since max pending docs won't exceed a few hundred)
  const total = allDocs.length;
  const paginatedDocs = allDocs.slice((page - 1) * limit, page * limit);

  return {
    documents: paginatedDocs,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

// =========================================
// WRITE OPERATIONS (Transactional JSON Update)
// =========================================

// ⚠️ UI UPDATE NOTE: For verify/reject, the UI button MUST pass both 'accountId' and 'docIndex' now.
export async function verifyDocumentAction(accountId: string, docIndex: number): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");

    await db.$transaction(async (tx) => {
      const affiliate = await tx.affiliateAccount.findUnique({
        where: { id: accountId },
        include: { user: true }
      });

      if (!affiliate || !affiliate.kycDocuments) throw new Error("Document not found");

      const docs = affiliate.kycDocuments as unknown as AffiliateKycDocument[];
      if (!docs[docIndex]) throw new Error("Document index out of bounds");

      // Update the specific document status
      docs[docIndex].status = "APPROVED";
      docs[docIndex].verifiedAt = new Date().toISOString();
      docs[docIndex].rejectionReason = undefined;

      const pendingDocs = docs.filter(d => d.status !== "APPROVED").length;

      await tx.affiliateAccount.update({
        where: { id: accountId },
        data: {
          kycDocuments: docs as unknown as Prisma.InputJsonValue,
          kycStatus: pendingDocs === 0 ? "VERIFIED" : affiliate.kycStatus
        }
      });

      await tx.notificationQueue.create({
          data: {
              channel: "EMAIL",
              recipient: affiliate.user.email,
              templateSlug: "KYC_VERIFIED",
              status: "PENDING",
              userId: affiliate.userId,
              content: "", 
              metadata: { 
                  affiliate_name: affiliate.user.name || "Partner",
                  document_type: docs[docIndex].type.replace("_", " ") 
              }
          }
      });

      await auditService.log({
        userId: actor.id,
        action: "VERIFY_KYC",
        entity: "AffiliateAccount",
        entityId: accountId,
        meta: { docIndex }
      });
    });

    revalidatePath("/admin/affiliate/kyc");
    return { success: true, message: "Document verified successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Verification failed." };
  }
}

export async function rejectDocumentAction(accountId: string, docIndex: number, reason: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS");
    
    if (!reason) return { success: false, message: "Rejection reason is required." };

    await db.$transaction(async (tx) => {
      const affiliate = await tx.affiliateAccount.findUnique({
        where: { id: accountId },
        include: { user: true }
      });

      if (!affiliate || !affiliate.kycDocuments) throw new Error("Document not found");

      const docs = affiliate.kycDocuments as unknown as AffiliateKycDocument[];
      if (!docs[docIndex]) throw new Error("Document index out of bounds");

      // Update the specific document status
      docs[docIndex].status = "REJECTED";
      docs[docIndex].rejectionReason = reason;

      await tx.affiliateAccount.update({
        where: { id: accountId },
        data: {
          kycDocuments: docs as unknown as Prisma.InputJsonValue,
          kycStatus: "REJECTED"
        }
      });

      await tx.notificationQueue.create({
          data: {
              channel: "EMAIL",
              recipient: affiliate.user.email,
              templateSlug: "KYC_REJECTED",
              status: "PENDING",
              userId: affiliate.userId,
              content: "",
              metadata: { 
                  affiliate_name: affiliate.user.name || "Partner",
                  document_type: docs[docIndex].type.replace("_", " "),
                  rejection_reason: reason
              }
          }
      });

      await auditService.log({
        userId: actor.id,
        action: "REJECT_KYC",
        entity: "AffiliateAccount",
        entityId: accountId,
        meta: { reason, docIndex }
      });
    });

    revalidatePath("/admin/affiliate/kyc");
    return { success: true, message: "Document rejected." };
  } catch (error: any) {
    return { success: false, message: error.message || "Rejection failed." };
  }
}