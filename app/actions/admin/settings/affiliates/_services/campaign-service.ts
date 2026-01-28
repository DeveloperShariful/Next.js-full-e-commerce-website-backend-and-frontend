// File: app/actions/admin/settings/affiliate/_services/campaign-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";

// =========================================
// READ OPERATIONS
// =========================================
export async function getAllCampaigns(page: number = 1, limit: number = 20, search?: string) {
  const skip = (page - 1) * limit;

  const where: Prisma.AffiliateCampaignWhereInput = search ? {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } }
    ]
  } : {};

  const [total, data] = await Promise.all([
    db.affiliateCampaign.count({ where }),
    db.affiliateCampaign.findMany({
      where,
      take: limit,
      skip,
      orderBy: { revenue: "desc" }, 
      include: {
        affiliate: {
          select: {
            slug: true,
            user: { select: { name: true, image: true, email: true } }
          }
        },
        _count: {
          select: { links: true } 
        }
      }
    })
  ]);

  const formattedData = data.map(c => ({
      ...c,
      revenue: DecimalMath.toNumber(c.revenue)
  }));

  return { 
    campaigns: formattedData, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function deleteCampaignAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    if (!id) return { success: false, message: "Campaign ID is required." };

    const deleted = await db.affiliateCampaign.delete({
      where: { id }
    });

    await auditService.log({
      userId: auth.id,
      action: "DELETE",
      entity: "AffiliateCampaign",
      entityId: id,
      oldData: { name: deleted.name, affiliateId: deleted.affiliateId }
    });

    revalidatePath("/admin/settings/affiliate/campaigns");
    return { success: true, message: "Campaign deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete campaign." };
  }
}