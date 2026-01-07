//app/actions/admin/order/import-export.ts

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server"; // ✅ Added for Log Fix

// --- HELPERS ---

const safeFloat = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

// WooCommerce Status to Prisma Enum Mapping
const mapStatus = (wcStatus: string): OrderStatus => {
    const s = wcStatus?.toLowerCase().trim() || "pending";
    if (s.includes("completed")) return "DELIVERED";
    if (s.includes("processing")) return "PROCESSING";
    if (s.includes("on-hold")) return "AWAITING_PAYMENT";
    if (s.includes("pending")) return "PENDING";
    if (s.includes("cancelled")) return "CANCELLED";
    if (s.includes("refunded")) return "REFUNDED";
    if (s.includes("failed")) return "FAILED";
    return "PENDING";
};

// ✅ HELPER: Get Real DB User ID for Logging
async function getDbUserId() {
    try {
        const user = await currentUser();
        if (!user) return null;
        const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
        return dbUser?.id;
    } catch (e) {
        return null;
    }
}

// --- 1. EXPORT FUNCTION (Original Logic Preserved) ---
export async function exportOrdersCSV() {
  try {
    const orders = await db.order.findMany({
      include: {
        user: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    const csvRows: any[] = [];

    for (const order of orders) {
        const billing: any = order.billingAddress || {};
        const shipping: any = order.shippingAddress || {};

        if (order.items.length > 0) {
            order.items.forEach((item, index) => {
                csvRows.push({
                    "Order Number": order.orderNumber,
                    "Order Status": order.status,
                    "Order Date": order.createdAt.toISOString(),
                    "Customer Note": order.customerNote || "",
                    
                    "First Name (Billing)": billing.firstName || "",
                    "Last Name (Billing)": billing.lastName || "",
                    "Address 1&2 (Billing)": billing.address1 || "",
                    "City (Billing)": billing.city || "",
                    "State Code (Billing)": billing.state || "",
                    "Postcode (Billing)": billing.postcode || "",
                    "Country Code (Billing)": billing.country || "",
                    "Email (Billing)": order.user?.email || order.guestEmail || "",
                    "Phone (Billing)": billing.phone || "",

                    "First Name (Shipping)": shipping.firstName || "",
                    "Last Name (Shipping)": shipping.lastName || "",
                    "Address 1&2 (Shipping)": shipping.address1 || "",
                    "City (Shipping)": shipping.city || "",
                    "State Code (Shipping)": shipping.state || "",
                    "Postcode (Shipping)": shipping.postcode || "",
                    "Country Code (Shipping)": shipping.country || "",

                    "Payment Method Title": order.paymentMethod,
                    "Order Subtotal Amount": order.subtotal,
                    "Order Shipping Amount": order.shippingTotal,
                    "Order Total Tax Amount": order.taxTotal,
                    "Order Refund Amount": order.refundedAmount,
                    "Order Total Amount": order.total,
                    "Coupon Code": order.couponCode,
                    "Discount Amount": order.discountTotal,

                    "SKU": item.sku || "",
                    "Item Name": item.productName,
                    "Quantity (- Refund)": item.quantity,
                    "Item Cost": item.price
                });
            });
        } else {
            csvRows.push({
                "Order Number": order.orderNumber,
                "Order Status": order.status,
                "Order Date": order.createdAt.toISOString(),
                "Order Total Amount": order.total,
            });
        }
    }

    const csvString = Papa.unparse(csvRows);
    return { success: true, csv: csvString };

  } catch (error) {
    console.error("Export Error:", error);
    return { success: false, error: "Failed to export orders" };
  }
}

// --- 2. IMPORT FUNCTION (Fixed Activity Log) ---
export async function importOrdersCSV(csvString: string) {
    try {
        const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        
        // ✅ Fix: Get Real User ID
        const userId = await getDbUserId();

        // --- STEP A: GROUPING ROWS ---
        const groupedOrders = new Map<string, any>();

        for (const row of data as any[]) {
            const orderNum = row["Order Number"] || row["id"];
            if (!orderNum) continue;

            if (!groupedOrders.has(orderNum)) {
                groupedOrders.set(orderNum, {
                    meta: row,
                    items: []
                });
            }

            if (row["Item Name"] || row["SKU"]) {
                groupedOrders.get(orderNum).items.push({
                    name: row["Item Name"] || "Imported Item",
                    sku: row["SKU"],
                    qty: safeFloat(row["Quantity (- Refund)"] || row["Quantity"]) || 1,
                    cost: safeFloat(row["Item Cost"] || row["Item Total"]) || 0
                });
            }
        }

        // --- STEP B: PREPARE BULK DATA ---
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        // --- STEP C: PROCESS ---
        for (const [orderNum, data] of groupedOrders) {
            const row = data.meta;
            const items = data.items;

            // 1. Duplicate Check
            const existing = await db.order.findUnique({ where: { orderNumber: String(orderNum) } });
            if (existing) {
                skipCount++;
                continue;
            }

            // 2. User
            const email = row["Email (Billing)"] || row["billing_email"];
            const user = email ? await db.user.findUnique({ where: { email } }) : null;

            // 3. Status
            const status = mapStatus(row["Order Status"]);
            
            let payStatus: PaymentStatus = "UNPAID";
            if (["DELIVERED", "PROCESSING", "SHIPPED", "COMPLETED"].includes(status as any)) payStatus = "PAID";
            if (status === "REFUNDED") payStatus = "REFUNDED";
            if (status === "CANCELLED") payStatus = "VOIDED";

            // 4. Address
            const billingAddr = {
                firstName: row["First Name (Billing)"] || "",
                lastName: row["Last Name (Billing)"] || "",
                company: row["Company (Billing)"] || "",
                address1: row["Address 1&2 (Billing)"] || "",
                city: row["City (Billing)"] || "",
                state: row["State Code (Billing)"] || "",
                postcode: row["Postcode (Billing)"] || "",
                country: row["Country Code (Billing)"] || "AU",
                phone: row["Phone (Billing)"] || "",
                email: email
            };

            const shippingAddr = {
                firstName: row["First Name (Shipping)"] || billingAddr.firstName,
                lastName: row["Last Name (Shipping)"] || billingAddr.lastName,
                address1: row["Address 1&2 (Shipping)"] || billingAddr.address1,
                city: row["City (Shipping)"] || billingAddr.city,
                state: row["State Code (Shipping)"] || billingAddr.state,
                postcode: row["Postcode (Shipping)"] || billingAddr.postcode,
                country: row["Country Code (Shipping)"] || billingAddr.country,
                phone: billingAddr.phone,
                email: email
            };

            // 5. Items
            const orderItemsData = [];
            for (const item of items) {
                let productId = null;
                if (item.sku) {
                    const product = await db.product.findUnique({ where: { sku: item.sku }, select: { id: true } });
                    if (product) productId = product.id;
                }

                orderItemsData.push({
                    productName: item.name,
                    sku: item.sku,
                    price: item.cost,
                    quantity: item.qty,
                    total: item.cost * item.qty,
                    productId: productId
                });
            }

            // 6. DB Save
            try {
                // Parse date carefully
                const orderDate = row["Order Date"] ? new Date(row["Order Date"]) : new Date();

                await db.order.create({
                    data: {
                        orderNumber: String(orderNum),
                        userId: user?.id || null,
                        guestEmail: user ? null : email,
                        
                        status: status,
                        paymentStatus: payStatus,
                        fulfillmentStatus: status === "DELIVERED" ? "FULFILLED" : "UNFULFILLED",
                        
                        total: safeFloat(row["Order Total Amount"]),
                        subtotal: safeFloat(row["Order Subtotal Amount"]),
                        shippingTotal: safeFloat(row["Order Shipping Amount"]),
                        taxTotal: safeFloat(row["Order Total Tax Amount"]),
                        refundedAmount: safeFloat(row["Order Refund Amount"]),
                        discountTotal: safeFloat(row["Cart Discount Amount"] || row["Discount Amount"]),
                        
                        currency: "AUD",
                        paymentMethod: row["Payment Method Title"] || "Imported",
                        customerNote: row["Customer Note"],
                        couponCode: row["Coupon Code"],
                        
                        createdAt: isNaN(orderDate.getTime()) ? new Date() : orderDate,
                        
                        shippingAddress: shippingAddr as any,
                        billingAddress: billingAddr as any,
                        
                        items: {
                            create: orderItemsData
                        },

                        orderNotes: {
                            create: {
                                content: "Order imported via CSV",
                                isSystem: true
                            }
                        }
                    }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to import order #${orderNum}:`, err);
                errorCount++;
            }
        }

        // --- Log Activity (FIXED) ---
        // Only log if userId exists
        if (userId && successCount > 0) {
            await db.activityLog.create({
                data: {
                    userId: userId, // ✅ Using Real ID
                    action: "BULK_IMPORT_ORDERS",
                    entityType: "Order", // Optional: Add entity type if your schema supports it
                    details: { success: successCount, skipped: skipCount, failed: errorCount }
                }
            });
        }

        revalidatePath("/admin/orders");
        return { 
            success: true, 
            message: `Processed: ${successCount} Imported, ${skipCount} Duplicates Skipped, ${errorCount} Failed.` 
        };

    } catch (error: any) {
        console.error("Critical Import Error:", error);
        return { success: false, error: error.message || "Import failed critically" };
    }
}