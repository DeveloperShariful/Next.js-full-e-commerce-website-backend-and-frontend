//app/(backend)/action/shipping/transdirect-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendNotification } from '@/app/api/email/send-notification';

// Transdirect V4 API Base URL
const TRANSDIRECT_API_URL = 'https://www.transdirect.com.au/api/bookings/v4';

// ============================================================================
// ১. GET QUOTES ACTION (Live Rates Fetcher)
// ============================================================================
export async function getTransdirectQuotes(formData: FormData) {
  try {
    const claimId = formData.get('claimId') as string;
    const suburb = formData.get('suburb') as string;
    const postcode = formData.get('postcode') as string;
    const partDataRaw = formData.get('partData') as string;

    if (!claimId || !suburb || !postcode || !partDataRaw) {
      return { success: false, message: 'Missing required location or product data.' };
    }

    const partData = JSON.parse(partDataRaw);

    // 🛑 FIX: `shippingProvider` এর বদলে নতুন স্কিমার `TransdirectConfig` ব্যবহার করা হচ্ছে
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.isEnabled || !config.apiKey) {
      return { success: false, message: 'Transdirect is not configured or disabled in Settings.' };
    }

    // Dimensions — prefer custom override, then product data, then safe defaults
    const customWeight = formData.get('customWeight');
    const customLength = formData.get('customLength');
    const customWidth  = formData.get('customWidth');
    const customHeight = formData.get('customHeight');

    const weight = Number(customWeight || partData.weight) > 0 ? Number(customWeight || partData.weight) : 1;
    const length = Number(customLength || partData.length) > 0 ? Number(customLength || partData.length) : 10;
    const width  = Number(customWidth  || partData.width)  > 0 ? Number(customWidth  || partData.width)  : 10;
    const height = Number(customHeight || partData.height) > 0 ? Number(customHeight || partData.height) : 10;

    // Build Transdirect Draft Booking Payload (minimal — matches working resync format)
    const payload = {
      declared_value: "0.00",
      sender: {
        postcode: config.senderPostcode || "2000",
        suburb:   (config.senderSuburb  || "Sydney").trim().toUpperCase(),
        type:     config.senderType     || "business",
        country:  "AU",
      },
      receiver: {
        postcode: postcode.trim(),
        suburb:   suburb.trim().toUpperCase(),
        type:     "residential",
        country:  "AU",
      },
      items: [
        {
          weight,
          height,
          width,
          length,
          quantity: 1,
          description: "carton",
        }
      ]
    };

    // Call Transdirect API
    const response = await fetch(TRANSDIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Transdirect API Error (Quotes):", data);
      return { success: false, message: data.message || 'Failed to fetch quotes from Transdirect.' };
    }

    // Map quotes for the frontend
    const formattedQuotes = data.quotes ? Object.keys(data.quotes).map(courier => ({
      courier: courier,
      name: courier.replace(/_/g, ' ').toUpperCase(),
      total: data.quotes[courier].total,
      transitTime: data.quotes[courier].transit_time || 'TBA',
    })).sort((a, b) => parseFloat(a.total) - parseFloat(b.total)) : [];

    return { 
      success: true, 
      quotes: formattedQuotes, 
      tempBookingId: data.id // This is required for confirmation later
    };

  } catch (error: unknown) {
    console.error("Transdirect getQuotes Action Error:", error);
    return { success: false, message: 'Internal Server Error. Please check system logs.' };
  }
}

// ============================================================================
// ২. CONFIRM BOOKING & GENERATE LABEL ACTION
// ============================================================================
export async function confirmTransdirectBooking(formData: FormData) {
  try {
    const claimId        = formData.get('claimId') as string;
    const tempBookingId  = formData.get('tempBookingId') as string;
    const selectedCourier = formData.get('selectedCourier') as string;
    const address        = formData.get('address') as string;
    const suburb         = formData.get('suburb') as string;
    const postcode       = formData.get('postcode') as string;
    const state          = formData.get('state') as string;
    const partName       = formData.get('partName') as string;

    if (!claimId || !tempBookingId || !selectedCourier || !suburb || !postcode) {
      return { success: false, message: 'Missing required booking details.' };
    }

    const [claim, config] = await Promise.all([
      db.warrantyClaim.findUnique({ where: { id: claimId } }),
      db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } }),
    ]);

    if (!claim)  return { success: false, message: 'Claim not found.' };
    if (!config || !config.isEnabled || !config.apiKey) {
      return { success: false, message: 'Transdirect is not configured or disabled.' };
    }

    const phone = (claim.phone || "0400000000").replace(/\s/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `WC-${claimId.slice(-6).toUpperCase()}-${randomSuffix}`;

    // POST to /api/orders — same endpoint used by the working order resync
    const payload = {
      transdirect_order_id: parseInt(tempBookingId, 10),
      order_id:             orderId,
      goods_summary:        partName || 'Replacement Part',
      goods_dump:           partName || 'Replacement Part',
      imported_from:        'WarrantyClaim',
      purchased_time:       new Date().toISOString(),
      sale_price:           0,
      selected_courier:     selectedCourier,
      courier_price:        0,
      paid_time:            new Date().toISOString(),
      buyer_name:           claim.name,
      buyer_email:          claim.email,
      delivery: {
        name:     claim.name,
        email:    claim.email,
        phone,
        address:  address || '1 Main St',
        suburb:   suburb.trim().toUpperCase(),
        postcode: postcode.trim(),
        state:    state || '',
        country:  'AU',
      },
    };

    console.log('[Warranty TD] Confirm payload:', JSON.stringify(payload, null, 2));

    const confirmResponse = await fetch('https://www.transdirect.com.au/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
        'Accept':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const confirmData = await confirmResponse.json();
    console.log('[Warranty TD] Confirm response:', JSON.stringify(confirmData, null, 2));

    if (!confirmResponse.ok) {
      const errMsg = Array.isArray(confirmData.errors)
        ? confirmData.errors.join(', ')
        : (confirmData.message || 'Failed to confirm booking.');
      console.error("Transdirect Confirm Error:", confirmData);
      return { success: false, message: errMsg };
    }

    // Save confirmed booking to DB
    await db.warrantyClaim.update({
      where: { id: claimId },
      data: {
        trackingNumber:  confirmData.connote || String(confirmData.id) || orderId,
        replacementPart: partName,
        address,
        suburb,
        postcode,
        state: state || claim.state,
      },
    });

    const trackingNumber = confirmData.connote || String(confirmData.id) || orderId;
    const courierName = selectedCourier.replace(/_/g, ' ').toUpperCase();

    // Customer: "Your replacement part is on the way"
    // Admin: "Part shipped for warranty claim"
    await Promise.allSettled([
      sendNotification({
        trigger: 'WARRANTY_PART_SHIPPED',
        recipient: claim.email,
        data: {
          customer_name:    claim.name,
          order_number:     claim.orderNumber,
          replacement_part: partName,
          tracking_number:  trackingNumber,
          courier:          courierName,
        },
      }),
      sendNotification({
        trigger: 'ADMIN_WARRANTY_SHIPPED',
        recipient: '',
        data: {
          customer_name:    claim.name,
          order_number:     claim.orderNumber,
          replacement_part: partName,
          tracking_number:  trackingNumber,
          courier:          courierName,
        },
      }),
    ]);

    revalidatePath(`/admin/warranty-claims/${claimId}`);

    return { success: true, message: 'Booking confirmed! Label has been generated.' };

  } catch (error: unknown) {
    console.error("Transdirect confirmBooking Action Error:", error);
    return { success: false, message: 'Internal Server Error while confirming booking.' };
  }
}