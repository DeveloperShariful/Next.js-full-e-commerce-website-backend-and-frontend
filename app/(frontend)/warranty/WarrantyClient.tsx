//app/(frontend)/warranty/WarrantyClient.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { submitWarrantyClaim } from '@/app/actions/frontend/warranty/warranty-action';
import { saveMediaRecord } from '@/app/actions/backend/media/media-action';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';
import { MediaSource } from '@prisma/client';

const GOBIKE_ONLINE_VALUE = 'GoBike Australia';

const SHOP_OPTIONS = [
  { group: 'Online', options: [{ value: 'GoBike Australia', label: 'GoBike Australia (Online)', address: '' }] },
  { group: 'Others', options: [{ value: 'Others', label: 'OTHERS', address: '' }] },
  {
    group: 'NSW Retailers',
    options: [
      { value: 'On Two Wheels Motorsports', label: 'On Two Wheels Motorsports', address: 'Unit 1, 18 Holborn Circuit, Gledswood Hills NSW 2557' },
      { value: 'Camden Cycles', label: 'Camden Cycles', address: '184 Argyle Street, Camden NSW 2570' },
      { value: 'Engadine Cycles and Scooters', label: 'Engadine Cycles and Scooters', address: '26 Station Street, Engadine NSW 2233' },
      { value: 'Valley Bikeco', label: 'Valley Bikeco', address: '26 Macquarie St, Singleton NSW 2330' },
      { value: 'MXR Motorsports Australia', label: 'MXR Motorsports Australia', address: '132 Princes Highway, South Nowra NSW 2541' },
      { value: 'Penrith Pit Bike', label: 'Penrith Pit Bike', address: 'Shop 6A/55-61 York Rd, Jamisontown NSW 2750' },
      { value: 'MiniRacer', label: 'MiniRacer', address: '6/73 Willarong Rd, Caringbah NSW 2229' },
    ],
  },
  {
    group: 'Victoria Retailers',
    options: [
      { value: '', label: 'Seeking Applicants — Starting January 2027', address: '', disabled: true },
    ],
  },
  {
    group: 'Queensland Retailers',
    options: [
      { value: 'Cooroy Motorcycles', label: 'Cooroy Motorcycles', address: 'Shed 4, 5 Taylor Ct, Cooroy QLD' },
    ],
  },
  {
    group: 'Western Retailers',
    options: [
      { value: 'Eazy Bikes', label: 'Eazy Bikes', address: 'Unit 1/12 Farral Road, Midvale WA 6056' },
    ],
  },
];

type AddressForm = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
};

const EMPTY_ADDRESS: AddressForm = {
  firstName: '', lastName: '', address1: '', address2: '',
  city: '', state: '', postcode: '', phone: '',
};

