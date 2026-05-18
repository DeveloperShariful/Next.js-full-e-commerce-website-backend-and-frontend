// File: app/actions/backend/shipment/shipment.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ShipmentQueryParams, GetShipmentsResponse } from "@/app/(backend)/admin/shipments/types";
import { OrderStatus } from "@prisma/client";

// --- 1. GET SHIPMENTS WITH PAGINATION, SEARCH & COUNTS ---
export async function getShipments(params: ShipmentQueryParams): Promise<GetShipmentsResponse> {
  try {
    const { search = "", status = "ALL", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // ডায়নামিক Where কন্ডিশন তৈরি
    const whereCondition: any = {};

    // Search Logic
    if (search) {
      whereCondition.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { courier: { contains: search, mode: "insensitive" } },
        { connote: { contains: search, mode: "insensitive" } }, // Transdirect Connote
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Status Filter Logic (Based on deliveredDate & syncedToGateway)
    if (status === "DELIVERED") {
      whereCondition.deliveredDate = { not: null };
    } else if (status === "IN_TRANSIT") {
      whereCondition.deliveredDate = null;
    } else if (status === "SYNC_FAILED") {
      whereCondition.syncedToGateway = false;
    }

    // ডেটা এবং কাউন্ট একই সাথে ফেচ করা (প্যারালাল কুয়েরি)
    const [shipments, totalRecords, allShipments] = await Promise.all([
      db.shipment.findMany({
        where: whereCondition,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              shippingAddress: true,
              guestEmail: true,
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { shippedDate: "desc" },
        skip,
        take: limit,
      }),
      db.shipment.count({ where: whereCondition }),
      
      // কাউন্ট বের করার জন্য শুধু id এবং স্ট্যাটাসের ফিল্ডগুলো আনা হচ্ছে (হালকা কুয়েরি)
      db.shipment.findMany({
        select: { deliveredDate: true, syncedToGateway: true }
      })
    ]);

    // স্ট্যাটাস অনুযায়ী কাউন্ট ক্যালকুলেশন
    const counts = {
      ALL: allShipments.length,
      IN_TRANSIT: allShipments.filter(s => s.deliveredDate === null).length,
      DELIVERED: allShipments.filter(s => s.deliveredDate !== null).length,
      SYNC_FAILED: allShipments.filter(s => s.syncedToGateway === false).length,
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(shipments)), // Fix Next.js Date/Decimal warning
      meta: {
        total: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      counts,
    };
  } catch (error) {
    console.error("GET_SHIPMENTS_ERROR", error);
    return { success: false, error: "Failed to fetch shipments." };
  }
}

// --- 2. UPDATE SINGLE TRACKING INFO (From Edit Modal) ---
export async function updateTracking(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingUrl = formData.get("trackingUrl") as string;
    const numberOfParcels = Number(formData.get("numberOfParcels")) || 1;

    if (!id) return { success: false, error: "Shipment ID is required." };

    await db.shipment.update({
      where: { id },
      data: { courier, trackingNumber, trackingUrl, numberOfParcels },
    });

    revalidatePath("/admin/shipments");
    return { success: true, message: "Tracking updated successfully." };
  } catch (error) {
    console.error("UPDATE_TRACKING_ERROR", error);
    return { success: false, error: "Failed to update tracking info." };
  }
}

// --- 3. BULK ACTIONS (WooCommerce Style) ---
export async function bulkUpdateShipments(ids: string[], action: string) {
  try {
    if (ids.length === 0) return { success: false, error: "No items selected." };

    if (action === "delete") {
      await db.shipment.deleteMany({ where: { id: { in: ids } } });
      
    } else if (action === "mark_delivered") {
      
      // ১. শিপমেন্ট টেবিল আপডেট
      await db.shipment.updateMany({
        where: { id: { in: ids } },
        data: { deliveredDate: new Date() },
      });

      // ২. যেসব শিপমেন্ট মার্ক করা হলো, তাদের অর্ডারগুলোর ID বের করা
      const updatedShipments = await db.shipment.findMany({
        where: { id: { in: ids } },
        select: { orderId: true },
      });

      const orderIds = updatedShipments.map((s) => s.orderId);

      // ৩. ঐ অর্ডারগুলোর স্ট্যাটাসও DELIVERED করে দেওয়া (আপনার রিকোয়ারমেন্ট অনুযায়ী)
      await db.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatus.DELIVERED },
      });
    }

    revalidatePath("/admin/shipments");
    return { success: true, message: "Bulk action applied successfully." };
  } catch (error) {
    console.error("BULK_ACTION_ERROR", error);
    return { success: false, error: "Failed to perform bulk action." };
  }
}