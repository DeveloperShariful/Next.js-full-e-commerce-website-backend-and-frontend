//app/actions/storefront/warranty/warranty-action.ts

'use server';

import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification'; 

type ManualAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
};

type ClaimData = {
  name: string;
  orderNumber?: string;
  shopPurchased: string;
  email: string;
  description: string;
  mediaUrl?: string;
  manualAddress?: ManualAddress;
};

export async function submitWarrantyClaim(data: ClaimData) {
  try {
    const isGoBikeOnline = data.shopPurchased === 'GoBike Australia';

    if (!data.name || !data.email || !data.description) {
      return { success: false, message: 'Missing required fields' };
    }
    if (isGoBikeOnline && !data.orderNumber) {
      return { success: false, message: 'Order number is required for GoBike Australia purchases' };
    }

    let customerPhone = '';
    let customerAddress = '';
    let customerSuburb = '';
    let customerState = '';
    let customerPostcode = '';

    const cleanOrderNumber = data.orderNumber ? data.orderNumber.replace('#', '').trim() : '';

    // For non-GoBike purchases, use the manually entered address
    if (!isGoBikeOnline && data.manualAddress) {
      const m = data.manualAddress;
      customerAddress = [m.address1, m.address2].filter(Boolean).join(', ');
      customerSuburb = m.city;
      customerState = m.state;
      customerPostcode = m.postcode;
      customerPhone = m.phone;
    } else if (cleanOrderNumber) {
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

          if (orderEmail === inputEmail) {
            customerPhone = billingDetails.phone || '';
            const addr1 = shippingDetails.address1 || '';
            const addr2 = shippingDetails.address2 || '';
            customerAddress = `${addr1} ${addr2}`.trim();
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
    const [customerEmailResult, adminEmailResult] = await Promise.allSettled([
      sendNotification({
        trigger: "WARRANTY_CLAIM_CUSTOMER",
        recipient: data.email,
        data: {
          customer_name: data.name,
          order_number:  cleanOrderNumber || 'N/A',
          description:   data.description,
        },
      }),
      sendNotification({
        trigger: "WARRANTY_CLAIM_ADMIN",
        recipient: "",
        data: {
          customer_name:  data.name,
          order_number:   cleanOrderNumber || 'N/A',
          shop_purchased: data.shopPurchased,
          description:    data.description,
          media_urls:     data.mediaUrl,
          claim_id:       newClaim.id,
        },
      }),
    ]);

    if (customerEmailResult.status === 'fulfilled' && !customerEmailResult.value.success) {
      console.error(`[Warranty] Customer email FAILED (claimId: ${newClaim.id}):`, customerEmailResult.value.error);
    }
    if (adminEmailResult.status === 'fulfilled' && !adminEmailResult.value.success) {
      console.error(`[Warranty] Admin email FAILED (claimId: ${newClaim.id}):`, adminEmailResult.value.error);
    }

    return { success: true, message: 'Claim submitted successfully!' };

  } catch (error: any) {
    console.error('Error submitting warranty claim:', error);
    return { success: false, message: 'Internal server error. Please try again.' };
  }
}