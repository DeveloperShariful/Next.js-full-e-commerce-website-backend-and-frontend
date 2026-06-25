// app/actions/storefront/warranty/warranty-action.ts

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

    // ✅ ১. আসল নাম তৈরি: অফলাইন হলে Address-এর ফার্স্ট নেম + লাস্ট নেম মিলে আসল নাম হবে
    let finalCustomerName = data.name;
    if (!isGoBikeOnline && data.manualAddress) {
      finalCustomerName = `${data.manualAddress.firstName} ${data.manualAddress.lastName}`.trim();
    }

    // ✅ ২. বেসিক ভ্যালিডেশন
    if (!finalCustomerName || !data.email || !data.description) {
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

    // ✅ ৩. অফলাইন হলে ম্যানুয়াল অ্যাড্রেস বসবে, অনলাইন হলে ডাটাবেজ থেকে খুঁজবে
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
        // LOCAL PRISMA QUERY (শুধুমাত্র Order Number চেক করবে)
        // =================================================================
        const orderRecord = await db.order.findUnique({
          where: { orderNumber: cleanOrderNumber }
        });

        if (orderRecord) {
          // অর্ডার পাওয়া গেছে! ইমেইল চেক করার দরকার নেই, সরাসরি ডাটাবেজ থেকে ঠিকানা নিয়ে নেবে।
          const billingDetails = typeof orderRecord.billingAddress === 'string' ? JSON.parse(orderRecord.billingAddress) : orderRecord.billingAddress || {};
          const shippingDetails = typeof orderRecord.shippingAddress === 'string' ? JSON.parse(orderRecord.shippingAddress) : orderRecord.shippingAddress || {};

          customerPhone = billingDetails.phone || '';
          const addr1 = shippingDetails.address1 || '';
          const addr2 = shippingDetails.address2 || '';
          customerAddress = `${addr1} ${addr2}`.trim();
          customerSuburb = shippingDetails.city || '';
          customerState = shippingDetails.state || '';
          customerPostcode = shippingDetails.postcode || '';
          
        } else {
          console.log(`Order ${cleanOrderNumber} not found in database.`);
          // ✅ আপডেট: অর্ডার নাম্বার না পেলে সাবমিট আটকে দেবে এবং এরর দেখাবে
          if (isGoBikeOnline) {
            return { success: false, message: 'Invalid Order Number. We could not find this order in our system.' };
          }
        }
      } catch (error) {
        console.error("Database query error during claim submission:", error);
      }
    }

    // ✅ ৪. Save claim natively in the Prisma Database
    const newClaim = await db.warrantyClaim.create({
      data: {
        name: finalCustomerName, 
        orderNumber: cleanOrderNumber || "N/A", // ✅ TypeScript Error ফিক্স: ফাঁকা থাকলে "N/A" যাবে
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
          customer_name: finalCustomerName, 
          order_number:  cleanOrderNumber || 'N/A', 
          description:   data.description,
        },
      }),
      sendNotification({
        trigger: "WARRANTY_CLAIM_ADMIN",
        recipient: "",
        data: {
          customer_name:  finalCustomerName, 
          order_number:   cleanOrderNumber || 'N/A',
          shop_purchased: data.shopPurchased,
          description:    data.description,
          media_urls:     data.mediaUrl,
          claim_id:       newClaim.id,
        },
      }),
    ]);

    // ✅ ৫. ইমেইল ফেইল লগিং
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