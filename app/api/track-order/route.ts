// app/api/track-order/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { trackingNumber } = await request.json();

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }
    const cleanTrackingNum = trackingNumber.trim();

    const email = process.env.TRANSDIRECT_EMAIL;
    const password = process.env.TRANSDIRECT_PASSWORD;

    if (!email || !password) {
      return NextResponse.json({ error: 'Server config error: Credentials missing' }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`;
    
    const url = `https://www.transdirect.com.au/api/bookings/v4?q=${encodeURIComponent(cleanTrackingNum)}`;
    
    console.log(`🔍 Searching for: ${cleanTrackingNum}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const data = await response.json();
    const bookings = data.bookings || data;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No booking found.' }, { status: 404 });
    }

    const exactMatch = bookings.find((b: any) => 
        (b.connote && b.connote.toLowerCase() === cleanTrackingNum.toLowerCase()) || 
        (b.id && b.id.toString() === cleanTrackingNum)
    );

    if (!exactMatch) {
      console.log("❌ Partial match found but exact match failed.");
      return NextResponse.json({ error: 'Please enter the full correct tracking number.' }, { status: 404 });
    }

    console.log(`✅ Exact Match Found: ID ${exactMatch.id}`);

    try {
        if (exactMatch.connote) {
            console.log(`🚚 Fetching live events for Connote: ${exactMatch.connote}`);
            const trackUrl = `https://www.transdirect.com.au/api/bookings/v4/track/${exactMatch.connote}`;
            
            const trackResponse = await fetch(trackUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                },
                cache: 'no-store'
            });

            if (trackResponse.ok) {
                const trackData = await trackResponse.json();
              
                const events = Object.values(trackData)[0];

                if (Array.isArray(events) && events.length > 0) {
                    exactMatch.tracking_events = events;
                    const latestEvent = events[events.length - 1];
                    
                    exactMatch.latest_status = latestEvent.status; 
                    exactMatch.latest_description = latestEvent.description;
                    exactMatch.latest_event_date = latestEvent.date;
                }
            }
        }
    } catch (trackError) {
        console.error("⚠️ Tracking API fetch failed, sending booking info only.", trackError);
    }

    return NextResponse.json(exactMatch);

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}