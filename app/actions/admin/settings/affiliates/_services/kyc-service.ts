//File: app/actions/admin/settings/affiliates/_services/kyc-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    return await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId },
        include: { affiliate: true }
      });

      if (!doc) throw new Error("Document not found");

      await tx.affiliateDocument.update({
        where: { id: documentId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          rejectionReason: null
        }
      });

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

      return { success: true };
    });
  },

  async rejectDocument(documentId: string, reason: string) {
    return await db.$transaction(async (tx) => {
      const doc = await tx.affiliateDocument.findUnique({
        where: { id: documentId }
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

      await tx.affiliateAccount.update({
        where: { id: doc.affiliateId },
        data: { kycStatus: "REJECTED" }
      });

      return { success: true };
    });
  },

  async getPendingCount() {
    return await db.affiliateDocument.count({
      where: { status: "PENDING" }
    });
  }
};