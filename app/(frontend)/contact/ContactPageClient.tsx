// app/(frontend)/contact/ContactPageClient.tsx

"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
// 🛑 NEW: Import the server action
import { submitContactForm } from '@/app/actions/frontend/contact/contact-action';

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🛑 FIX: Using Server Action instead of API Route
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    toast.loading('Sending your message...', { id: 'contact' });

    try {
      const data = new FormData(e.currentTarget);
      const result = await submitContactForm(data);

      if (result.success) {
        setStatus('success');
        toast.success(result.message, { id: 'contact' });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setStatus('error');
      toast.error(error.message || 'An error occurred.', { id: 'contact' });
    }
  };

  // ... (Your exact same UI code continues here, nothing changes below)
  return (
    <div className="bg-white min-h-screen pb-12 font-sans text-gray-900">
      <Breadcrumbs pageTitle="Contact Us" />
      
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 lg:pt-8">
        
        {/* === COMPACT HERO & LOCATIONS SECTION === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">
            
            {/* LEFT COLUMN: Intro, Contact & Warehouse */}
            <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6">
                <div>
                  <div className="inline-block bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-3 rounded-sm">
                    Support & Locations
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3 text-black">
                    Let's Talk <span className="text-blue-600">GoBikes</span>
                  </h1>
                  <p className="text-gray-600 leading-snug text-sm md:text-base">
                    Need help with an order or prefer to visit a store in person? We're here for you.
                  </p>
                </div>

                {/* Contact Action Buttons (Side-by-side on mobile) */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                 {/* Email Button */}
                  <a href="mailto:gobike@gobike.au" className="flex flex-col justify-center p-3 md:p-4 bg-gray-50 border border-blue-100 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Email Us</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-blue-600 truncate">gobike@gobike.au</span>
                  </a>

                  {/* Facebook Button */}
                  <a href="https://www.facebook.com/Go-Bike-104997195659873" target="_blank" rel="noopener noreferrer" className="flex flex-col justify-center p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#1877F2] hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5 text-[#1877F2]">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Facebook</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-[#1877F2]">Send a Message</span>
                  </a>
                </div>

                {/* Warehouse Highlight Card (Compact) */}
                <div className="bg-black text-white p-5 rounded-2xl border border-gray-800 relative overflow-hidden flex flex-col justify-center">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-1 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h2a1 1 0 011 1v3M12 7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Main Warehouse
                      </h4>
                      <p className="text-xl md:text-2xl font-black leading-none">CAMDEN SOUTH<br/>NSW</p>
                    </div>
                    <div className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider py-1.5 px-2 rounded-sm self-start sm:self-auto text-center">
                      Pickup by request
                    </div>
                  </div>
                  <svg className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-gray-800 opacity-30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
            </div>

            {/* RIGHT COLUMN: Retailers List (Highly Compacted Grid) */}
            <div className="lg:col-span-7 bg-[#f8f9fa] border border-gray-200 rounded-2xl p-3 md:p-3 flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
                <span>Authorized Retailers</span>
                <span className="self-start sm:self-auto text-[10px] font-bold text-gray-400 bg-white px-5 py-1 rounded-full border border-gray-200"> 9 Locations </span>
              </h2>

              <div className="flex-1 flex flex-col gap-5">
                {/* NSW List (2 columns on all devices to save vertical space) */}
                <div>
                  <h5 className="font-bold text-blue-600 uppercase tracking-widest text-[10px] mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> New South Wales
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {[
                      { name: "On Two Wheels Motorsports", addr: "Unit 1, 18 Holborn Circuit, Gledswood Hills NSW 2557" },
                      { name: "Camden Cycles", addr: "184 Argyle Street, Camden NSW 2570" },
                      { name: "Engadine Cycles and Scooters", addr: "26 Station Street, Engadine NSW 2233" },
                      { name: "Valley Bikeco", addr: "26 Macquarie St, Singleton NSW 2330" },
                      { name: "MXR Motorsports Australia", addr: "132 Princes Highway, South Nowra NSW 2541" },
                      { name: "Penrith Pit Bike", addr: "Shop 6A/55-61 York Rd, Jamisontown NSW 2750" },
                      { name: "MiniRacer", addr: "6/73 Willarong Rd, Caringbah NSW 2229" }
                    ].map((loc, i) => (
                      <div key={i} className="group">
                        <p className="font-bold text-gray-900 text-xs md:text-sm group-hover:text-blue-600 transition-colors leading-tight">{loc.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{loc.addr}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIC & QLD (Side by side) */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 mt-auto">
                  <div>
                    <h5 className="font-bold text-green-600 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Victoria
                    </h5>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                      <p className="font-bold text-gray-900 text-xs md:text-sm leading-tight">Ozminis Motorsport</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">26B O'Sullivan St, Pakenham</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-orange-600 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Queensland
                    </h5>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                      <p className="font-bold text-gray-900 text-xs md:text-sm leading-tight">Cooroy Motorcycles</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Shed 4, 5 Taylor Ct, Cooroy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* === CONTACT FORM === */}
        <div className="max-w-6xl mx-auto mb-16 bg-white border border-gray-200 rounded-2xl p-3 md:p-5 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Send Us A Message</h2>
            <div className="w-12 h-1 bg-blue-600 mx-auto mt-3"></div>
          </div>
          
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input 
                type="text" name="name" placeholder="Enter your name" 
                value={formData.name} onChange={handleInputChange} required 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
              <input 
                type="email" name="email" placeholder="Enter your email" 
                value={formData.email} onChange={handleInputChange} required 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
              <input 
                type="tel" name="phone" placeholder="Enter your phone number" 
                value={formData.phone} onChange={handleInputChange} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Message *</label>
              <textarea 
                name="message" placeholder="How can we assist you today?" 
                value={formData.message} onChange={handleInputChange} required rows={4}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
              ></textarea>
            </div>
            <div className="col-span-1 sm:col-span-2 pt-1">
              <button 
                type="submit" disabled={status === 'loading'}
                className="w-full bg-black text-white py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending Message...' : 'Submit Message'}
              </button>
            </div>
          </form>

          {status === 'success' && <div className="mt-5 p-3 border border-green-200 bg-green-50 text-green-700 rounded-lg text-center text-sm font-bold">Thank you! Your message has been sent successfully.</div>}
          {status === 'error' && <div className="mt-5 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-center text-sm font-bold">Failed to send message. Please try again.</div>}
        </div>

        {/* === CONSUMER RIGHTS === */}
        <div className="bg-black text-white p-8 md:p-12 rounded-2xl text-center border-t-4 border-blue-600">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-4">Consumer Protection</h2>
            <p className="max-w-2xl mx-auto text-sm text-gray-400 leading-relaxed mb-6">
              At <Link href="/" className="text-white hover:text-blue-500 underline decoration-gray-600 underline-offset-4 transition-colors">GoBike Australia</Link>, we strictly adhere to the <strong>Australian Consumer Law</strong>. Your purchase is protected by rights to repair, replacement, or refund for any major failures.
            </p>
            <a 
              href="https://www.accc.gov.au/" target="_blank" rel="noopener noreferrer" 
              className="inline-block border border-gray-600 text-gray-300 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-all"
            >
              Visit ACCC Website
            </a>
         </div>
      </div>
    </div>
  );
}