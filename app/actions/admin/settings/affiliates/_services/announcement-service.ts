//File: app/actions/admin/settings/affiliates/_services/announcement-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const announcementService = {
  async getAllAnnouncements(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      db.affiliateAnnouncement.count(),
      db.affiliateAnnouncement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          targetGroups: { select: { id: true, name: true } },
          targetTiers: { select: { id: true, name: true } }
        }
      })
    ]);

    return { 
      announcements: data, 
      total, 
      totalPages: Math.ceil(total / limit) 
    };
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    type: string;
    isActive: boolean;
    startsAt?: Date;
    expiresAt?: Date;
    groupIds?: string[];
    tierIds?: string[];
  }) {
    return await db.affiliateAnnouncement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        isActive: data.isActive,
        startsAt: data.startsAt || new Date(),
        expiresAt: data.expiresAt,
        targetGroups: data.groupIds ? {
          connect: data.groupIds.map(id => ({ id }))
        } : undefined,
        targetTiers: data.tierIds ? {
          connect: data.tierIds.map(id => ({ id }))
        } : undefined,
      }
    });
  },

  async deleteAnnouncement(id: string) {
    return await db.affiliateAnnouncement.delete({
      where: { id }
    });
  },

  async toggleStatus(id: string, isActive: boolean) {
    return await db.affiliateAnnouncement.update({
      where: { id },
      data: { isActive }
    });
  }
};