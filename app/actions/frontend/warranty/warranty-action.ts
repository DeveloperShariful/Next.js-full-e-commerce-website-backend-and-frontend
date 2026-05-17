//app/actions/storefront/warranty/warranty-action.ts

'use server';

import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification'; 

type ClaimData = {
  name: string;
  orderNumber: string;
  shopPurchased: string;
  email: string;
  description: string;
  mediaUrl?: string;
  customAddress?: string; 
};

export async function submitWarrantyClaim(data: ClaimData) {
  try {
    if (!data.name || !data.orderNumber || !data.email || !data.description) {
      return { success: false, message: 'Missing required fields' };
    }

    let customerPhone = '';
    let customerAddress = data.customAddress || ''; 
    let customerSuburb = '';
    let customerState = '';
    let customerPostcode = '';

    const cleanOrderNumber = data.orderNumber.replace('#', '').trim();

    try {
      // =================================================================
      // LOCAL PRISMA QUERY (Blazing Fast & Secure)
      // =================================================================
      const orderRecord = await db.order.findUnique({
        where: { orderNumber: cleanOrderNumber }
      });

      if (orderRecord) {
        const billingDetails = typeof orderRecord.billingAddress === 'string' ? JSON.parse(orderRecord.billingAddress) : orderRecord.billingAddress || {};
        const shippingDetails = typeof orderRecord.shippingAddress === 'string' ? JSON.parse(orderRecord.shippingAddress) : orderRecord.shippingAddress || {};

        const orderEmail = billingDetails.email?.toLowerCase() || '';
        const inputEmail = data.email.toLowerCase();

        // Validate if the input email matches the one on the order
        if (orderEmail === inputEmail) {
          customerPhone = billingDetails.phone || '';
          
          if (!data.customAddress) {
              const addr1 = shippingDetails.address1 || '';
              const addr2 = shippingDetails.address2 || '';
              customerAddress = `${addr1} ${addr2}`.trim();
          }
          
          customerSuburb = shippingDetails.city || '';
          customerState = shippingDetails.state || '';
          customerPostcode = shippingDetails.postcode || '';
        } else {
          console.log(`Email mismatch for order ${cleanOrderNumber}. Expected ${orderEmail}, got ${inputEmail}`);
        }
      } else {
         console.log(`Order ${cleanOrderNumber} not found in database.`);
      }
    } catch (error) {
      console.error("Database query error during claim submission:", error);
    }

    // Save claim natively in the Prisma Database
    const newClaim = await db.warrantyClaim.create({
      data: {
        name: data.name,
        orderNumber: cleanOrderNumber,
        shopPurchased: data.shopPurchased,
        email: data.email,
        description: data.description,
        mediaUrl: data.mediaUrl || null,
        status: 'PENDING',
        phone: customerPhone,
        address: customerAddress, 
        suburb: customerSuburb,
        state: customerState,
        postcode: customerPostcode,
        country: 'AU'
      },
    });

    // =================================================================
    // EMAIL NOTIFICATION LOGIC (Queue System)
    // =================================================================
    try {
        // 1. Send Email to Customer
        await sendNotification({
            trigger: "WARRANTY_CLAIM_CUSTOMER",
            recipient: data.email,
            data: { 
                customer_name: data.name, 
                order_number: cleanOrderNumber,
                description: data.description
            }
        });

        // 2. Send Email to Admin
        await sendNotification({
            trigger: "WARRANTY_CLAIM_ADMIN",
            recipient: "", // Empty string routes to global Admin Email based on new EmailConfig schema
            data: { 
                customer_name: data.name, 
                order_number: cleanOrderNumber,
                shop_purchased: data.shopPurchased,
                description: data.description,
                media_urls: data.mediaUrl,
                claim_id: newClaim.id 
            }
        });
    } catch (emailError) {
        console.error("Failed to queue warranty emails:", emailError);
    }

    return { success: true, message: 'Claim submitted successfully!' };

  } catch (error: any) {
    console.error('Error submitting warranty claim:', error);
    return { success: false, message: 'Internal server error. Please try again.' };
  }
}