// File: app/actions/settings/email/email-templates.ts

"use server";

import { db } from "@/lib/prisma";

// টেমপ্লেটগুলোর লিস্ট কনস্ট্যান্ট হিসেবে বাইরে রাখলাম যাতে রি-ইউজ করা যায়
const DEFAULT_TEMPLATES = [
    // --- 1. ORDER STATUS EVENTS (7) ---
    { slug: 'order_pending', name: 'Order Pending', triggerEvent: 'ORDER_PENDING', recipientType: 'customer', subject: 'Your Order #{order_number} is Pending', content: '<p>Thanks for your order. We have received it.</p>' },
    { slug: 'order_processing', name: 'Order Processing', triggerEvent: 'ORDER_PROCESSING', recipientType: 'customer', subject: 'We are processing Order #{order_number}', content: '<p>Your order is being processed.</p>' },
    { slug: 'order_packed', name: 'Order Packed', triggerEvent: 'ORDER_PACKED', recipientType: 'customer', subject: 'Order #{order_number} is Packed', content: '<p>Your order is packed and ready to ship.</p>' },
    { slug: 'order_shipped', name: 'Order Shipped', triggerEvent: 'ORDER_SHIPPED', recipientType: 'customer', subject: 'Order #{order_number} Shipped', content: '<p>Your order is on the way! Tracking: {tracking_number}</p>' },
    { slug: 'order_delivered', name: 'Order Delivered', triggerEvent: 'ORDER_DELIVERED', recipientType: 'customer', subject: 'Order #{order_number} Delivered', content: '<p>Your order has been delivered.</p>' },
    { slug: 'order_cancelled', name: 'Order Cancelled', triggerEvent: 'ORDER_CANCELLED', recipientType: 'customer', subject: 'Order #{order_number} Cancelled', content: '<p>Your order has been cancelled.</p>' },
    { slug: 'order_status_refunded', name: 'Order Status: Refunded', triggerEvent: 'ORDER_REFUNDED_STATUS', recipientType: 'customer', subject: 'Order #{order_number} Marked as Refunded', content: '<p>Your order status is now Refunded.</p>' },

    // --- 2. PAYMENT STATUS EVENTS (4) ---
    { slug: 'payment_paid', name: 'Payment Received', triggerEvent: 'PAYMENT_PAID', recipientType: 'customer', subject: 'Payment Received for Order #{order_number}', content: '<p>Thank you. We received your payment.</p>' },
    { slug: 'payment_unpaid', name: 'Payment Pending', triggerEvent: 'PAYMENT_UNPAID', recipientType: 'customer', subject: 'Payment Pending for Order #{order_number}', content: '<p>Please complete your payment.</p>' },
    { slug: 'payment_refunded', name: 'Full Refund Issued', triggerEvent: 'PAYMENT_REFUNDED', recipientType: 'customer', subject: 'Refund Processed for Order #{order_number}', content: '<p>We have refunded your payment.</p>' },
    { slug: 'payment_partially_refunded', name: 'Partial Refund', triggerEvent: 'PAYMENT_PARTIALLY_REFUNDED', recipientType: 'customer', subject: 'Partial Refund for Order #{order_number}', content: '<p>A partial refund has been issued.</p>' },

    // --- 3. FULFILLMENT STATUS EVENTS (4) ---
    { slug: 'fulfillment_unfulfilled', name: 'Unfulfilled', triggerEvent: 'FULFILLMENT_UNFULFILLED', recipientType: 'customer', subject: 'Order #{order_number} Update', content: '<p>Order status updated to Unfulfilled.</p>' },
    { slug: 'fulfillment_fulfilled', name: 'Fulfilled', triggerEvent: 'FULFILLMENT_FULFILLED', recipientType: 'customer', subject: 'Order #{order_number} Fulfilled', content: '<p>Your items have been fulfilled.</p>' },
    { slug: 'fulfillment_partial', name: 'Partially Fulfilled', triggerEvent: 'FULFILLMENT_PARTIALLY_FULFILLED', recipientType: 'customer', subject: 'Items Partially Sent for #{order_number}', content: '<p>Some items have been sent.</p>' },
    { slug: 'fulfillment_returned', name: 'Shipment Returned', triggerEvent: 'FULFILLMENT_RETURNED', recipientType: 'customer', subject: 'Order #{order_number} Returned to Sender', content: '<p>We received your return package.</p>' },

    // --- 4. ADMIN NOTIFICATIONS (4) ---
    { slug: 'admin_new_order', name: 'Admin: New Order', triggerEvent: 'ADMIN_ORDER_PENDING', recipientType: 'admin', subject: '[Admin] New Order #{order_number}', content: '<p>New order received from {customer_name}. Total: {total_amount}</p>' },
    { slug: 'admin_cancelled', name: 'Admin: Order Cancelled', triggerEvent: 'ADMIN_ORDER_CANCELLED', recipientType: 'admin', subject: '[Admin] Order #{order_number} Cancelled', content: '<p>Order #{order_number} was cancelled.</p>' },
    { slug: 'admin_refunded', name: 'Admin: Order Refunded', triggerEvent: 'ADMIN_PAYMENT_REFUNDED', recipientType: 'admin', subject: '[Admin] Refund Issued #{order_number}', content: '<p>A refund was issued for this order.</p>' },
    { slug: 'admin_returned', name: 'Admin: Item Returned', triggerEvent: 'ADMIN_FULFILLMENT_RETURNED', recipientType: 'admin', subject: '[Admin] Return Received #{order_number}', content: '<p>A shipment has been returned.</p>' },

    // --- 5. FAILED EVENTS (2) ---
    { slug: 'payment_failed', name: 'Payment Failed', triggerEvent: 'PAYMENT_FAILED', recipientType: 'customer', subject: 'Payment Failed for Order #{order_number}', content: '<p>We could not process your payment. Please try again.</p>' },
    { slug: 'admin_payment_failed', name: 'Admin: Payment Failed', triggerEvent: 'ADMIN_PAYMENT_FAILED', recipientType: 'admin', subject: '[Admin] Payment Failed for Order #{order_number}', content: '<p>Payment failed for order #{order_number}. Customer: {customer_name}</p>' }
];

