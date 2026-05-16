//app/track-order/TrackOrderForm.tsx

'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TrackOrderForm() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tracking details not found');
      }
      setBooking(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER FUNCTIONS ---

  const formatText = (text: string) => {
    if (!text) return 'N/A';
    return text.replace(/_/g, ' '); 
  };

  const formatAddress = (addrStr: string) => {
    if (!addrStr) return '';
    return addrStr.replace(/\|/g, ' '); 
  };

  const formatDate = (dateStr: string) => {
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

  const formatMoney = (amount: any) => {
    if (!amount) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };

  const getTrackingColor = (status: string) => {
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
            placeholder="Enter Consignment No (e.g. CPW...)"
            className="w-full flex-1 p-3 border border-[#ccc] rounded-lg focus:outline-none focus:border-[#007bff] text-base"
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
                     <div className="flex flex-col gap-2 items-start">
                        {/* 1. BOOKING STATUS (Fixed from DB) */}
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-black text-white capitalize inline-block">
                           Booking: {formatText(booking.status)}
                        </span>

                        {/* 2. LIVE TRACKING STATUS (From Events) */}
                        {booking.latest_status && (
                           <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize inline-block ${getTrackingColor(booking.latest_status)}`}>
                              Latest: {formatText(booking.latest_status)}
                           </span>
                        )}
                     </div>
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

            {/* --- SECTION 1.5: LIVE TRACKING HISTORY (ALL EVENTS) --- */}
            {booking.tracking_events && booking.tracking_events.length > 0 && (
                <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden p-6">
                    <h3 className="text-lg font-bold text-[#111827] mb-6 border-b pb-2">🚚 Tracking Updates</h3>
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                        {/* REVERSE to show Newest First */}
                        {[...booking.tracking_events].reverse().map((event: any, idx: number) => (
                            <div key={idx} className="relative pl-8">
                                {/* First item (Newest) gets Blue Dot, others Gray */}
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
                    </div>
                </div>
            )}

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
                         {booking.items.map((item: any, idx: number) => (
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