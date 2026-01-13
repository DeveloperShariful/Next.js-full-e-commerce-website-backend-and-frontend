"use server";

import { db } from "@/lib/prisma";
import Papa from "papaparse";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// --- HELPERS ---

const safeFloat = (val: any) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

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

// Address Parser
const parseAddress = (fullAddress: string, name: string, email: string, phone: string) => {
    if (!fullAddress) return {};
    const parts = fullAddress.split(",").map(p => p.trim());
    
    const country = parts.length > 0 ? parts.pop() : "AU";
    const postcode = parts.length > 0 ? parts.pop() : "";
    const state = parts.length > 0 ? parts.pop() : "";
    const city = parts.length > 0 ? parts.pop() : "";
    const address1 = parts.join(", "); 

    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    return {
        firstName: firstName || "",
        lastName: lastName || "",
        address1: address1 || "",
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "AU",
        email: email,
        phone: phone
    };
};

// Product Parser (Regex Logic)
const parseProducts = (productString: string) => {
    if (!productString) return [];
    const rawItems = productString.split(" || ");
    const parsedItems: any[] = [];

    rawItems.forEach(itemStr => {
        try {
            const nameMatch = itemStr.split("[")[0].trim();
            const skuMatch = itemStr.match(/\[SKU: (.*?)\]/);
            const qtyMatch = itemStr.match(/\(x(\d+)\)/);
            const priceMatch = itemStr.match(/\(x\d+\) - ([\d\.]+)/);
            const imgMatch = itemStr.match(/\[Img: (.*?)\]/);
            const dimsMatch = itemStr.match(/\{Dims: (.*?)\}/); 
            const catMatch = itemStr.match(/\[Cat: (.*?)\]/);

            parsedItems.push({
                name: nameMatch || "Imported Item",
                sku: skuMatch ? skuMatch[1] : null,
                quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
                price: priceMatch ? parseFloat(priceMatch[1]) : 0,
                image: imgMatch ? imgMatch[1] : null,
                category: catMatch ? catMatch[1] : null,
                dims: dimsMatch ? dimsMatch[1] : null
            });
        } catch (e) {
            console.error("Error parsing item:", itemStr);
        }
    });

    return parsedItems;
};

// Shipping Parser
const parseShipping = (shipString: string) => {
    if (!shipString) return { method: "Standard", cost: 0 };
    const lastDashIndex = shipString.lastIndexOf(" - ");
    if (lastDashIndex !== -1) {
        const method = shipString.substring(0, lastDashIndex);
        const costStr = shipString.substring(lastDashIndex + 3);
        return { method, cost: safeFloat(costStr) };
    }
    return { method: shipString, cost: 0 };
};

// Coupon Parser
const parseCoupon = (couponStr: string) => {
    if (!couponStr) return { code: null, amount: 0 };
    const parts = couponStr.split(" ($");
    if (parts.length === 2) {
        return { 
            code: parts[0].trim(), 
            amount: safeFloat(parts[1].replace(")", "")) 
        };
    }
    return { code: couponStr, amount: 0 };
};

// --- 1. IMPORT FUNCTION ---

