//app/(backend)/admin/warranty-claims/[id]/TransdirectClientBox.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { getTransdirectQuotes, confirmTransdirectBooking } from '@/app/actions/backend/warranty/transdirect-action';
import Image from 'next/image';

interface SparePart {
  id: string;
  databaseId: string | null;
  name: string;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  image?: { sourceUrl: string };
}

interface AddressSuggestion {
  suburb: string;
  state: string;
  postcode: string;
}

interface ShippingQuote {
  courier: string;
  name: string;
  total: string;
  transitTime: string;
}

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
  spareParts: SparePart[],
  customerAddress: string | null,
  customerSuburb: string | null,
  customerPostcode: string | null,
  customerState: string | null
}) {

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isRebooking, setIsRebooking] = useState(false);
  
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  const suggestionRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quotes & Booking States
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tempBookingId, setTempBookingId] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Custom Package Dimensions
  const [useCustomDims, setUseCustomDims] = useState(false);
  const [customWeight, setCustomWeight] = useState('');
  const [customLength, setCustomLength] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [packageNote, setPackageNote] = useState('');

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
    } catch (error: unknown) {
      console.error("Address lookup failed", error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setSearchInput(suggestion.suburb); 
    setSuburb(suggestion.suburb);
    setPostcode(suggestion.postcode);
    setState(suggestion.state);
    setShowSuggestions(false);
  };

  // --- AUTO FETCH QUOTES LOGIC ---
  const fetchLiveQuotes = async (part: SparePart) => {
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
      height: part.height,
    });
    formData.append('partData', partData);

    // Pass custom dimensions if override is active
    if (useCustomDims) {
      if (customWeight) formData.append('customWeight', customWeight);
      if (customLength) formData.append('customLength', customLength);
      if (customWidth)  formData.append('customWidth', customWidth);
      if (customHeight) formData.append('customHeight', customHeight);
    }

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

  const handleProductSelect = (part: SparePart) => {
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
    if (!selectedPart) return toast.error("Please select a replacement part.");

    setLoadingBooking(true);
    const formData = new FormData();
    formData.append('claimId', claimId);
    formData.append('partName', selectedPart.name);
    formData.append('tempBookingId', tempBookingId);
    formData.append('selectedCourier', selectedCourier);
    formData.append('address', address);
    formData.append('suburb', suburb);
    formData.append('postcode', postcode);
    formData.append('state', state);

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
      
      <div className="p-1 text-[13px] text-[#3c434a]">
        
        {trackingNumber && !isRebooking ? (
          <div className="bg-[#f0f6fc] border border-[#c3c4c7] p-6 rounded text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p className="font-bold text-[#1d2327] text-[16px] mb-2">Label Created Successfully</p>
            <p className="text-[#50575e] mb-4 text-[14px]">Replacement Part: <strong>{replacementPart}</strong></p>
            <div className="bg-white border-2 border-dashed border-[#8c8f94] py-3 px-4 inline-block rounded font-mono text-[16px] font-bold text-[#2271b1] tracking-widest shadow-sm">
              {trackingNumber}
            </div>
            <div className="mt-5 pt-4 border-t border-[#c3c4c7]">
              <button
                type="button"
                onClick={() => {
                  setIsRebooking(true);
                  setSelectedPart(null);
                  setQuotes([]);
                  setApiError(null);
                  setTempBookingId(null);
                  setSelectedCourier(null);
                  setUseCustomDims(false);
                  setCustomWeight('');
                  setCustomLength('');
                  setCustomWidth('');
                  setCustomHeight('');
                }}
                className="inline-flex items-center gap-2 border border-[#2271b1] text-[#2271b1] text-[13px] font-semibold px-4 py-2 rounded hover:bg-[#2271b1] hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Resend / Create New Label
              </button>
            </div>
          </div>
        ) : (

          <div className="space-y-4">

            {/* ── STEP 1: ADDRESS ── */}
            <div className="rounded-lg border border-[#c3c4c7] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f6fc] border-b border-[#c3c4c7]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2271b1] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span className="text-[13px] font-semibold text-[#1d2327]">Verify Receiver Address</span>
                </div>
                <button type="button" onClick={handleRefreshQuotes} className="flex items-center gap-1 text-[#2271b1] hover:text-[#135e96] text-[12px] font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Refresh
                </button>
              </div>

              <div className="p-4 bg-white grid grid-cols-12 gap-3 relative">
                <div className="col-span-12">
                  <label className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide block mb-1">Street Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#1d2327] outline-none focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 transition-all placeholder:text-[#8c8f94]"
                    placeholder="e.g. 52 Bligh Ave" />
                </div>

                <div className="col-span-12 md:col-span-6 relative" ref={suggestionRef}>
                  <label className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide block mb-1">Suburb / Postcode</label>
                  <input type="text" required value={searchInput || suburb} onChange={handleLocationSearch}
                    className="w-full border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#1d2327] outline-none focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 transition-all placeholder:text-[#8c8f94]"
                    placeholder="e.g. Sydney or 2000" />
                  {isSearchingAddress && (
                    <div className="absolute right-3 top-[2.1rem] text-[11px] text-[#2271b1] flex items-center gap-1">
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Searching...
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-[100] w-full left-0 top-[4rem] bg-white border border-[#c3c4c7] shadow-xl rounded-lg overflow-hidden">
                      {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => handleSuggestionSelect(s)}
                          className="px-4 py-2.5 text-[13px] text-[#3c434a] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0 transition-colors flex justify-between items-center">
                          <span><strong>{s.suburb}</strong>, {s.state}</span>
                          <span className="text-[12px] font-mono opacity-70">{s.postcode}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="col-span-6 md:col-span-3">
                  <label className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide block mb-1">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} readOnly
                    className="w-full border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#3c434a] bg-[#f6f7f7] outline-none font-semibold" />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide block mb-1">Postcode</label>
                  <input type="text" required value={postcode} onChange={e => setPostcode(e.target.value)} readOnly
                    className="w-full border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#3c434a] bg-[#f6f7f7] outline-none font-semibold" />
                </div>
              </div>
            </div>

            {/* ── STEP 2: PART SELECTOR ── */}
            <div className="rounded-lg border border-[#c3c4c7] overflow-visible">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#f0f6fc] border-b border-[#c3c4c7]/60">
                <span className="w-5 h-5 rounded-full bg-[#2271b1] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-[13px] font-semibold text-[#1d2327]">Select Replacement Part</span>
              </div>
              <div className="p-3 bg-white">
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => { if (!loadingQuotes && status !== 'TRASHED' && status !== 'REJECTED') setIsOpen(!isOpen); }}
                    className={`w-full border rounded-md text-[13px] px-3 py-2.5 bg-white flex items-center justify-between cursor-pointer transition-all
                      ${(loadingQuotes || status === 'TRASHED' || status === 'REJECTED') ? 'opacity-50 cursor-not-allowed bg-[#f6f7f7] border-[#c3c4c7]' : 'border-[#c3c4c7] hover:border-[#2271b1] hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {selectedPart ? (
                        <>
                          {selectedPart.image?.sourceUrl
                            ? <Image src={selectedPart.image.sourceUrl} alt="Part" width={26} height={26} className="rounded-md object-cover border border-[#c3c4c7] flex-shrink-0" />
                            : <div className="w-6 h-6 bg-[#f0f6fc] rounded-md flex items-center justify-center text-[12px] border border-[#c3c4c7] flex-shrink-0">📦</div>}
                          <span className="font-semibold text-[#1d2327] truncate">{selectedPart.name}</span>
                          <span className="text-[11px] text-[#50575e] bg-[#f0f0f1] px-1.5 py-0.5 rounded flex-shrink-0">{selectedPart.weight}kg</span>
                        </>
                      ) : <span className="text-[#8c8f94]">Search and select a replacement part...</span>}
                    </div>
                    <svg className={`w-4 h-4 text-[#50575e] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>

                  {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#c3c4c7] rounded-lg shadow-xl max-h-[280px] overflow-y-auto">
                      {spareParts.length === 0
                        ? <div className="p-4 text-[#50575e] italic text-center text-[13px]">No spare parts found</div>
                        : <ul className="py-1">
                          {spareParts.map((part) => (
                            <li key={part.id} onClick={() => handleProductSelect(part)}
                              className="px-3 py-2.5 hover:bg-[#f0f6fc] cursor-pointer flex items-center gap-3 border-b border-[#f0f0f1] last:border-0 transition-colors">
                              {part.image?.sourceUrl
                                ? <Image src={part.image.sourceUrl} alt="Part" width={36} height={36} className="rounded-md border border-[#c3c4c7] object-cover flex-shrink-0" />
                                : <div className="w-9 h-9 bg-[#f0f6fc] border border-[#c3c4c7] rounded-md flex items-center justify-center text-[14px] flex-shrink-0">📦</div>}
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[13px] font-semibold text-[#1d2327] truncate">{part.name}</span>
                                <span className="text-[11px] text-[#50575e] mt-0.5">{part.weight || '0.5'} kg</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── STEP 3: CUSTOM DIMENSIONS (accordion) ── */}
            <div className="rounded-lg border border-[#c3c4c7] overflow-hidden">
              <button type="button" onClick={() => setUseCustomDims(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#f0f6fc] hover:bg-[#e8f0fa] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2271b1] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <span className="text-[13px] font-semibold text-[#1d2327]">Custom Package Dimensions</span>
                  {useCustomDims && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <svg className={`w-4 h-4 text-[#50575e] transition-transform ${useCustomDims ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </button>

              {useCustomDims && (
                <div className="p-4 border-t border-[#c3c4c7] bg-white">
                  <p className="text-[12px] text-[#50575e] mb-3">Leave blank to use the product&apos;s saved dimensions.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Weight (kg)', val: customWeight, set: setCustomWeight, step: '0.1', min: '0.1', ph: selectedPart ? `${selectedPart.weight || 1} kg` : '1.5' },
                      { label: 'Length (cm)', val: customLength, set: setCustomLength, step: '1', min: '1', ph: selectedPart ? `${selectedPart.length || 10} cm` : '30' },
                      { label: 'Width (cm)',  val: customWidth,  set: setCustomWidth,  step: '1', min: '1', ph: selectedPart ? `${selectedPart.width  || 10} cm` : '20' },
                      { label: 'Height (cm)', val: customHeight, set: setCustomHeight, step: '1', min: '1', ph: selectedPart ? `${selectedPart.height || 10} cm` : '15' },
                    ].map(({ label, val, set, step, min, ph }) => (
                      <div key={label}>
                        <label className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide block mb-1">{label}</label>
                        <input type="number" step={step} min={min} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                          className="w-full border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#1d2327] outline-none focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 transition-all placeholder:text-[#8c8f94]" />
                      </div>
                    ))}
                  </div>
                  <input type="text" value={packageNote} onChange={e => setPackageNote(e.target.value)} placeholder="Package note (optional)"
                    className="w-full mt-3 border border-[#c3c4c7] rounded-md px-3 py-2 text-[13px] text-[#1d2327] outline-none focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 transition-all placeholder:text-[#8c8f94]" />
                  {selectedPart && (
                    <button type="button" onClick={handleRefreshQuotes}
                      className="mt-3 w-full border border-[#2271b1] text-[#2271b1] text-[12px] font-semibold py-2 rounded-md hover:bg-[#2271b1] hover:text-white transition-colors">
                      Re-fetch Quotes with These Dimensions
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── STEP 4: SHIPPING QUOTES ── */}
            <div className="rounded-lg border border-[#c3c4c7] overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#f0f6fc] border-b border-[#c3c4c7]/60">
                <span className="w-5 h-5 rounded-full bg-[#2271b1] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                <span className="text-[13px] font-semibold text-[#1d2327]">Available Shipping Options</span>
              </div>

              <div className="bg-white p-3">
                {loadingQuotes ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <svg className="animate-spin h-7 w-7 text-[#2271b1]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="text-[13px] font-medium text-[#2271b1]">Fetching live rates…</span>
                  </div>
                ) : apiError ? (
                  <div className="m-1 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                    <div>
                      <p className="text-[12px] font-bold text-red-700 mb-0.5">Connection Error</p>
                      <p className="text-[12px] text-red-600">{apiError}</p>
                    </div>
                  </div>
                ) : quotes.length > 0 ? (
                  <div className="space-y-2">
                    {quotes.map((quote, index) => {
                      const isSelected = selectedCourier === quote.courier;
                      const isBest = index === 0;
                      return (
                        <label key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${isSelected
                              ? 'border-[#2271b1] bg-[#f0f6fc] shadow-sm'
                              : 'border-[#e2e4e7] bg-white hover:border-[#2271b1]/40 hover:bg-[#f8fafc]'}`}
                        >
                          <input type="radio" name="courier" value={quote.courier}
                            checked={isSelected} onChange={() => setSelectedCourier(quote.courier)}
                            className="w-4 h-4 accent-[#2271b1] flex-shrink-0 cursor-pointer" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-[#135e96]' : 'text-[#1d2327]'}`}>
                                {quote.name}
                              </span>
                              {isBest && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  Best Price
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#50575e] mt-0.5">
                              <svg className="w-3 h-3 inline mr-0.5 mb-0.5 text-[#8c8f94]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {quote.transitTime}
                            </p>
                          </div>

                          <div className={`text-right flex-shrink-0 ${isSelected ? 'text-[#135e96]' : 'text-[#1d2327]'}`}>
                            <span className="text-[16px] font-extrabold">${parseFloat(quote.total).toFixed(2)}</span>
                          </div>
                        </label>
                      );
                    })}

                    <button type="button" onClick={handleConfirmBooking}
                      disabled={loadingBooking || !selectedCourier}
                      className="mt-3 w-full bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-3 font-bold text-[14px] rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                      {loadingBooking ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          Processing Booking…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          Confirm Booking &amp; Create Label
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-[#8c8f94]">
                    <svg className="w-10 h-10 mb-2 text-[#c3c4c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    <p className="text-[13px]">Select a part above to see live rates.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}