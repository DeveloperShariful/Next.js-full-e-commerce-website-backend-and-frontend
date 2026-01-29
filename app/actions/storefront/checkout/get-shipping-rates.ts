//app/actions/storefront/checkout/get-shipping-rates.ts

"use server";

import { db } from "@/lib/prisma";
import { getTransdirectQuotes } from "./get-transdirect-quotes";

export type ShippingOption = {
  id: string;
  label: string;
  cost: number;
};

interface RateParams {
  cartId: string;
  address: {
    city: string;
    postcode: string;
    state: string;
  };
}

// 🛠️ INTERNAL HELPER: Server-side validation এর জন্য এই ফাংশনটি
export async function calculateShippingServerSide(cartId: string, address: any, selectedMethodId: string): Promise<number | null> {
    const rates = await getShippingRates({ cartId, address });
    const selectedRate = rates.find(r => r.id === selectedMethodId);
    return selectedRate ? selectedRate.cost : null;
}

export async function getShippingRates(params?: RateParams): Promise<ShippingOption[]> {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" }
    });
    
    const generalConfig = settings?.generalConfig as any || {};
    const enablePickup = generalConfig.enablePickup === true;

    // Address না থাকলে শুধু Pickup (যদি অন থাকে)
    if (!params || !params.address.postcode || !params.address.city) {
      return enablePickup 
        ? [{ id: 'pickup', label: 'Local Pickup', cost: 0.00 }]
        : [];
    }

    const cart = await db.cart.findUnique({
      where: { id: params.cartId },
      include: {
        items: { include: { product: true, variant: true } }
      }
    });

    if (!cart || cart.items.length === 0) return [];

    // Transdirect এর জন্য আইটেম প্রস্তুত করা
    const itemsForQuote = cart.items.map(item => {
      const source = item.variant || item.product;
      return {
        weight: Number(source.weight) || 0.5,
        length: Number(source.length) || 10,
        width: Number(source.width) || 10,
        height: Number(source.height) || 10,
        quantity: item.quantity
      };
    });

    // Transdirect API কল
    const quoteResult = await getTransdirectQuotes({
      items: itemsForQuote,
      receiver: {
        postcode: params.address.postcode,
        suburb: params.address.city,
        state: params.address.state || "NSW",
        type: "residential"
      }
    });

    const dynamicRates: ShippingOption[] = [];

    // Flat Rate / Free Shipping লজিক এখানে যুক্ত করতে পারেন (Database থেকে)
    // আপাতত Transdirect + Pickup
    if (quoteResult.success && quoteResult.quotes.length > 0) {
      quoteResult.quotes.forEach((q: any) => {
        dynamicRates.push({
          id: q.id,
          label: `${q.name} (${q.transit_time || 'ETA N/A'})`,
          cost: q.price
        });
      });
    }

    if (enablePickup) {
        dynamicRates.push({ id: 'pickup', label: 'Local Pickup', cost: 0.00 });
    }

    return dynamicRates;

  } catch (error) {
    console.error("Get Shipping Rates Error:", error);
    // Fallback logic if needed
    return [];
  }
}