export default function WarrantyClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    orderNumber: '',
    shopPurchased: '',
    email: '',
    description: '',
  });

  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);

  const isGoBikeOnline = formData.shopPurchased === GOBIKE_ONLINE_VALUE;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

  const selectedShopOption = SHOP_OPTIONS.flatMap(g => g.options).find(o => o.value === formData.shopPurchased);
  const selectedShopGroup  = SHOP_OPTIONS.find(g => g.options.some(o => o.value === formData.shopPurchased));

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
        setIsShopDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const newUploadedUrls: string[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload-warranty',
          onUploadProgress: (p: { loaded: number; total: number }) => {
            const overall = Math.round(((i * 100) + (p.loaded / p.total) * 100) / totalFiles);
            setUploadProgress(overall);
          },
        });

        await saveMediaRecord({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          source: MediaSource.WARRANTY,
        });

        newUploadedUrls.push(blob.url);
      }

      setUploadedMediaUrls(prev => [...prev, ...newUploadedUrls]);
      setUploadProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: unknown) {
      console.error(error);
      toast.error('Failed to upload files. Ensure your network is stable and files are valid.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setUploadedMediaUrls(urls => urls.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploading) return alert("Please wait for files to finish uploading.");
    if (!formData.shopPurchased) return alert("Please select the shop where you purchased.");
    if (uploadedMediaUrls.length === 0) return alert("Please upload at least one video or image.");

    if (!isGoBikeOnline) {
      const { firstName, lastName, address1, city, state, postcode, phone } = addressForm;
      if (!firstName || !lastName || !address1 || !city || !state || !postcode || !phone) {
        return alert("Please fill in all delivery address fields.");
      }
    }

    setIsSubmitting(true);

    try {
      const mediaUrlString = uploadedMediaUrls.join(', ');
      const result = await submitWarrantyClaim({
        ...formData,
        mediaUrl: mediaUrlString,
        manualAddress: isGoBikeOnline ? undefined : addressForm,
      });

      if (!result.success) throw new Error(result.message);

      toast.success('Your warranty claim has been submitted successfully! Our team will review your video and contact you shortly.', { duration: 6000 });

      setFormData({ name: '', orderNumber: '', shopPurchased: GOBIKE_ONLINE_VALUE, email: '', description: '' });
      setAddressForm(EMPTY_ADDRESS);
      setUploadedMediaUrls([]);
      setUploadProgress(0);

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to submit claim. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-gray-800 pb-20">
      <Breadcrumbs pageTitle="Warranty Claim Form" />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-14 px-4">
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            12-Month Warranty Included
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">Warranty Claim Form</h1>
          <p className="text-blue-100 text-lg max-w-[620px] mx-auto leading-relaxed">
            Having an issue with your GoBike? We&apos;ll send you the replacement part directly — fast and hassle-free.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1100px] mx-auto px-2 sm:px-6 py-12">
        <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', icon: '📋', title: 'Submit Your Claim', desc: 'Fill out the form below with your order details and upload a short video of the issue.' },
            { step: '2', icon: '🔍', title: 'We Review It', desc: 'Our team reviews your claim and identifies the faulty part — usually within 1 business day.' },
            { step: '3', icon: '📦', title: 'Part Shipped to You', desc: 'We dispatch the replacement part directly to your door, completely free of charge.' },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mb-1">{s.step}</div>
              <div className="text-3xl">{s.icon}</div>
              <h3 className="font-bold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main */}
      <section className="max-w-[1100px] mx-auto px-2 sm:px-6 pb-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Warranty <span className="text-blue-600">Claim</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              At <strong>GoBike Australia</strong>, we build high-quality electric balance bikes for kids.
              If you experience any issues, our dedicated Australian support team is here to help you
              get back on track quickly with genuine replacement parts.
            </p>
          </div>

          {/* HOW TO SUBMIT GUIDE */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-base font-bold text-white">How to Submit Your Claim</h3>
              <p className="text-gray-400 text-[13px] mt-0.5">Follow the steps below based on where you purchased your GoBike.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

              {/* ONLINE PATH */}
              <div className="bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Option A</p>
                    <p className="text-[14px] font-extrabold text-gray-900 leading-tight">Purchased Online from GoBike</p>
                  </div>
                </div>

                <ol className="space-y-3">
                  {[
                    { n: '1', text: 'Select <strong>GoBike Australia (Online)</strong> from the shop dropdown.' },
                    { n: '2', text: 'Enter your <strong>Order Number</strong> (e.g. #12345) — we\'ll automatically find your shipping address.' },
                    { n: '3', text: 'Enter your <strong>Email</strong> and <strong>Full Name</strong>.' },
                    { n: '4', text: 'Upload a <strong>video or photo</strong> showing the fault.' },
                    { n: '5', text: 'Describe the issue and hit <strong>Submit</strong>.' },
                  ].map(s => (
                    <li key={s.n} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                      <p className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.text }} />
                    </li>
                  ))}
                </ol>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700">
                  <span className="font-bold">✓ No address needed</span> — your delivery address is fetched automatically from your order.
                </div>
              </div>

              {/* RETAIL PATH */}
              <div className="bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Option B</p>
                    <p className="text-[14px] font-extrabold text-gray-900 leading-tight">Purchased from a Retail Store</p>
                  </div>
                </div>

                <ol className="space-y-3">
                  {[
                    { n: '1', text: 'Select your <strong>retail store</strong> from the dropdown (NSW, VIC, QLD or WA).' },
                    { n: '2', text: '<strong>Order Number is optional</strong> for retail purchases — leave it blank if you don\'t have it.' },
                    { n: '3', text: 'Enter your <strong>Email Address</strong>.' },
                    { n: '4', text: 'Fill in your <strong>full delivery address</strong> — we\'ll ship the replacement part directly to you.' },
                    { n: '5', text: 'Upload a <strong>video or photo</strong> of the issue and hit <strong>Submit</strong>.' },
                  ].map(s => (
                    <li key={s.n} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                      <p className="text-[13px] text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.text }} />
                    </li>
                  ))}
                </ol>

                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-[12px] text-amber-800">
                  <span className="font-bold">📍 Address required</span> — since you didn&apos;t buy online, we need your address to send the replacement part.
                </div>
              </div>

            </div>
          </div>
        </div>
  
        <div className="mt-8">
          <div className="bg-white p-2 sm:p-10 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 pb-4 border-b border-gray-100">Submit Your Claim</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                      {formData.shopPurchased === '' ? null : isGoBikeOnline ? (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-[13px] text-blue-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>💡</span> GoBike Australia Online
                  </p>
                  <p>Enter your <strong>Order Number</strong> and the <strong>Email</strong> used at checkout — we&apos;ll automatically fetch your shipping address.</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-[13px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>📍</span> Retail Store Purchase
                  </p>
                  <p>Since you purchased from a retail store, please enter your <strong>delivery address</strong> below so we can ship the replacement part directly to you.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Where did you purchase? *</label>
                <div className="relative" ref={shopDropdownRef}>
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsShopDropdownOpen(v => !v)}
                    className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl text-left transition-all ${isShopDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        {formData.shopPurchased === '' ? (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        ) : formData.shopPurchased === GOBIKE_ONLINE_VALUE ? (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                        )}
                      </div>
                      <div className="text-left">
                        {formData.shopPurchased === '' ? (
                          <p className="text-[13px] text-gray-400 leading-tight">Select your shop where you purchased</p>
                        ) : (
                          <>
                            <p className="text-[13px] font-bold text-black-800 leading-tight">{selectedShopOption?.label}</p>
                            <p className="text-[11px] text-black-400 leading-tight mt-0.5">
                              {selectedShopOption?.address || selectedShopGroup?.group}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <svg className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  {/* Dropdown panel */}
                  {isShopDropdownOpen && (
                    <div className="absolute z-5 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                      {SHOP_OPTIONS.map((group) => (
                        <div key={group.group}>
                          <div className="px-4 pt-3 pb-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-black-400">{group.group}</span>
                          </div>
                          {group.options.map((opt) => {
                            const isSelected = formData.shopPurchased === opt.value;
                            if ((opt as { disabled?: boolean }).disabled) {
                              return (
                                <div key={opt.label} className="px-4 py-2.5 flex items-center gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md leading-tight">
                                    {opt.label}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, shopPurchased: opt.value }));
                                  setIsShopDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors cursor-pointer
                                  ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                              >
                                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                  ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="leading-tight">{opt.label}</span>
                                  {opt.address && (
                                    <span className="text-[11px] text-gray-400 font-normal leading-tight mt-0.5">{opt.address}</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isGoBikeOnline && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                       Full Name * 
                    </label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="John Doe" 
                      />
                    </div>
                  )}
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Original Order Number {isGoBikeOnline ? '*' : <span className="text-gray-400 font-normal">(optional for retail purchases)</span>}
                  </label>
                  <input type="text" name="orderNumber" required={isGoBikeOnline} value={formData.orderNumber} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. #12345" />
                </div>
                
              </div>

              {!isGoBikeOnline && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                  <h3 className="text-sm font-bold text-blue-800 mb-4">Delivery Address for Replacement Parts *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label><input type="text" name="firstName" required value={addressForm.firstName} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label><input type="text" name="lastName" required value={addressForm.lastName} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Doe" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Address Line 1 *</label><input type="text" name="address1" required value={addressForm.address1} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 Street Name" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Address Line 2</label><input type="text" name="address2" value={addressForm.address2} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Unit, Suite, etc. (optional)" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Suburb / City *</label><input type="text" name="city" required value={addressForm.city} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sydney" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                      <select name="state" required value={addressForm.state} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select State</option>
                        {['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Postcode *</label><input type="text" name="postcode" required value={addressForm.postcode} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2000" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Phone *</label><input type="tel" name="phone" required value={addressForm.phone} onChange={handleAddressChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="04XX XXX XXX" /></div>
                  </div>
                </div>
              )}

              {/* VIDEO/IMAGE UPLOAD */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Videos or Images *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 relative hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="video/mp4, video/quicktime, image/*"
                    onChange={handleFileSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-400 mt-4">Max file size: 500MB. Formats: MP4, MOV, JPG, PNG.</p>
                  <p className="text-[11px] text-blue-500 font-semibold mt-1">You can select multiple files or upload one by one.</p>

                  {isUploading && (
                    <div className="mt-5">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${uploadProgress}%` }}>
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 font-bold mt-2">Uploading Files: {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                {uploadedMediaUrls.length > 0 && !isUploading && (
                  <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-xl">
                    <p className="text-[13px] font-bold text-green-700 mb-3">✓ {uploadedMediaUrls.length} File(s) Ready to Submit:</p>
                    <ul className="space-y-2">
                      {uploadedMediaUrls.map((url, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-100 text-sm shadow-sm">
                          <a href={url} target="_blank" className="text-blue-600 hover:underline truncate max-w-[80%]">File {idx + 1} - View</a>
                          <button type="button" onClick={() => removeMedia(idx)} className="text-red-500 hover:text-white hover:bg-red-500 font-bold px-3 py-1 rounded transition-colors">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description *</label>
                <textarea name="description" required rows={5} value={formData.description} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
              </div>

              <button type="submit" disabled={isSubmitting || isUploading || uploadedMediaUrls.length === 0} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all">
                {isSubmitting ? 'Submitting Claim...' : 'Submit Warranty Claim →'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
