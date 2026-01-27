// File: app/actions/settings/email/email-templates.ts

"use server";

import { db } from "@/lib/prisma";

const DEFAULT_TEMPLATES = [
    // --- ORDER & PAYMENT ---
    { slug: 'order_pending', name: 'Order Pending', triggerEvent: 'ORDER_PENDING', recipientType: 'customer', subject: 'Your Order #{order_number} is Pending', content: '<p>Thanks for your order. We have received it.</p>' },
    { slug: 'order_processing', name: 'Order Processing', triggerEvent: 'ORDER_PROCESSING', recipientType: 'customer', subject: 'We are processing Order #{order_number}', content: '<p>Your order is being processed.</p>' },
    { slug: 'order_packed', name: 'Order Packed', triggerEvent: 'ORDER_PACKED', recipientType: 'customer', subject: 'Order #{order_number} is Packed', content: '<p>Your order is packed and ready to ship.</p>' },
    { slug: 'order_shipped', name: 'Order Shipped', triggerEvent: 'ORDER_SHIPPED', recipientType: 'customer', subject: 'Order #{order_number} Shipped', content: '<p>Your order is on the way! Tracking: {tracking_number}</p>' },
    { slug: 'order_delivered', name: 'Order Delivered', triggerEvent: 'ORDER_DELIVERED', recipientType: 'customer', subject: 'Order #{order_number} Delivered', content: '<p>Your order has been delivered.</p>' },
    { slug: 'order_cancelled', name: 'Order Cancelled', triggerEvent: 'ORDER_CANCELLED', recipientType: 'customer', subject: 'Order #{order_number} Cancelled', content: '<p>Your order has been cancelled.</p>' },
    { slug: 'order_status_refunded', name: 'Order Status: Refunded', triggerEvent: 'ORDER_REFUNDED_STATUS', recipientType: 'customer', subject: 'Order #{order_number} Marked as Refunded', content: '<p>Your order status is now Refunded.</p>' },

    { slug: 'payment_paid', name: 'Payment Received', triggerEvent: 'PAYMENT_PAID', recipientType: 'customer', subject: 'Payment Received for Order #{order_number}', content: '<p>Thank you. We received your payment.</p>' },
    { slug: 'payment_unpaid', name: 'Payment Pending', triggerEvent: 'PAYMENT_UNPAID', recipientType: 'customer', subject: 'Payment Pending for Order #{order_number}', content: '<p>Please complete your payment.</p>' },
    { slug: 'payment_refunded', name: 'Full Refund Issued', triggerEvent: 'PAYMENT_REFUNDED', recipientType: 'customer', subject: 'Refund Processed for Order #{order_number}', content: '<p>We have refunded your payment.</p>' },
    { slug: 'payment_partially_refunded', name: 'Partial Refund', triggerEvent: 'PAYMENT_PARTIALLY_REFUNDED', recipientType: 'customer', subject: 'Partial Refund for Order #{order_number}', content: '<p>A partial refund has been issued.</p>' },
    { slug: 'payment_failed', name: 'Payment Failed', triggerEvent: 'PAYMENT_FAILED', recipientType: 'customer', subject: 'Payment Failed for Order #{order_number}', content: '<p>We could not process your payment. Please try again.</p>' },

    { slug: 'fulfillment_unfulfilled', name: 'Unfulfilled', triggerEvent: 'FULFILLMENT_UNFULFILLED', recipientType: 'customer', subject: 'Order #{order_number} Update', content: '<p>Order status updated to Unfulfilled.</p>' },
    { slug: 'fulfillment_fulfilled', name: 'Fulfilled', triggerEvent: 'FULFILLMENT_FULFILLED', recipientType: 'customer', subject: 'Order #{order_number} Fulfilled', content: '<p>Your items have been fulfilled.</p>' },
    { slug: 'fulfillment_partial', name: 'Partially Fulfilled', triggerEvent: 'FULFILLMENT_PARTIALLY_FULFILLED', recipientType: 'customer', subject: 'Items Partially Sent for #{order_number}', content: '<p>Some items have been sent.</p>' },
    { slug: 'fulfillment_returned', name: 'Shipment Returned', triggerEvent: 'FULFILLMENT_RETURNED', recipientType: 'customer', subject: 'Order #{order_number} Returned to Sender', content: '<p>We received your return package.</p>' },

    // --- ADMIN NOTIFICATIONS ---
    { slug: 'admin_new_order', name: 'Admin: New Order', triggerEvent: 'ORDER_CREATED_ADMIN', recipientType: 'admin', subject: '[Admin] New Order #{order_number}', content: '<p>New order received from {customer_name}. Total: {total_amount}</p>' },
    { slug: 'admin_cancelled', name: 'Admin: Order Cancelled', triggerEvent: 'ADMIN_ORDER_CANCELLED', recipientType: 'admin', subject: '[Admin] Order #{order_number} Cancelled', content: '<p>Order #{order_number} was cancelled.</p>' },
    { slug: 'admin_refunded', name: 'Admin: Order Refunded', triggerEvent: 'ADMIN_PAYMENT_REFUNDED', recipientType: 'admin', subject: '[Admin] Refund Issued #{order_number}', content: '<p>A refund was issued for this order.</p>' },
    { slug: 'admin_returned', name: 'Admin: Item Returned', triggerEvent: 'ADMIN_FULFILLMENT_RETURNED', recipientType: 'admin', subject: '[Admin] Return Received #{order_number}', content: '<p>A shipment has been returned.</p>' },
    { slug: 'admin_payment_failed', name: 'Admin: Payment Failed', triggerEvent: 'ADMIN_PAYMENT_FAILED', recipientType: 'admin', subject: '[Admin] Payment Failed for Order #{order_number}', content: '<p>Payment failed for order #{order_number}. Customer: {customer_name}</p>' },

    // --- AFFILIATE SYSTEM (ULTRA UPDATE) ---
    { slug: 'affiliate_welcome', name: 'Affiliate Welcome', triggerEvent: 'AFFILIATE_WELCOME', recipientType: 'customer', subject: 'Welcome to the Affiliate Program', content: '<p>Hi {affiliate_name}, thanks for joining! Your application is currently under review.</p>' },
    { slug: 'affiliate_approved', name: 'Affiliate Approved', triggerEvent: 'AFFILIATE_APPROVED', recipientType: 'customer', subject: 'You are Approved!', content: '<p>Congrats {affiliate_name}! You can now start promoting and earning commissions.</p>' },
    { slug: 'affiliate_rejected', name: 'Affiliate Rejected', triggerEvent: 'AFFILIATE_REJECTED', recipientType: 'customer', subject: 'Affiliate Application Update', content: '<p>Hi {affiliate_name}, unfortunately, your application was not approved. Reason: {rejection_reason}</p>' },
    { slug: 'commission_earned', name: 'Commission Earned', triggerEvent: 'COMMISSION_EARNED', recipientType: 'customer', subject: 'New Commission Earned!', content: '<p>You earned {commission_amount} from Order #{order_number}!</p>' },
    { slug: 'payout_requested', name: 'Payout Requested', triggerEvent: 'PAYOUT_REQUESTED', recipientType: 'admin', subject: '[Admin] New Payout Request', content: '<p>{affiliate_name} requested a payout of {payout_amount}.</p>' },
    { slug: 'payout_processed', name: 'Payout Processed', triggerEvent: 'PAYOUT_PROCESSED', recipientType: 'customer', subject: 'Payout Sent', content: '<p>Hi {affiliate_name}, your payout of {payout_amount} has been processed successfully. Transaction ID: {transaction_id}</p>' },
    { slug: 'payout_rejected', name: 'Payout Rejected', triggerEvent: 'PAYOUT_REJECTED', recipientType: 'customer', subject: 'Payout Request Update', content: '<p>Your payout request for {payout_amount} was rejected. Reason: {rejection_reason}</p>' },
    { slug: 'tier_upgraded', name: 'Tier Upgraded', triggerEvent: 'TIER_UPGRADED', recipientType: 'customer', subject: 'Level Up! You are now {tier_name}', content: '<p>Congratulations! You have been upgraded to the {tier_name} tier. You will now enjoy higher commission rates!</p>' },
    { slug: 'kyc_verified', name: 'KYC Verified', triggerEvent: 'KYC_VERIFIED', recipientType: 'customer', subject: 'Identity Verification Successful', content: '<p>Hi {affiliate_name}, your document ({document_type}) has been verified successfully. You are now eligible for payouts.</p>' },
    { slug: 'kyc_rejected', name: 'KYC Rejected', triggerEvent: 'KYC_REJECTED', recipientType: 'customer', subject: 'Action Required: Identity Verification Failed', content: '<p>Hi {affiliate_name}, your document ({document_type}) was rejected. <br/><strong>Reason:</strong> {rejection_reason}<br/>Please upload a valid document again.</p>' }
];

export async function getEmailTemplates() {
  try {
    const templates = await db.emailTemplate.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, error: "Failed to fetch templates" };
  }
}

export async function syncEmailTemplates() {
    try {
        for (const tmpl of DEFAULT_TEMPLATES) {
            await db.emailTemplate.upsert({
                where: { triggerEvent: tmpl.triggerEvent },
                update: {},
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

        const templates = await db.emailTemplate.findMany({ orderBy: { name: 'asc' } });
        return { success: true, data: templates };

    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false, error: "Failed to sync templates" };
    }
}

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