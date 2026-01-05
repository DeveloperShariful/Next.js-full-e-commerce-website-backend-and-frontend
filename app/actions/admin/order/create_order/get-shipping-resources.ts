// File: app/actions/order/create_order/get-shipping-resources.ts

"use server";

import { db } from "@/lib/prisma";

export async function getShippingResources() {
  try {
    // ১. পিকআপ লোকেশনগুলো আনা
    const pickupLocations = await db.pickupLocation.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
      }
    });

    // ২. শিপিং রেটগুলো আনা
    const shippingRates = await db.shippingRate.findMany({
      include: {
        zone: true,
        carrierService: {
          select: {
            name: true,
            isEnabled: true
          }
        }
      }
    });

    return {
      pickupLocations,
      shippingRates
    };
  } catch (error) {
    console.error("GET_SHIPPING_RESOURCES_ERROR:", error);
    return {
      pickupLocations: [],
      shippingRates: []
    };
  }
}