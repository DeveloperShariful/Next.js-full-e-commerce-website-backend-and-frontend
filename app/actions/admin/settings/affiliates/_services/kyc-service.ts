// File: app/actions/admin/settings/affiliates/_services/kyc-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification"; // ✅ Import Notification System

export const kycService = {
  async getDocuments(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.AffiliateDocumentWhereInput = status ? { status } : {};

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
  },

  async verifyDocument(documentId: string, adminId: string) {
    // 1. Transaction to update DB
    const result = await db.$transaction(async (tx) => {
      // Need user email for notification
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { 
            affiliate: { 
                include: { user: true } 
            } 
        }
      });

      if (!doc) throw new Error("Document not found");

      // Update Document Status
      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          rejectionReason: null
        }
      });

      // Check if any other docs are pending
      const pendingDocs = await tx.affiliateDocument.count({
        where: {
          affiliateId: doc.affiliateId,
          status: { not: "VERIFIED" }
        }
      });

      // If all docs verified, update Main Account Status
      if (pendingDocs === 0) {
        await tx.affiliateAccount.update({
          where: { id: doc.affiliateId },
          data: { kycStatus: "VERIFIED" }
        });
      }

      return doc; // Return doc to use outside transaction
    });

    // 2. Send Email Notification (Outside Transaction to keep DB fast)
    await sendNotification({
        trigger: "KYC_VERIFIED",
        recipient: result.affiliate.user.email,
        data: { 
            affiliate_name: result.affiliate.user.name || "Partner",
            document_type: result.type.replace("_", " ") 
        },
        userId: result.affiliate.userId
    });

    return { success: true };
  },

  async rejectDocument(documentId: string, reason: string) {
    // 1. Transaction
    const result = await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { 
            affiliate: { 
                include: { user: true } 
            } 
        }
      });

      if (!doc) throw new Error("Document not found");

      // Update Document
      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          verifiedAt: null
        }
      });

      // Update Account Status immediately to Rejected/Pending
      await tx.affiliateAccount.update({
        where: { id: doc.affiliateId },
        data: { kycStatus: "REJECTED" }
      });

      return doc;
    });

    // 2. Send Email Notification
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

    return { success: true };
  },

  async getPendingCount() {
    return await db.affiliateDocument.count({
      where: { status: "PENDING" }
    });
  }
};