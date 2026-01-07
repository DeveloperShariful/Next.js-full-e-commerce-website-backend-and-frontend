//app/actions/admin/order/import-export.ts

"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

// --- 1. EXPORT FUNCTION (Generating WooCommerce Style CSV) ---
export async function exportOrdersCSV() {
  try {
    // ১. অর্ডারগুলো ডাটাবেস থেকে আনা (items সহ)
    const orders = await db.order.findMany({
      include: {
        user: true,
        items: true, // আইটেমগুলো দরকার
      },
      orderBy: { createdAt: 'desc' },
      take: 2000 // Performance limit (Need batching for more)
    });

    const csvRows: any[] = [];

    // ২. প্রতিটি অর্ডার এবং তার আইটেম লুপ করা
    for (const order of orders) {
        const billing: any = order.billingAddress || {};
        const shipping: any = order.shippingAddress || {};

        // যদি আইটেম থাকে, প্রতিটি আইটেমের জন্য একটা রো হবে
        if (order.items.length > 0) {
            order.items.forEach((item, index) => {
                csvRows.push({
                    "Order Number": order.orderNumber,
                    "Order Status": order.status,
                    "Order Date": order.createdAt.toISOString(),
                    "Customer Note": order.customerNote || "",
                    
                    // Billing
                    "First Name (Billing)": billing.firstName || "",
                    "Last Name (Billing)": billing.lastName || "",
                    "Address 1&2 (Billing)": billing.address1 || "",
                    "City (Billing)": billing.city || "",
                    "State Code (Billing)": billing.state || "",
                    "Postcode (Billing)": billing.postcode || "",
                    "Country Code (Billing)": billing.country || "",
                    "Email (Billing)": order.user?.email || order.guestEmail || "",
                    "Phone (Billing)": billing.phone || "",

                    // Shipping
                    "First Name (Shipping)": shipping.firstName || "",
                    "Last Name (Shipping)": shipping.lastName || "",
                    "Address 1&2 (Shipping)": shipping.address1 || "",
                    "City (Shipping)": shipping.city || "",
                    "State Code (Shipping)": shipping.state || "",
                    "Postcode (Shipping)": shipping.postcode || "",
                    "Country Code (Shipping)": shipping.country || "",

                    // Financials (Only show totals on first row of order to avoid confusion in some systems, or repeat it)
                    // WooCommerce usually repeats these
                    "Payment Method Title": order.paymentMethod,
                    "Order Subtotal Amount": order.subtotal,
                    "Order Shipping Amount": order.shippingTotal,
                    "Order Total Tax Amount": order.taxTotal,
                    "Order Refund Amount": order.refundedAmount,
                    "Order Total Amount": order.total,
                    "Coupon Code": order.couponCode,
                    "Discount Amount": order.discountTotal,

                    // Item Details
                    "SKU": item.sku || "",
                    "Item Name": item.productName,
                    "Quantity (- Refund)": item.quantity,
                    "Item Cost": item.price
                });
            });
        } else {
            // যদি আইটেম না থাকে (Edge case), তবুও অর্ডারের বেসিক ইনফো রো বানাবো
            csvRows.push({
                "Order Number": order.orderNumber,
                "Order Status": order.status,
                "Order Date": order.createdAt.toISOString(),
                "Order Total Amount": order.total,
                // ... other fields empty
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

// --- 2. IMPORT FUNCTION (Handling Grouping & Batching) ---
export async function importOrdersCSV(csvString: string) {
    try {
        const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        
        // --- STEP A: GROUPING ROWS BY ORDER NUMBER ---
        // CSV তে একই অর্ডারের ৫টা আইটেম থাকলে ৫টা রো থাকে। আমরা সেটাকে ১টা অবজেক্টে মার্জ করব।
        const groupedOrders = new Map<string, any>();

        for (const row of data as any[]) {
            const orderNum = row["Order Number"] || row["id"];
            if (!orderNum) continue;

            if (!groupedOrders.has(orderNum)) {
                // নতুন অর্ডার শুরু
                groupedOrders.set(orderNum, {
                    meta: row, // মেইন অর্ডারের ডাটা (Address, Status, etc)
                    items: []  // আইটেম লিস্ট
                });
            }

            // আইটেম পুশ করা
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

        // --- STEP C: PROCESS EACH GROUPED ORDER ---
        for (const [orderNum, data] of groupedOrders) {
            const row = data.meta;
            const items = data.items;

            // ১. ডুপ্লিকেট চেক
            const existing = await db.order.findUnique({ where: { orderNumber: String(orderNum) } });
            if (existing) {
                skipCount++;
                continue;
            }

            // ২. ইউজার খোঁজা
            const email = row["Email (Billing)"] || row["billing_email"];
            const user = email ? await db.user.findUnique({ where: { email } }) : null;

            // ৩. স্ট্যাটাস সেট করা
            const status = mapStatus(row["Order Status"]);
            
            // Payment Status Logic
            let payStatus: PaymentStatus = "UNPAID";
            if (["DELIVERED", "PROCESSING", "SHIPPED", "COMPLETED"].includes(status as any)) payStatus = "PAID";
            if (status === "REFUNDED") payStatus = "REFUNDED";
            if (status === "CANCELLED") payStatus = "VOIDED";

            // ৪. অ্যাড্রেস অবজেক্ট তৈরি
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

            // ৫. আইটেম এবং প্রোডাক্ট লিংকিং
            // আমরা SKU দিয়ে প্রোডাক্ট খুঁজব, যদি পাই লিংক করব, না পেলে নাম দিয়ে আইটেম বানাব
            const orderItemsData = [];
            
            for (const item of items) {
                let productId = null;
                // SKU দিয়ে প্রোডাক্ট খোঁজা
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
                    productId: productId // লিংক হচ্ছে যদি থাকে
                });
            }

            // ৬. ডাটাবেসে সেভ (TRANSACTION)
            try {
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
                        
                        currency: "AUD", // ডিফল্ট বা CSV থেকে নিতে পারেন
                        paymentMethod: row["Payment Method Title"] || "Imported",
                        customerNote: row["Customer Note"],
                        couponCode: row["Coupon Code"],
                        
                        createdAt: row["Order Date"] ? new Date(row["Order Date"]) : new Date(),
                        
                        shippingAddress: shippingAddr as any,
                        billingAddress: billingAddr as any,
                        
                        // 🔥 Items Creation
                        items: {
                            create: orderItemsData
                        },

                        // Log Note
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

        // --- Log Activity ---
        if (successCount > 0) {
            await db.activityLog.create({
                data: {
                    userId: "system", // Or current user ID if passed
                    action: "BULK_IMPORT_ORDERS",
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