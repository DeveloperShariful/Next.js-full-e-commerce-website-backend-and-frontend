//app/(backend)/admin/warranty-claims/[id]/TransdirectClientBox.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getTransdirectQuotes, confirmTransdirectBooking } from '@/app/(backend)/action/settings/shipping/transdirect-action';
import Image from 'next/image';

export default function TransdirectClientBox({ 
  claimId, 
  status, 
  trackingNumber, 
  replacementPart, 
  spareParts, 
  customerAddress,
  customerSuburb, 
  customerPostcode, 
  customerState 
}: { 
  claimId: string, 
  status: string, 
  trackingNumber: string | null, 
  replacementPart: string | null, 
  spareParts: any[], 
  customerAddress: string | null,
  customerSuburb: string | null, 
  customerPostcode: string | null, 
  customerState: string | null 
}) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  
  // Professional Address States
  const [address, setAddress] = useState(customerAddress || '');
  const [suburb, setSuburb] = useState(customerSuburb || '');
  const [postcode, setPostcode] = useState(customerPostcode || '');
  const [state, setState] = useState(customerState || 'NSW');

  // --- NEW: Props থেকে আসা ভ্যালুগুলো যদি পরে চেঞ্জ হয়, তবে State আপডেট করে নেওয়া ---
  useEffect(() => {
    if (customerAddress) setAddress(customerAddress);
    if (customerSuburb) setSuburb(customerSuburb);
    if (customerPostcode) setPostcode(customerPostcode);
    if (customerState) setState(customerState);
  }, [customerAddress, customerSuburb, customerPostcode, customerState]);

  // --- Auto Suggestion States ---
  const [searchInput, setSearchInput] = useState(''); 
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  const suggestionRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quotes & Booking States
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tempBookingId, setTempBookingId] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ADDRESS LOOKUP LOGIC ---
  const handleLocationSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value); 
    setSuburb(value); 
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const res = await fetch(`/api/address-lookup?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Address lookup failed", error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchInput(suggestion.suburb); 
    setSuburb(suggestion.suburb);
    setPostcode(suggestion.postcode);
    setState(suggestion.state);
    setShowSuggestions(false);
  };

  // --- AUTO FETCH QUOTES LOGIC ---
  const fetchLiveQuotes = async (part: any) => {
    if (!suburb || !postcode) {
      toast.error("Please provide at least Suburb and Postcode to get live rates.");
      return;
    }

    setLoadingQuotes(true);
    setApiError(null);
    setQuotes([]); 

    const formData = new FormData();
    formData.append('claimId', claimId);
    
    formData.append('suburb', suburb);
    formData.append('postcode', postcode);

    const partData = JSON.stringify({ 
      name: part.name, 
      weight: part.weight, 
      length: part.length, 
      width: part.width, 
      height: part.height 
    });
    formData.append('partData', partData);

    const result = await getTransdirectQuotes(formData);
    
    if (result.success && result.quotes) {
      setQuotes(result.quotes);
      setTempBookingId(result.tempBookingId || null);
      if (result.quotes.length > 0) {
        setSelectedCourier(result.quotes[0].courier); 
      }
    } else {
      setApiError(result.message || "Failed to fetch quotes. Please check your settings.");
      toast.error(result.message || "Failed to fetch quotes.");
    }
    
    setLoadingQuotes(false);
  };

  const handleProductSelect = (part: any) => {
    setSelectedPart(part);
    setIsOpen(false);
    fetchLiveQuotes(part); 
  };

  const handleRefreshQuotes = () => {
    if (selectedPart) fetchLiveQuotes(selectedPart);
    else toast.error("Please select a product first.");
  };

  // --- FINAL BOOKING LOGIC ---
  const handleConfirmBooking = async () => {
    if (!selectedCourier || !tempBookingId) return toast.error("Please select a courier.");
    if (!address || !suburb || !postcode) return toast.error("Receiver address is incomplete.");

    setLoadingBooking(true);
    const formData = new FormData();
    formData.append('claimId', claimId);
    formData.append('partName', selectedPart.name);
    formData.append('tempBookingId', tempBookingId);
    formData.append('selectedCourier', selectedCourier);
    
    formData.append('address', address);
    formData.append('suburb', suburb);
    formData.append('postcode', postcode);

    const result = await confirmTransdirectBooking(formData);
    
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    
    setLoadingBooking(false);
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm">
      <h2 className="px-4 py-3 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7] flex items-center gap-2">
        <span className="text-[#2271b1]">🚚</span> Transdirect Shipping
      </h2>
      
      <div className="p-5 text-[13px] text-[#3c434a]">
        
        {trackingNumber ? (
          <div className="bg-[#f0f6fc] border border-[#c3c4c7] p-6 rounded text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p className="font-bold text-[#1d2327] text-[16px] mb-2">Label Created Successfully</p>
            <p className="text-[#50575e] mb-4 text-[14px]">Replacement Part: <strong>{replacementPart}</strong></p>
            <div className="bg-white border-2 border-dashed border-[#8c8f94] py-3 px-4 inline-block rounded font-mono text-[16px] font-bold text-[#2271b1] tracking-widest shadow-sm">
              {trackingNumber}
            </div>
          </div>
        ) : (
          
          <div className="space-y-6">
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                <label className="font-bold text-[#1d2327]">1. Verify Receiver Address</label>
                <button type="button" onClick={handleRefreshQuotes} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Refresh Quotes
                </button>
              </div>
              
              <div className="grid grid-cols-12 gap-3 relative">
                <div className="col-span-12">
                  <span className="text-[11px] text-gray-500 block mb-1">Street Address</span>
                  <input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full border border-[#8c8f94] rounded px-2.5 py-1.5 outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" placeholder="e.g. 52 Bligh Ave" />
                </div>
                
                <div className="col-span-12 md:col-span-6 relative" ref={suggestionRef}>
                  <span className="text-[11px] text-gray-500 block mb-1">Search Suburb or Postcode</span>
                  <input 
                    type="text" 
                    required 
                    value={searchInput || suburb} 
                    onChange={handleLocationSearch} 
                    className="w-full border border-[#8c8f94] rounded px-2.5 py-1.5 outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" 
                    placeholder="e.g. Sydney or 2000" 
                  />
                  {isSearchingAddress && <div className="absolute right-2 top-8 text-[10px] text-blue-500">Searching...</div>}
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-[100] w-[150%] left-0 top-14 bg-white border border-[#c3c4c7] shadow-xl max-h-[250px] overflow-y-auto rounded-md">
                      {suggestions.map((s, idx) => (
                        <li 
                          key={idx} 
                          onClick={() => handleSuggestionSelect(s)}
                          className="px-4 py-2 text-[13px] text-[#3c434a] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-gray-100 last:border-0 transition-colors flex justify-between"
                        >
                          <span><strong>{s.suburb}</strong>, {s.state}</span>
                          <span className="text-gray-400 font-mono">{s.postcode}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="col-span-6 md:col-span-3">
                  <span className="text-[11px] text-gray-500 block mb-1">State</span>
                  <input type="text" value={state} onChange={e=>setState(e.target.value)} className="w-full border border-[#8c8f94] rounded px-2.5 py-1.5 outline-none bg-gray-100" readOnly />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <span className="text-[11px] text-gray-500 block mb-1">Postcode</span>
                  <input type="text" required value={postcode} onChange={e=>setPostcode(e.target.value)} className="w-full border border-[#8c8f94] rounded px-2.5 py-1.5 outline-none bg-gray-100" readOnly />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1d2327] mb-2">2. Select Replacement Part:</label>
              <div className="relative" ref={dropdownRef}>
                <div 
                  onClick={() => { if (!loadingQuotes && status !== 'TRASHED' && status !== 'REJECTED') setIsOpen(!isOpen) }}
                  className={`w-full border border-[#8c8f94] rounded text-[13px] px-3 py-2 bg-white flex items-center justify-between cursor-pointer ${(loadingQuotes || status === 'TRASHED' || status === 'REJECTED') ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-[#2271b1] shadow-sm'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {selectedPart ? (
                      <>
                        {selectedPart.image?.sourceUrl ? <Image src={selectedPart.image.sourceUrl} alt="Part" width={24} height={24} className="rounded object-cover border border-gray-200" /> : <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-[10px]">📦</div>}
                        <span className="truncate pr-4 font-semibold">{selectedPart.name}</span>
                      </>
                    ) : <span className="text-gray-500">Search and select a product...</span>}
                  </div>
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                {isOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#c3c4c7] rounded shadow-lg max-h-[300px] overflow-y-auto">
                    {spareParts.length === 0 ? (
                      <div className="p-4 text-gray-500 italic text-center">No products found</div>
                    ) : (
                      <ul className="py-1">
                        {spareParts.map((part) => (
                          <li 
                            key={part.id}
                            onClick={() => handleProductSelect(part)}
                            className="px-3 py-2.5 hover:bg-[#f0f6fc] cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            {part.image?.sourceUrl ? <Image src={part.image.sourceUrl} alt="Part" width={36} height={36} className="rounded border border-gray-200 object-cover flex-shrink-0" /> : <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[14px] flex-shrink-0">📦</div>}
                            <div className="flex flex-col overflow-hidden">
                               <span className="text-[13px] font-bold text-[#1d2327] truncate">{part.name}</span>
                               <span className="text-[11px] text-gray-500 mt-0.5">Weight: {part.weight || '0.5'}kg</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#f6f7f7] border border-[#c3c4c7] rounded-lg p-4 min-h-[120px] flex flex-col justify-center">
              
              {loadingQuotes ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-4">
                  <svg className="animate-spin h-6 w-6 text-[#2271b1] mb-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span className="text-[13px] font-semibold text-[#2271b1]">Fetching live rates from Transdirect...</span>
                </div>
              ) : apiError ? (
                <div className="text-red-600 text-[12px] bg-red-50 p-3 rounded border border-red-200 text-center">
                  <span className="block font-bold mb-1">⚠️ Connection Error</span>
                  {apiError}
                </div>
              ) : quotes.length > 0 ? (
                <div className="animate-fade-in">
                  <p className="font-bold text-[#1d2327] mb-3 text-[13px] border-b border-gray-200 pb-2">3. Available Shipping Options</p>
                  <div className="space-y-2 mb-5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {quotes.map((quote, index) => (
                      <label 
                        key={index} 
                        className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-all ${selectedCourier === quote.courier ? 'border-[#2271b1] bg-white shadow-sm ring-1 ring-[#2271b1]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="courier" 
                            value={quote.courier} 
                            checked={selectedCourier === quote.courier}
                            onChange={() => setSelectedCourier(quote.courier)}
                            className="text-[#2271b1] focus:ring-[#2271b1] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[#1d2327] text-[13px]">{quote.name}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">Estimated Transit: {quote.transitTime}</p>
                          </div>
                        </div>
                        <div className="font-extrabold text-[#2271b1] text-[15px]">
                          ${parseFloat(quote.total).toFixed(2)}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleConfirmBooking} 
                    disabled={loadingBooking || !selectedCourier} 
                    className="w-full bg-[#2271b1] text-white px-4 py-3 font-bold text-[14px] rounded shadow-sm hover:bg-[#135e96] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {loadingBooking ? (
                      <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing Booking...</>
                    ) : 'Confirm Booking & Create Label'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  <p className="text-[13px]">Select a product to see live shipping rates.</p>
                </div>
              )}
              
            </div>
          </div>
        )}

      </div>
    </div>
  );
}