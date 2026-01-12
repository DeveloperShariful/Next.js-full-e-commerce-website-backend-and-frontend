// app/api/address-lookup/route.ts

import { NextResponse } from 'next/server';
interface TransdirectLocation {
  locality: string;
  state: string;
  postcode: string;
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  if (!query || query.trim().length < 1) {
    return NextResponse.json(
      { error: 'A search query is required.' },
      { status: 400 } 
    );
  }
  const API_URL = `https://www.transdirect.com.au/api/locations?q=${encodeURIComponent(query)}`;
  try {
    const apiResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }
    });

    if (!apiResponse.ok) {
      throw new Error(`Transdirect API responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    if (!data || !Array.isArray(data.locations) || data.locations.length === 0) {
      return NextResponse.json([]);
    }
    const suggestions = data.locations.map((location: TransdirectLocation) => ({
      value: `${location.locality}, ${location.state} ${location.postcode}`,
      suburb: location.locality,
      postcode: location.postcode,
      state: location.state,
    }));
    return NextResponse.json(suggestions.slice(0, 200));

  } catch (error) {
    console.error('[ADDRESS LOOKUP API ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch address suggestions. Please try again later.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}