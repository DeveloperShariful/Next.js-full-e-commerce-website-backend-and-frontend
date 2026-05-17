//app/(backend)/action/shipping/transdirect-action.ts

// app/actions/admin/warranty/transdirect-action.ts

'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

    // Default Dimensions if not set in product
    const weight = partData.weight || 0.5;
    const length = partData.length || 10;
    const width = partData.width || 10;
    const height = partData.height || 10;

    // Build Transdirect Draft Booking Payload
    const payload = {
      declared_value: 0,
      sender: {
        address: config.senderAddress || "123 Default St",
        company_name: config.senderCompany || "GoBike Australia",
        email: config.email || "support@gobike.au",
        name: config.senderName || "GoBike Dispatch",
        postcode: config.senderPostcode || "2000",
        phone: config.senderPhone || "0400000000",
        state: config.senderState || "NSW",
        suburb: config.senderSuburb || "Sydney",
        type: config.senderType || "business",
        country: "AU"
      },
      receiver: {
        // Just providing basic location for accurate quotes
        address: "TBA", 
        company_name: "",
        email: "customer@example.com",
        name: "Customer",
        postcode: postcode,
        phone: "0400000000",
        state: "", // Transdirect API can auto-detect state from postcode
        suburb: suburb,
        type: "residential",
        country: "AU"
      },
      items: [
        {
          weight: weight,
          height: height,
          width: width,
          length: length,
          quantity: 1,
          description: partData.name || "Replacement Part"
        }
      ]
    };

    // Call Transdirect API
    const response = await fetch(TRANSDIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey
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

  } catch (error) {
    console.error("Transdirect getQuotes Action Error:", error);
    return { success: false, message: 'Internal Server Error. Please check system logs.' };
  }
}

// ============================================================================
// ২. CONFIRM BOOKING & GENERATE LABEL ACTION
// ============================================================================
export async function confirmTransdirectBooking(formData: FormData) {
  try {
    const claimId = formData.get('claimId') as string;
    const tempBookingId = formData.get('tempBookingId') as string;
    const selectedCourier = formData.get('selectedCourier') as string;
    const address = formData.get('address') as string;
    const suburb = formData.get('suburb') as string;
    const postcode = formData.get('postcode') as string;
    const partName = formData.get('partName') as string;

    if (!claimId || !tempBookingId || !selectedCourier || !address || !suburb || !postcode) {
      return { success: false, message: 'Missing required booking details.' };
    }

    // Fetch Claim to get Customer's real Name, Phone, and Email
    const claim = await db.warrantyClaim.findUnique({ where: { id: claimId } });
    if (!claim) return { success: false, message: 'Claim not found.' };

    // 🛑 FIX: `shippingProvider` এর বদলে নতুন স্কিমার `TransdirectConfig` ব্যবহার করা হচ্ছে
    const config = await db.transdirectConfig.findUnique({
      where: { id: "transdirect_config" }
    });

    if (!config || !config.isEnabled || !config.apiKey) {
      return { success: false, message: 'Transdirect is not configured or disabled.' };
    }

    // Step 1: UPDATE the Draft Booking with the REAL receiver address
    const updatePayload = {
      courier: selectedCourier,
      receiver: {
        address: address,
        company_name: "",
        email: claim.email,
        name: claim.name,
        postcode: postcode,
        phone: claim.phone || "0400000000",
        state: "", // Will auto-detect
        suburb: suburb,
        type: "residential",
        country: "AU"
      }
    };

    const updateResponse = await fetch(`${TRANSDIRECT_API_URL}/${tempBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey
      },
      body: JSON.stringify(updatePayload)
    });

    if (!updateResponse.ok) {
      const errData = await updateResponse.json();
      console.error("Transdirect Update Error:", errData);
      return { success: false, message: 'Failed to update receiver details on Transdirect.' };
    }

    // Step 2: CONFIRM the Booking
    const confirmResponse = await fetch(`${TRANSDIRECT_API_URL}/${tempBookingId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey
      }
    });

    const confirmData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      console.error("Transdirect Confirm Error:", confirmData);
      return { success: false, message: confirmData.message || 'Failed to confirm booking.' };
    }

    // Step 3: SAVE data to Prisma Database (WarrantyClaim Model)
    await db.warrantyClaim.update({
      where: { id: claimId },
      data: {
        trackingNumber: confirmData.connote || tempBookingId.toString(),
        replacementPart: partName,
        // Update database with the confirmed shipping location
        address: address,
        suburb: suburb,
        postcode: postcode
      }
    });

    // Revalidate UI so the tracking number block appears
    revalidatePath(`/admin/warranty-claims/${claimId}`);

    return { 
      success: true, 
      message: 'Booking confirmed successfully! Label generated.' 
    };

  } catch (error) {
    console.error("Transdirect confirmBooking Action Error:", error);
    return { success: false, message: 'Internal Server Error while confirming booking.' };
  }
}