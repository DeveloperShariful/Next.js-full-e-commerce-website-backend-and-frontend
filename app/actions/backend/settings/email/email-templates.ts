// File: //app/actions/backend/settings/email/email-templates.ts

"use server";

import { db } from "@/lib/prisma";

const DEFAULT_TEMPLATES = [
    // ==========================================
    // --- ORDER & PAYMENT ---
    // ==========================================
    { 
        slug: 'order_pending', 
        name: 'Order Pending', 
        triggerEvent: 'ORDER_PENDING', 
        recipientType: 'customer', 
        subject: 'Action Required: Your GoBike Order #{order_number} is Pending', 
        content: '<p>Hi {customer_name},</p><p>Thank you for choosing GoBike Australia! Your order <strong>#{order_number}</strong> has been successfully placed but is currently awaiting payment.</p><p>To ensure quick delivery of your items, please complete your payment at your earliest convenience. If you have already paid, please ignore this email.</p><p>If you need any help with your payment, feel free to reply to this email.</p>' 
    },
    { 
        slug: 'order_processing', 
        name: 'Order Processing', 
        triggerEvent: 'ORDER_PROCESSING', 
        recipientType: 'customer', 
        subject: 'Great news! We are processing your Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>We have successfully received your payment for order <strong>#{order_number}</strong>! 🎉</p><p>Our warehouse team has already started processing your order. We will send you another update with tracking information as soon as your package is dispatched.</p><p>Thank you for shopping with GoBike Australia.</p>' 
    },
    { 
        slug: 'order_packed', 
        name: 'Order Packed', 
        triggerEvent: 'ORDER_PACKED', 
        recipientType: 'customer', 
        subject: 'Your Order #{order_number} is Packed and Ready!', 
        content: '<p>Hi {customer_name},</p><p>Exciting news! Your order <strong>#{order_number}</strong> has been securely packed by our team and is now waiting to be picked up by the courier.</p><p>You will receive a shipping confirmation email with your tracking details very soon.</p>' 
    },
    { 
        slug: 'order_shipped', 
        name: 'Order Shipped', 
        triggerEvent: 'ORDER_SHIPPED', 
        recipientType: 'customer', 
        subject: 'It’s on the way! Your GoBike Order #{order_number} has shipped 🚚', 
        content: '<p>Hi {customer_name},</p><p>Your wait is almost over! Your order <strong>#{order_number}</strong> has left our warehouse and is currently on its way to you via <strong>{courier}</strong>.</p><p><strong>Tracking Number:</strong> {tracking_number}</p><p>Please note that it may take up to 24 hours for the tracking link to activate on the courier\'s website.</p>' 
    },
    { 
        slug: 'order_delivered', 
        name: 'Order Delivered', 
        triggerEvent: 'ORDER_DELIVERED', 
        recipientType: 'customer', 
        subject: 'Delivered: Your GoBike Order #{order_number} has arrived!', 
        content: '<p>Hi {customer_name},</p><p>Fantastic news! Your order <strong>#{order_number}</strong> has been marked as delivered.</p><p>We hope you and your little one absolutely love the new GoBike gear. If you have a moment, we’d love to hear your feedback on our website.</p><p>If there are any issues with your delivery, please let us know immediately by replying to this email.</p>' 
    },
    { 
        slug: 'order_cancelled', 
        name: 'Order Cancelled', 
        triggerEvent: 'ORDER_CANCELLED', 
        recipientType: 'customer', 
        subject: 'Update: Your Order #{order_number} has been cancelled', 
        content: '<p>Hi {customer_name},</p><p>We are writing to confirm that your order <strong>#{order_number}</strong> has been cancelled as per your request or due to payment timeout.</p><p>If this was a mistake or you would like to place a new order, please visit our website again. We’d love to welcome you back!</p>' 
    },
    { 
        slug: 'order_status_refunded', 
        name: 'Order Status: Refunded', 
        triggerEvent: 'ORDER_REFUNDED_STATUS', 
        recipientType: 'customer', 
        subject: 'Order #{order_number} Marked as Refunded', 
        content: '<p>Hi {customer_name},</p><p>The status of your order <strong>#{order_number}</strong> has been updated to Refunded. The funds should appear in your original payment method within a few business days depending on your bank.</p>' 
    },

    { 
        slug: 'payment_paid', 
        name: 'Payment Received', 
        triggerEvent: 'PAYMENT_PAID', 
        recipientType: 'customer', 
        subject: 'Payment Received for Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>This is a confirmation that we have successfully received your payment of <strong>{total_amount}</strong> for order #{order_number}.</p><p>Your order is now being prepared for shipment.</p>' 
    },
    { 
        slug: 'payment_unpaid', 
        name: 'Payment Pending', 
        triggerEvent: 'PAYMENT_UNPAID', 
        recipientType: 'customer', 
        subject: 'Payment Reminder for Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>We noticed that the payment for your order #{order_number} is still pending. Please complete the payment so we can dispatch your items as soon as possible.</p>' 
    },
    { 
        slug: 'payment_refunded', 
        name: 'Full Refund Issued', 
        triggerEvent: 'PAYMENT_REFUNDED', 
        recipientType: 'customer', 
        subject: 'Refund Processed for Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>We have successfully processed a full refund for your order #{order_number}.</p><p>Please allow 3-5 business days for the funds to reflect in your account.</p>' 
    },
    { 
        slug: 'payment_partially_refunded', 
        name: 'Partial Refund', 
        triggerEvent: 'PAYMENT_PARTIALLY_REFUNDED', 
        recipientType: 'customer', 
        subject: 'Partial Refund for Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>A partial refund has been issued for your order #{order_number}. This might be due to an out-of-stock item or a special adjustment.</p>' 
    },
    { 
        slug: 'payment_failed', 
        name: 'Payment Failed', 
        triggerEvent: 'PAYMENT_FAILED', 
        recipientType: 'customer', 
        subject: 'Payment Failed for Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>Unfortunately, the payment for your order #{order_number} could not be processed successfully. Your card has not been charged.</p><p>Please try placing the order again using a different payment method.</p>' 
    },

    { 
        slug: 'fulfillment_unfulfilled', 
        name: 'Unfulfilled', 
        triggerEvent: 'FULFILLMENT_UNFULFILLED', 
        recipientType: 'customer', 
        subject: 'Order #{order_number} Update', 
        content: '<p>Hi {customer_name},</p><p>Your order status has been updated to Unfulfilled.</p>' 
    },
    { 
        slug: 'fulfillment_fulfilled', 
        name: 'Fulfilled', 
        triggerEvent: 'FULFILLMENT_FULFILLED', 
        recipientType: 'customer', 
        subject: 'Order #{order_number} is Fulfilled', 
        content: '<p>Hi {customer_name},</p><p>All items in your order #{order_number} have now been successfully fulfilled and packed.</p>' 
    },
    { 
        slug: 'fulfillment_partial', 
        name: 'Partially Fulfilled', 
        triggerEvent: 'FULFILLMENT_PARTIALLY_FULFILLED', 
        recipientType: 'customer', 
        subject: 'Items Partially Sent for #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>Some items from your order #{order_number} have been processed and sent. The remaining items will follow shortly.</p>' 
    },
    { 
        slug: 'fulfillment_returned', 
        name: 'Shipment Returned', 
        triggerEvent: 'FULFILLMENT_RETURNED', 
        recipientType: 'customer', 
        subject: 'Order #{order_number} Returned to Sender', 
        content: '<p>Hi {customer_name},</p><p>We have received the returned package for order #{order_number}. Our team will inspect the items and process your refund/exchange shortly.</p>' 
    },

    // =================================================================
    // --- ADMIN NOTIFICATIONS ---
    // =================================================================
    { 
        slug: 'admin_new_order', 
        name: 'Admin: New Order', 
        triggerEvent: 'ORDER_CREATED_ADMIN', 
        recipientType: 'admin', 
        subject: '[New Order] #{order_number} - {customer_name}', 
        content: '<p>A new order has been placed on your store.</p><p><strong>Customer:</strong> {customer_name}<br/><strong>Total:</strong> {total_amount}<br/><strong>Payment Method:</strong> {payment_method}</p>' 
    },
    { 
        slug: 'admin_cancelled', 
        name: 'Admin: Order Cancelled', 
        triggerEvent: 'ADMIN_ORDER_CANCELLED', 
        recipientType: 'admin', 
        subject: '[Cancelled] Order #{order_number}', 
        content: '<p>Order #{order_number} has been cancelled by the system or customer.</p>' 
    },
    { 
        slug: 'admin_refunded', 
        name: 'Admin: Order Refunded', 
        triggerEvent: 'ADMIN_PAYMENT_REFUNDED', 
        recipientType: 'admin', 
        subject: '[Refunded] Order #{order_number}', 
        content: '<p>A refund has been issued successfully for order #{order_number}.</p>' 
    },
    { 
        slug: 'admin_returned', 
        name: 'Admin: Item Returned', 
        triggerEvent: 'ADMIN_FULFILLMENT_RETURNED', 
        recipientType: 'admin', 
        subject: '[Returned] Package received for #{order_number}', 
        content: '<p>A shipment has been returned to the warehouse for order #{order_number}.</p>' 
    },
    { 
        slug: 'admin_payment_failed', 
        name: 'Admin: Payment Failed', 
        triggerEvent: 'ADMIN_PAYMENT_FAILED', 
        recipientType: 'admin', 
        subject: '[Payment Failed] Order #{order_number}', 
        content: '<p>A customer attempted to pay for order #{order_number} but the transaction failed. Customer: {customer_name}</p>' 
    },

    // =================================================================
    // --- AFFILIATE SYSTEM ---
    // =================================================================
    { 
        slug: 'affiliate_welcome', 
        name: 'Affiliate Welcome', 
        triggerEvent: 'AFFILIATE_WELCOME', 
        recipientType: 'customer', 
        subject: 'Welcome to the GoBike Affiliate Program!', 
        content: '<p>Hi {affiliate_name},</p><p>Thank you for applying to the GoBike Australia Affiliate Program! Your application is currently under review by our team.</p><p>We will notify you via email as soon as your account is approved.</p>' 
    },
    { 
        slug: 'affiliate_approved', 
        name: 'Affiliate Approved', 
        triggerEvent: 'AFFILIATE_APPROVED', 
        recipientType: 'customer', 
        subject: 'Congratulations! You are an Approved Affiliate 🎉', 
        content: '<p>Hi {affiliate_name},</p><p>Great news! Your affiliate account has been approved. You can now log into your dashboard, grab your unique referral links, and start earning commissions by promoting GoBike.</p>' 
    },
    { 
        slug: 'affiliate_rejected', 
        name: 'Affiliate Rejected', 
        triggerEvent: 'AFFILIATE_REJECTED', 
        recipientType: 'customer', 
        subject: 'Update on your Affiliate Application', 
        content: '<p>Hi {affiliate_name},</p><p>Thank you for your interest in our Affiliate Program. Unfortunately, we are unable to approve your application at this time.</p><p>Reason: {rejection_reason}</p>' 
    },
    { 
        slug: 'referral_pending', 
        name: 'New Referral Pending', 
        triggerEvent: 'REFERRAL_PENDING', 
        recipientType: 'customer', 
        subject: 'Cha-ching! New Commission Pending 💰', 
        content: '<p>Hi {affiliate_name},</p><p>Great news! You have generated a new sale (Order #{order_number}). A pending commission of <strong>{commission_amount}</strong> has been recorded.</p><p>This will be available for payout after our standard holding period of {holding_period} days.</p>' 
    },
    { 
        slug: 'commission_earned', 
        name: 'Commission Approved', 
        triggerEvent: 'COMMISSION_APPROVED', 
        recipientType: 'customer', 
        subject: 'Commission Approved!', 
        content: '<p>Hi {affiliate_name},</p><p>Your pending commission of <strong>{amount}</strong> from Order #{order_id} has now been fully approved and added to your payable balance.</p>' 
    },
    { 
        slug: 'payout_requested', 
        name: 'Payout Requested', 
        triggerEvent: 'PAYOUT_REQUESTED', 
        recipientType: 'admin', 
        subject: '[Admin] New Payout Request - {affiliate_name}', 
        content: '<p>Affiliate <strong>{affiliate_name}</strong> has requested a payout of <strong>{payout_amount}</strong>.</p><p>Please review the request in the admin dashboard.</p>' 
    },
    { 
        slug: 'payout_processed', 
        name: 'Payout Processed', 
        triggerEvent: 'PAYOUT_PROCESSED', 
        recipientType: 'customer', 
        subject: 'Your Payout has been sent!', 
        content: '<p>Hi {affiliate_name},</p><p>Your payout request for <strong>{payout_amount}</strong> has been processed successfully and sent to your account.</p><p>Transaction ID: {transaction_id}</p><p>Keep up the great work!</p>' 
    },
    { 
        slug: 'payout_rejected', 
        name: 'Payout Rejected', 
        triggerEvent: 'PAYOUT_REJECTED', 
        recipientType: 'customer', 
        subject: 'Action Required: Payout Request Denied', 
        content: '<p>Hi {affiliate_name},</p><p>Your recent payout request for {payout_amount} was rejected.</p><p>Reason: {rejection_reason}</p><p>Please contact support for more details.</p>' 
    },
    { 
        slug: 'tier_upgraded', 
        name: 'Tier Upgraded', 
        triggerEvent: 'TIER_UPGRADED', 
        recipientType: 'customer', 
        subject: 'Level Up! You are now a {tier_name} Affiliate 🚀', 
        content: '<p>Hi {affiliate_name},</p><p>Congratulations! Based on your outstanding performance, you have been upgraded to the <strong>{tier_name}</strong> tier.</p><p>You will now enjoy higher commission rates on all future referrals!</p>' 
    },
    { 
        slug: 'kyc_verified', 
        name: 'KYC Verified', 
        triggerEvent: 'KYC_VERIFIED', 
        recipientType: 'customer', 
        subject: 'Identity Verification Successful', 
        content: '<p>Hi {affiliate_name},</p><p>Your identity document ({document_type}) has been verified successfully. Your account is now fully active and eligible for payouts.</p>' 
    },
    { 
        slug: 'kyc_rejected', 
        name: 'KYC Rejected', 
        triggerEvent: 'KYC_REJECTED', 
        recipientType: 'customer', 
        subject: 'Action Required: Identity Verification Failed', 
        content: '<p>Hi {affiliate_name},</p><p>Unfortunately, your uploaded document ({document_type}) was rejected.</p><p><strong>Reason:</strong> {rejection_reason}</p><p>Please log into your dashboard and upload a clear, valid document again.</p>' 
    },
    { 
        slug: 'fraud_alert', 
        name: 'Admin: Fraud Alert', 
        triggerEvent: 'FRAUD_ALERT_ADMIN', 
        recipientType: 'admin', 
        subject: '[FRAUD ALERT] Suspicious Affiliate Activity', 
        content: '<p>System has flagged affiliate <strong>{affiliate_name}</strong> for suspicious behavior.</p><p><strong>Flag Reason:</strong> {fraud_reason}<br/><strong>Risk Score:</strong> {risk_score}</p><p>Please review this account immediately.</p>' 
    },

    // =================================================================
    // --- WARRANTY CLAIMS ---
    // =================================================================
    { 
        slug: 'warranty_claim_customer', 
        name: 'Warranty Claim Received', 
        triggerEvent: 'WARRANTY_CLAIM_CUSTOMER', 
        recipientType: 'customer', 
        subject: 'Warranty Claim Received - Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>Thanks for reaching out to us. We have successfully received your warranty claim for order #{order_number}.</p><p>Our technical team is reviewing your video and description. We will get back to you within 24-48 hours with an update or a tracking number for your replacement parts.</p><p><strong>Your Issue Description:</strong><br/>{description}</p>' 
    },
    { 
        slug: 'warranty_claim_admin', 
        name: 'Admin: New Warranty Claim', 
        triggerEvent: 'WARRANTY_CLAIM_ADMIN', 
        recipientType: 'admin', 
        subject: '[Admin] New Warranty Claim for Order #{order_number}', 
        content: '<p>A new warranty claim has been submitted by {customer_name}.</p><p><strong>Order Number:</strong> #{order_number}<br/><strong>Shop:</strong> {shop_purchased}</p><p><strong>Customer Description:</strong><br/>{description}</p>' 
    },
    { 
        slug: 'warranty_approved', 
        name: 'Warranty Claim Approved', 
        triggerEvent: 'WARRANTY_CLAIM_APPROVED', 
        recipientType: 'customer', 
        subject: 'Great news! Your Warranty Claim is Approved - Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>Good news! Your warranty claim for order #{order_number} has been approved.</p><p>We are now preparing your replacement part: <strong>{replacement_part}</strong>. You will receive another email with tracking details once it has been shipped.</p>' 
    },
    { 
        slug: 'warranty_rejected', 
        name: 'Warranty Claim Rejected', 
        triggerEvent: 'WARRANTY_CLAIM_REJECTED', 
        recipientType: 'customer', 
        subject: 'Update on your Warranty Claim - Order #{order_number}', 
        content: '<p>Hi {customer_name},</p><p>We have reviewed your warranty claim for order #{order_number}. Unfortunately, your claim has been declined at this moment.</p><p>If you have any questions or need further assistance, please reply to this email.</p>' 
    },
    { 
        slug: 'warranty_shipped', 
        name: 'Warranty Part Shipped', 
        triggerEvent: 'WARRANTY_PART_SHIPPED', 
        recipientType: 'customer', 
        subject: 'Your Replacement Part is on the way! Tracking: {tracking_number}', 
        content: '<p>Hi {customer_name},</p><p>Your replacement part (<strong>{replacement_part}</strong>) for order #{order_number} has been shipped via {courier}.</p><p><strong>Tracking Number:</strong> {tracking_number}</p><p>Please note that tracking might take 12-24 hours to update on the courier website.</p>' 
    },
    { 
        slug: 'admin_warranty_shipped', 
        name: 'Admin: Part Shipped', 
        triggerEvent: 'ADMIN_WARRANTY_SHIPPED', 
        recipientType: 'admin', 
        subject: '[Admin] Replacement Part Shipped for Order #{order_number}', 
        content: '<p>A replacement part (<strong>{replacement_part}</strong>) has been shipped for Warranty Claim #{order_number}.</p><p><strong>Courier:</strong> {courier}<br/><strong>Tracking Number:</strong> {tracking_number}</p>' 
    },

    // =================================================================
    // --- AUTH, ACCOUNTS & NEWSLETTER ---
    // =================================================================
    { 
        slug: 'password_reset', 
        name: 'Password Reset', 
        triggerEvent: 'PASSWORD_RESET', 
        recipientType: 'customer', 
        subject: 'Password Reset Request for your Account', 
        content: '<p>Hi {customer_name},</p><p>Someone has requested a password reset for your account.</p><p>If this was a mistake, just ignore this email and your password will remain unchanged.</p><p>To reset your password, click the button below or visit the following link:</p>' 
    },
    { 
        slug: 'newsletter_subscription', 
        name: 'Newsletter Welcome', 
        triggerEvent: 'NEWSLETTER_SUBSCRIPTION', 
        recipientType: 'customer', 
        subject: 'Welcome to the GoBike Community! 🎉', 
        content: '<p>Hi {customer_name},</p><p>Thank you for subscribing to our newsletter! We are thrilled to have you on board.</p><p>From now on, you will be the first to know about our latest products, exclusive discounts, and exciting news.</p><p>As a welcome gift, use the code <strong>WELCOME10</strong> at checkout to get 10% off your first purchase!</p><p>Happy Riding!</p>' 
    },

    // =======================================================================
    // 🛑 NEW: CONTACT FORM SUBMISSION
    // =======================================================================
    { 
        slug: 'contact_form_customer', 
        name: 'Contact Auto-Responder', 
        triggerEvent: 'CONTACT_FORM_CUSTOMER', 
        recipientType: 'customer', 
        subject: 'We have received your message!', 
        content: '<p>Hi {customer_name},</p><p>Thank you for reaching out to GoBike Australia. This is an automated email to let you know that we have successfully received your message.</p><p>Our support team will review your inquiry and get back to you within 24-48 business hours.</p><p>For your records, here is a copy of your message:</p><div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px; color: #555;">{message}</div><p>Best regards,<br/>The GoBike Team</p>' 
    },
    { 
        slug: 'contact_form_submission', 
        name: 'Admin: New Contact Message', 
        triggerEvent: 'CONTACT_FORM_SUBMISSION', 
        recipientType: 'admin', 
        subject: '[New Contact Message] from {customer_name}', 
        content: '<p>You have received a new message from the website contact form.</p><p><strong>Name:</strong> {customer_name}<br/><strong>Email:</strong> {customer_email}<br/><strong>Phone:</strong> {customer_phone}</p><div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 15px;"><strong>Message:</strong><br/><br/>{message}</div>' 
    }
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