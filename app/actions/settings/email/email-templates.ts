// File: app/actions/settings/email/email-templates.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getEmailTemplates() {
  try {
    // ১. প্রথমে চেক করি কোনো টেমপ্লেট আছে কিনা
    const count = await db.emailTemplate.count();

    // ২. যদি না থাকে, তবে ডিফল্ট টেমপ্লেটগুলো তৈরি করি (Seeding)
    if (count === 0) {
        console.log("Seeding default email templates...");
        
        const defaults = [
            { 
                slug: 'new_order_admin', 
                name: 'New Order (Admin)', 
                triggerEvent: 'ORDER_CREATED_ADMIN', 
                recipientType: 'admin', 
                subject: 'New Order #{order_number} Received',
                content: '<h1>New Order Received</h1><p>You have received a new order from {customer_name}. Total: {total_amount}</p>'
            },
            { 
                slug: 'order_confirmation', 
                name: 'Order Confirmation', 
                triggerEvent: 'ORDER_CREATED', 
                recipientType: 'customer', 
                subject: 'Your Order #{order_number} has been received',
                content: '<h1>Thanks for your order!</h1><p>Hi {customer_name}, we have received your order #{order_number}.</p>'
            },
            { 
                slug: 'order_processing', 
                name: 'Order Processing', 
                triggerEvent: 'ORDER_PROCESSING', 
                recipientType: 'customer', 
                subject: 'We are processing your order #{order_number}',
                content: '<p>Your order is now being processed and packed.</p>'
            },
            { 
                slug: 'order_shipped', 
                name: 'Order Shipped', 
                triggerEvent: 'ORDER_SHIPPED', 
                recipientType: 'customer', 
                subject: 'Order #{order_number} is on the way!',
                content: '<p>Good news! Your order has been shipped via {courier}. Tracking: {tracking_number}</p>'
            },
            { 
                slug: 'order_delivered', 
                name: 'Order Delivered', 
                triggerEvent: 'ORDER_DELIVERED', 
                recipientType: 'customer', 
                subject: 'Order #{order_number} Delivered',
                content: '<p>Your order has been delivered. Enjoy!</p>'
            },
            { 
                slug: 'order_cancelled', 
                name: 'Order Cancelled', 
                triggerEvent: 'ORDER_CANCELLED', 
                recipientType: 'customer', 
                subject: 'Order #{order_number} Cancelled',
                content: '<p>Your order #{order_number} has been cancelled.</p>'
            },
            { 
                slug: 'order_refunded', 
                name: 'Order Refunded', 
                triggerEvent: 'ORDER_REFUNDED', 
                recipientType: 'customer', 
                subject: 'Refund processed for Order #{order_number}',
                content: '<p>We have processed a refund of {refund_amount} for your order.</p>'
            },
            { 
                slug: 'customer_welcome', 
                name: 'New Account Welcome', 
                triggerEvent: 'USER_REGISTERED', 
                recipientType: 'customer', 
                subject: 'Welcome to GoBike!',
                content: '<h1>Welcome!</h1><p>Thanks for creating an account with us.</p>'
            },
            { 
                slug: 'reset_password', 
                name: 'Reset Password', 
                triggerEvent: 'PASSWORD_RESET', 
                recipientType: 'customer', 
                subject: 'Password Reset Request',
                content: '<p>Click here to reset your password: {reset_link}</p>'
            }
        ];

        // ডাটাবেসে লুপ চালিয়ে সেভ করা
        for (const tmpl of defaults) {
            await db.emailTemplate.create({
                data: {
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
    }

    // ৩. সব টেমপ্লেট রিটার্ন করা
    const templates = await db.emailTemplate.findMany({
      orderBy: { name: 'asc' }
    });

    return { success: true, data: templates };
  } catch (error) {
    console.error("GET_EMAIL_TEMPLATES_ERROR", error);
    return { success: false, error: "Failed to fetch email templates" };
  }
}

// --- UPDATE TEMPLATE ---
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
      data: {
        subject,
        heading,
        content,
        isEnabled,
        cc,
        bcc
      }
    });

    revalidatePath("/admin/settings/email");
    return { success: true, message: "Template updated successfully" };
  } catch (error) {
    return { success: false, error: "Failed to update template" };
  }
}