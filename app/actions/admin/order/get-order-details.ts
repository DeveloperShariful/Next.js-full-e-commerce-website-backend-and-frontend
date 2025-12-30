// File Location: app/actions/order/get-order-details.ts

"use server";

import { db } from "@/lib/prisma";

export async function getOrderDetails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        // 1. Customer
        user: true,
        
        // 2. Items with LIVE Product Data
        items: {
            include: {
                // স্কিমা অনুযায়ী আপনার Product মডেলে 'featuredImage' আছে, 'image' নয়।
                product: { 
                  select: { 
                    id: true, 
                    stock: true, 
                    name: true, 
                    featuredImage: true 
                  } 
                }
                // নোট: আপনার স্কিমার OrderItem মডেলে 'variant' রিলেশন নেই, তাই এটি বাদ দেওয়া হলো।
            }
        },
        
        // 3. Logistics
        shipments: { orderBy: { shippedDate: 'desc' } },
        pickupLocation: true, 
        
        // 4. Financials
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        disputes: true, 
        
        // 5. Marketing
        discount: true, 
        
        // 6. After Sales
        returns: true, 

        // 7. Communication
        orderNotes: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!order) return { success: false, error: "Order not found" };
    return { success: true, data: order };
    
  } catch (error) {
    console.error("GET_ORDER_DETAILS_ERROR", error);
    return { success: false, error: "Database error" };
  }
}