export async function importOrdersCSV(csvString: string) {
    try {
        const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        
        const user = await currentUser();
        const dbUser = user ? await db.user.findUnique({ where: { clerkId: user.id } }) : null;
        const userId = dbUser?.id;

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
            const orderNum = row["Order ID"];
            if (!orderNum) continue;

            const existing = await db.order.findUnique({ where: { orderNumber: String(orderNum) } });
            if (existing) {
                skipCount++;
                continue;
            }

            const address = parseAddress(row["Billing Address"], row["Customer Name"], row["Email"], row["Phone"]);
            const items = parseProducts(row["Product Details (Name | SKU | Cat | Dims | Image)"]);
            const shipping = parseShipping(row["Shipping Method (Cost)"]);
            const coupon = parseCoupon(row["Coupons"]);
            const status = mapStatus(row["Status"]);

            let payStatus: PaymentStatus = "UNPAID";
            if (["DELIVERED", "PROCESSING", "SHIPPED", "AWAITING_PAYMENT"].includes(status as any)) {
                if (row["Transaction ID"] || row["Payment Method"]?.includes("Card") || row["Payment Method"]?.includes("PayPal")) {
                    payStatus = "PAID";
                }
            }
            if (status === "REFUNDED") payStatus = "REFUNDED";
            if (status === "CANCELLED") payStatus = "VOIDED";
            if (status === "FAILED") payStatus = "UNPAID";

            const email = row["Email"];
            let orderUserId = null;
            if (email) {
                const existingUser = await db.user.findUnique({ where: { email } });
                if (existingUser) orderUserId = existingUser.id;
            }

            try {
                const orderDate = row["Date"] ? new Date(row["Date"]) : new Date();

                await db.order.create({
                    data: {
                        orderNumber: String(orderNum),
                        userId: orderUserId,
                        guestEmail: !orderUserId ? email : null,
                        status: status,
                        paymentStatus: payStatus,
                        fulfillmentStatus: status === "DELIVERED" ? "FULFILLED" : "UNFULFILLED",
                        total: safeFloat(row["Order Total"]),
                        shippingTotal: shipping.cost,
                        subtotal: safeFloat(row["Order Total"]) - shipping.cost + coupon.amount,
                        discountTotal: coupon.amount,
                        couponCode: coupon.code,
                        paymentMethod: row["Payment Method"],
                        paymentGateway: row["Payment Gateway"],
                        paymentId: row["Transaction ID"] || `imp_${orderNum}`,
                        customerNote: row["Customer Note"],
                        ipAddress: row["Customer IP"],
                        shippingAddress: address as any,
                        billingAddress: address as any,
                        shippingMethod: shipping.method,
                        createdAt: orderDate,
                        items: {
                            create: items.map(item => ({
                                productName: item.name,
                                sku: item.sku,
                                price: item.price / item.quantity,
                                quantity: item.quantity,
                                total: item.price,
                                image: item.image,
                            }))
                        },
                        orderNotes: {
                            create: { content: "Imported from WooCommerce CSV", isSystem: true }
                        }
                    }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed order #${orderNum}:`, err);
                errorCount++;
            }
        }

        if (userId && successCount > 0) {
            await db.activityLog.create({
                data: { userId: userId, action: "BULK_IMPORT", details: { success: successCount, skipped: skipCount, failed: errorCount } }
            });
        }

        revalidatePath("/admin/orders");
        return { success: true, message: `Imported: ${successCount}. Skipped: ${skipCount}. Failed: ${errorCount}` };

    } catch (error: any) {
        console.error("CSV Parse Error:", error);
        return { success: false, error: "Critical failure parsing CSV." };
    }
}

// --- 2. EXPORT FUNCTION (UPDATED) ---

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

        // Flatten Items logic
        if (order.items.length > 0) {
            order.items.forEach((item) => {
                csvRows.push({
                    "Order ID": order.orderNumber,
                    "Date": order.createdAt.toISOString(),
                    "Status": order.status,
                    "Customer Name": order.user?.name || `${billing.firstName} ${billing.lastName}`,
                    "Email": order.user?.email || order.guestEmail,
                    "Phone": billing.phone,
                    "Billing Address": `${billing.address1}, ${billing.city}, ${billing.state}, ${billing.postcode}`,
                    "Shipping Address": `${shipping.address1}, ${shipping.city}, ${shipping.state}, ${shipping.postcode}`,
                    "Payment Method": order.paymentMethod,
                    "Total": order.total,
                    "Item Name": item.productName,
                    "Item SKU": item.sku,
                    "Item Qty": item.quantity,
                    "Item Price": item.price
                });
            });
        } else {
            // Order without items
            csvRows.push({
                "Order ID": order.orderNumber,
                "Date": order.createdAt.toISOString(),
                "Status": order.status,
                "Total": order.total,
            });
        }
    }

    const csvString = Papa.unparse(csvRows);
    
    // ✅ This return structure fixes the TypeScript error
    return { success: true, csv: csvString };

  } catch (error) {
    console.error("Export Error:", error);
    return { success: false, error: "Failed to export orders" };
  }
}