// 1. Fetch Templates (Normal Load)
export async function getEmailTemplates() {
  try {
    // ডাটাবেস থেকে সব টেমপ্লেট নিয়ে আসি
    const templates = await db.emailTemplate.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: "Failed to fetch templates" };
  }
}

// 2. Force Sync / Seed Templates (Refresh বাটন থেকে কল হবে)
export async function syncEmailTemplates() {
    try {
        console.log("🔄 Syncing Email Templates...");

        for (const tmpl of DEFAULT_TEMPLATES) {
            // Upsert: যদি থাকে আপডেট করবে (কিছুই না), না থাকলে তৈরি করবে
            await db.emailTemplate.upsert({
                where: { triggerEvent: tmpl.triggerEvent }, // ট্রিগার দিয়ে চেক করবে
                update: {}, // যদি থাকে, তবে আমরা হাত দিব না (ইউজারের এডিট নষ্ট করা যাবে না)
                create: {
                    slug: tmpl.slug,
                    name: tmpl.name,
                    triggerEvent: tmpl.triggerEvent,
                    recipientType: tmpl.recipientType,
                    subject: tmpl.subject,
                    heading: tmpl.name,
                    content: tmpl.content,
                    isEnabled: true
                }
            });
        }

        // সিঙ্ক শেষ হলে লেটেস্ট লিস্ট রিটার্ন করি
        const templates = await db.emailTemplate.findMany({ orderBy: { name: 'asc' } });
        return { success: true, data: templates };

    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: "Failed to sync templates" };
    }
}

// 3. Update Template (Edit Modal থেকে)
export async function updateEmailTemplate(formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const subject = formData.get("subject") as string;
        const heading = formData.get("heading") as string;
        const content = formData.get("content") as string;
        const isEnabled = formData.get("isEnabled") === "true";
        
        const ccString = formData.get("cc") as string;
        const bccString = formData.get("bcc") as string;
        
        const cc = ccString ? ccString.split(",").map(e => e.trim()).filter(Boolean) : [];
        const bcc = bccString ? bccString.split(",").map(e => e.trim()).filter(Boolean) : [];
    
        await db.emailTemplate.update({
          where: { id },
          data: { subject, heading, content, isEnabled, cc, bcc }
        });
    
        return { success: true, message: "Template updated" };
      } catch (error) { 
        return { success: false, error: "Update failed" }; 
      }
}