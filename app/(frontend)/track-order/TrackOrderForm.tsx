//app/(frontend)/track-order/TrackOrderForm.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { trackOrderAction } from '@/app/actions/frontend/track-order/trackOrderAction';

interface TrackingEvent {
  status?: string;
  description?: string;
  date?: string;
  track_status?: string;
}

interface AddressParty {
  company_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface BookingItem {
  description?: string;
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

interface Booking {
  id: number | string;
  status?: string;
  latest_status?: string;
  connote?: string;
  courier?: string;
  booked_at?: string;
  label?: string;
  order?: { order_number?: string };
  sender?: AddressParty;
  receiver?: AddressParty;
  items?: BookingItem[];
  tracking_events?: TrackingEvent[];
  estimated_delivery_range?: string;
}

export default function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const autoSubmitted = useRef(false);

  const runTrack = async (bookingId: string, pc: string) => {
    if (!bookingId.trim() || !pc.trim()) return;

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const res = await trackOrderAction(bookingId.trim(), pc.trim());
      if (!res.success) {
        throw new Error(res.error || 'Tracking details not found');
      }
      setBooking(res.data as unknown as Booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tracking details not found');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTrack(trackingNumber, postcode);
  };

  // ইমেইলের "Track My Order" বাটন থেকে ?booking=X&postcode=Y নিয়ে এলে
  // ফর্ম নিজে থেকেই ভরে সাথে সাথে ট্র্যাক করে দেয় — customer-কে কিছু টাইপ
  // করতে হয় না, এক ক্লিকেই ফলাফল
  useEffect(() => {
    if (autoSubmitted.current) return;
    const bookingParam = searchParams.get('booking');
    const postcodeParam = searchParams.get('postcode');
    if (bookingParam && postcodeParam) {
      autoSubmitted.current = true;
      setTrackingNumber(bookingParam);
      setPostcode(postcodeParam);
      runTrack(bookingParam, postcodeParam);
    }
  }, [searchParams]);

  // --- HELPER FUNCTIONS ---

  const formatText = (text: string | undefined) => {
    if (!text) return 'N/A';
    return text.replace(/_/g, ' ');
  };

  const formatAddress = (addrStr: string | undefined) => {
    if (!addrStr) return '';
    return addrStr.replace(/\|/g, ' ');
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    // Check if it looks like a full ISO date
    if (dateStr.length > 10) {
        return new Date(dateStr).toLocaleDateString('en-AU', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    }
    return dateStr;
  };

  const getTrackingColor = (status: string | undefined) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('delivered') || s.includes('completed')) return 'bg-green-600 border-green-600 text-white';
    if (s.includes('transit') || s.includes('board') || s.includes('driver')) return 'bg-blue-600 border-blue-600 text-white';
    if (s.includes('picked') || s.includes('collected')) return 'bg-indigo-600 border-indigo-600 text-white';
    if (s.includes('futile') || s.includes('failed')) return 'bg-red-600 border-red-600 text-white';
    return 'bg-gray-600 border-gray-600 text-white';
  };

  return (
    <div className="font-sans text-[#333] leading-[1.7] bg-white min-h-screen">
      <Breadcrumbs />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <h1 className="text-2xl md:text-[32px] font-bold text-center mb-6 md:mb-10 text-[#1a1a1a]">
          Track Your Order
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleTrack} className="max-w-[500px] mx-auto flex flex-col sm:flex-row gap-3 mb-8 md:mb-10">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter your Booking ID (numbers only)"
            inputMode="numeric"
            className="w-full flex-1 p-3 border border-[#ccc] rounded-lg focus:outline-none focus:border-[#007bff] text-base"
            required
          />
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Delivery postcode"
            inputMode="numeric"
            className="w-full sm:w-[160px] p-3 border border-[#ccc] rounded-lg focus:outline-none focus:border-[#007bff] text-base"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-[#007bff] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0056b3] transition disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 -mt-6 mb-8 md:mb-10">
          For your security, we ask for your delivery postcode along with the Booking ID.
        </p>

        {error && (
           <div className="max-w-[600px] mx-auto w-full bg-red-50 border-l-4 border-red-500 p-4 text-red-700 mb-8 rounded text-sm md:text-base">
             {error}
           </div>
        )}
      

        {booking && (
          <div className="animate-fade-in space-y-6">
            
            {/* --- SECTION 1: HEADER & STATUS --- */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
               {/* Top Bar */}
               <div className="bg-[#f9fafb] px-6 py-4 border-b border-[#e5e7eb] flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Booking ID</span>
                    <span className="text-xl font-bold text-[#111827]">#{booking.id}</span>
                  </div>

                  {booking.order?.order_number && (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Order Ref</span>
                        <span className="text-xl font-bold text-[#111827]">#{booking.order.order_number}</span>
                    </div>
                  )}

               </div>
               
               {/* Main Details Grid */}
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                     <div className="text-xs text-[#6b7280] uppercase font-bold mb-2">Current Status</div>
                     {/* একটাই clean badge — sবিস্তারিত ধাপ-ভিত্তিক progress নিচের
                         "Shipment Progress" section-এই দেখানো হচ্ছে, তাই এখানে
                         দুটো আলাদা pill দেখিয়ে ডুপ্লিকেট/messy করার দরকার নেই */}
                     <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize inline-block ${
                        booking.latest_status ? getTrackingColor(booking.latest_status) : 'bg-black text-white'
                     }`}>
                        {formatText(booking.latest_status || booking.status)}
                     </span>
                  </div>
                  <div>
                     <div className="text-xs text-[#6b7280] uppercase font-bold mb-1">Tracking / Connote</div>
                     <div className="text-base font-semibold text-[#007bff] break-words">{booking.connote}</div>
                  </div>
                  <div>
                     <div className="text-xs text-[#6b7280] uppercase font-bold mb-1">Courier</div>
                     <div className="text-base font-medium capitalize">{formatText(booking.courier)}</div>
                  </div>
                  <div>
                     <div className="text-xs text-[#6b7280] uppercase font-bold mb-1">Booked At</div>
                     <div className="text-base font-medium">{formatDate(booking.booked_at)}</div>
                  </div>
               </div>

            </div>

            {/* --- SECTION 1.2: SHIPMENT PROGRESS (সবসময় দেখাবে, real event না থাকলেও) --- */}
            {(() => {
              const STAGES = ['Booking Confirmed', 'Picked Up', 'In Transit', 'Delivered'];
              const latest = (booking.latest_status || '').toLowerCase();
              let currentStage = 0; // 0-indexed
              if (latest.includes('delivered') || latest.includes('completed')) currentStage = 3;
              else if (latest.includes('transit') || latest.includes('board') || latest.includes('driver')) currentStage = 2;
              else if (latest.includes('picked') || latest.includes('collected')) currentStage = 1;
              // event history-ই না থাকলে শুধু "Booking Confirmed" ধাপ পর্যন্তই সত্যি, বাকিটা এখনো অজানা

              return (
                <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-[#111827] mb-6">Shipment Progress</h3>
                  <div className="flex items-start">
                    {STAGES.map((label, idx) => {
                      const done = idx <= currentStage;
                      const isLast = idx === STAGES.length - 1;
                      return (
                        <div key={label} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                          <div className="flex flex-col items-center text-center w-20">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                done ? 'bg-[#007bff] border-[#007bff] text-white' : 'bg-white border-gray-300 text-gray-300'
                              }`}
                            >
                              {done ? '✓' : idx + 1}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${done ? 'text-[#111827]' : 'text-gray-400'}`}>
                              {label}
                            </span>
                          </div>
                          {!isLast && (
                            <div className={`flex-1 h-[3px] mx-1 ${idx < currentStage ? 'bg-[#007bff]' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!booking.tracking_events?.length && (
                    <p className="text-sm text-gray-500 mt-6 text-center">
                      Your order is booked with the courier — pickup and transit updates will appear here once the parcel is on the move.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* --- SECTION 1.5: LIVE TRACKING HISTORY (ALL EVENTS + বাকি PENDING ধাপ) --- */}
            {booking.tracking_events && booking.tracking_events.length > 0 && (() => {
                // এখনো পৌঁছায়নি এমন ধাপগুলো খুঁজে বের করা — কোনো আন্দাজি/fake তারিখ
                // দেওয়া হয় না (আমরা জানিই না ঠিক কবে হবে), শুধু "Pending" লেখা থাকে
                const STAGE_DEFS: Array<{ label: string; match: (s: string) => boolean }> = [
                    { label: 'Picked Up', match: (s) => s.includes('picked') || s.includes('collected') },
                    { label: 'In Transit', match: (s) => s.includes('transit') },
                    { label: 'Onboard for Delivery', match: (s) => s.includes('board') || s.includes('driver') },
                    { label: 'Delivered', match: (s) => s.includes('delivered') || s.includes('completed') },
                ];
                const reached = new Set<string>();
                (booking.tracking_events as TrackingEvent[]).forEach((e) => {
                    const s = (e.status || '').toLowerCase();
                    STAGE_DEFS.forEach((stage) => { if (stage.match(s)) reached.add(stage.label); });
                });
                const pendingStages = STAGE_DEFS.filter((stage) => !reached.has(stage.label));

                return (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden p-6">
                        <h3 className="text-lg font-bold text-[#111827] mb-6 border-b pb-2">🚚 Tracking Updates</h3>
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                            {/* আসল ঘটে যাওয়া event — Newest First */}
                            {[...booking.tracking_events].reverse().map((event: TrackingEvent, idx: number) => (
                                <div key={`real-${idx}`} className="relative pl-8">
                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                        <div>
                                            <p className="text-sm font-bold text-[#1a1a1a]">{event.status}</p>
                                            <p className="text-sm text-gray-600">{event.description}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono mt-1 sm:mt-0 bg-gray-50 px-2 py-1 rounded">
                                            {event.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {/* এখনো না-হওয়া বাকি ধাপ — greyed out, honest "Pending" label।
                                শুধু "Delivered"-এ, যদি হিসাব করা যায়, একটা স্পষ্ট
                                "Estimated" (Transdirect-এর real তারিখ না, আমাদের
                                courier-quoted transit-time থেকে হিসাব করা) দেখানো হয়। */}
                            {pendingStages.map((stage) => (
                                <div key={`pending-${stage.label}`} className="relative pl-8 opacity-50">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-gray-300"></div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                        <div>
                                            <p className="text-sm font-bold text-[#1a1a1a]">{stage.label}</p>
                                            <p className="text-sm text-gray-500">Not yet reached</p>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono mt-1 sm:mt-0 bg-gray-50 px-2 py-1 rounded">
                                            {stage.label === 'Delivered' && booking.estimated_delivery_range
                                                ? `Estimated: ${booking.estimated_delivery_range}`
                                                : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* --- SECTION 3: ADDRESSES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* SENDER */}
               <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-[#111827] mb-4 border-b pb-2">📦 Sender</h3>
                  <div className="space-y-3 text-sm text-[#374151] flex-1">
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Name</span>
                        <span className="font-semibold text-base">{booking.sender?.company_name || booking.sender?.name}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Email</span>
                        <span className="break-all">{booking.sender?.email}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Phone</span>
                        <span>{booking.sender?.phone}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Address</span>
                        <div>
                            <span className="block font-medium">{formatAddress(booking.sender?.address)}</span>
                            <span className="block">
                                {booking.sender?.suburb}, {booking.sender?.state} {booking.sender?.postcode}
                            </span>
                             <span className="block text-xs text-gray-400">{booking.sender?.country}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* RECEIVER */}
               <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-[#111827] mb-4 border-b pb-2">📍 Receiver</h3>
                  <div className="space-y-3 text-sm text-[#374151] flex-1">
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Name</span>
                        <span className="font-semibold text-base">{booking.receiver?.company_name || booking.receiver?.name}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Email</span>
                        <span className="break-all">{booking.receiver?.email}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Phone</span>
                        <span>{booking.receiver?.phone}</span>
                     </div>
                     <div className="grid grid-cols-[80px_1fr]">
                        <span className="text-xs font-bold text-[#6b7280] uppercase pt-1">Address</span>
                        <div>
                            <span className="block font-medium">{formatAddress(booking.receiver?.address)}</span>
                            <span className="block">
                                {booking.receiver?.suburb}, {booking.receiver?.state} {booking.receiver?.postcode}
                            </span>
                            <span className="block text-xs text-gray-400">{booking.receiver?.country}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* --- SECTION 4: ITEMS --- */}
            {booking.items && booking.items.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
                 <div className="bg-[#f9fafb] px-6 py-4 border-b border-[#e5e7eb] flex justify-center">
                    <h3 className="text-lg font-bold text-[#111827]">📦 Items</h3>
                    
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                         <tr>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Qty</th>
                            <th className="px-6 py-3">Weight</th>
                            <th className="px-6 py-3">Dimensions (L x W x H)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                         {booking.items.map((item: BookingItem, idx: number) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                                {item.description || 'Carton'}
                              </td>
                              <td className="px-6 py-4">{item.quantity}</td>
                              <td className="px-6 py-4 font-bold">{item.weight} kg</td>
                              <td className="px-6 py-4">
                                {item.length} x {item.width} x {item.height} cm
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
              </div>
            )}

            {/* --- SECTION 5: FOOTER ACTIONS --- */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-5">
                {booking.label && (
                      <a 
                        href={booking.label} 
                        target="_blank" 
                        className="bg-[#1a1a1a] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#333] transition flex items-center gap-2"
                      >
                        📄 Download Label
                      </a>
                )}
                <a 
                  href={`https://www.transdirect.com.au/track/?tn=${booking.connote}`}
                  target="_blank" 
                  className="border border-[#ccc] text-[#555] px-6 py-3 rounded-lg font-bold hover:bg-[#f5f5f5] transition"
                >
                  Verify on Transdirect ↗
                </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}