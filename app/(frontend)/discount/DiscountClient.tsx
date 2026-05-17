//app/(frontend)/discount/DiscountClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

// --- SVGs ---
const CopyIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>;
const CheckIcon = () => <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>;
const ScissorsIcon = () => <svg className="w-6 h-6 text-gray-400 transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>;

export default function DiscountClient() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Official Partner Codes
  const partnerCodes = ['huntfinn5', 'hunter5', 'guy5', 'ethan5', '5%off', 'jess5'];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000); 
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-[#f4f7f6] min-h-screen font-sans text-gray-800 pb-10 selection:bg-blue-200">
      <Breadcrumbs pageTitle="Official Promo Codes & Discounts" />

      {/* ==========================================
          1. PREMIUM HERO SECTION
      ========================================== */}
      <section className="bg-gray-900 text-white pt-16 pb-32 px-4 sm:px-6 relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600 opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-gray-800 border border-gray-700 text-blue-400 text-sm font-bold uppercase tracking-widest rounded-full mb-6">
            Official GoBike Offers
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">5% OFF</span> Your Entire Order
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Don't waste time on fake coupon sites. Apply our verified 5% discount codes below and save instantly on Australia's top-rated kids electric bikes, spare parts, and accessories.
          </p>
        </div>
      </section>

      {/* ==========================================
          2. MAIN VOUCHER TICKET
      ========================================== */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 relative">
          
          <div className="p-8 md:p-12 md:w-[60%] flex flex-col justify-center border-b md:border-b-0 md:border-r-2 border-dashed border-gray-200 relative">
            <div className="absolute -bottom-3 right-1/2 translate-x-1/2 md:-right-3 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 bg-white p-1 rounded-full">
              <ScissorsIcon />
            </div>

            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">5% Flat Discount</h2>
            <p className="text-lg text-blue-600 font-bold mb-6">On Everything in Your Cart!</p>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5"><CheckIcon /></span>
                <span className="text-gray-600 text-sm leading-relaxed"><strong>Add Multiple Items:</strong> Add as many bikes, parts, or accessories to your cart as you want. The 5% discount applies to the <strong>TOTAL</strong> cart value.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5"><CheckIcon /></span>
                <span className="text-gray-600 text-sm leading-relaxed"><strong>Single Use:</strong> This coupon can only be applied once per checkout session.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 md:p-12 md:w-[40%] bg-gray-50 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Use Official Code</p>
            <div className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl py-4 px-6 mb-6">
              <span className="text-3xl font-extrabold tracking-widest text-gray-900">gobike5</span>
            </div>
            <button 
              onClick={() => handleCopy('gobike5')}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                copiedCode === 'gobike5' 
                ? 'bg-green-500 text-white shadow-green-500/30' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:-translate-y-1'
              }`}
            >
              {copiedCode === 'gobike5' ? 'Code Copied! ✓' : <><CopyIcon /> Copy Code</>}
            </button>
          </div>

        </div>
      </section>

      {/* ==========================================
          3. OTHER PARTNER CODES
      ========================================== */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 mt-16 mb-20">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-gray-900">Alternative Partner Codes</h3>
          <p className="text-gray-600 mt-2 text-lg">All codes below provide the exact same <strong>5% Cart Discount</strong>. Pick your favorite!</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {partnerCodes.map((code) => (
            <div key={code} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <span className="text-xs font-bold text-gray-400 uppercase mb-3">Partner Code</span>
              <span className="text-xl font-extrabold text-gray-800 mb-4 tracking-wide">{code}</span>
              <button 
                onClick={() => handleCopy(code)}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  copiedCode === code 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copiedCode === code ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          4. WHAT WILL YOU SAVE ON? (SEO KEYWORD GOLDMINE)
      ========================================== */}
      <section className="bg-white border-t border-b border-gray-200 py-16 mb-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">What Can You Buy With Your Discount?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Your 5% promo code is sitewide. Here is how our Australian customers are using their discounts to build the ultimate riding experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kids Electric Bikes</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Apply your coupon to our world-class <strong>electric balance bikes</strong> and <strong>kids dirt bikes</strong>. From our lightweight 12-inch starter bikes for toddlers to the powerful 24-inch electric motorcycles for teens.</p>
              <Link href="/bikes" className="text-blue-600 font-bold hover:underline text-sm">Shop Bikes →</Link>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Genuine Spare Parts</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Need to maintain your ride? Get 5% off our entire range of <strong>genuine spare parts</strong>. This includes replacement lithium-ion batteries, Kenda dirt tires, Star Union brake pads, and more.</p>
              <Link href="/electric-bike-parts" className="text-green-600 font-bold hover:underline text-sm">Shop Parts →</Link>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Riding Apparel & Gear</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Look the part while staying safe. Use your promo code on our exclusive GoBike Crew T-shirts, protective gear, and riding accessories designed for young Australian riders.</p>
              <Link href="/apparel" className="text-purple-600 font-bold hover:underline text-sm">Shop Apparel →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          5. HELPFUL SIZING GUIDE & WHY CHOOSE US
      ========================================== */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Quick Sizing Guide */}
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-blue-500 pb-2 inline-block">Quick E-Bike Sizing Guide</h3>
            <p className="text-gray-600 mb-6">Not sure which bike to use your discount on? Here is a quick guide to help you choose the right electric bike for your child's age and height.</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm">12" Bike</span>
                <span className="text-gray-700 font-medium">Perfect for Toddlers (Ages 2-5)</span>
              </li>
              <li className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm">16" Bike</span>
                <span className="text-gray-700 font-medium">Great for Young Riders (Ages 5-9)</span>
              </li>
              <li className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm">20" Bike</span>
                <span className="text-gray-700 font-medium">Ideal for Pre-Teens (Ages 9-16)</span>
              </li>
              <li className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm">24" Bike</span>
                <span className="text-gray-700 font-medium">Built for Teens & Adults (Ages 13+)</span>
              </li>
            </ul>
          </div>

          {/* Why Trust GoBike? */}
          <div className="bg-gray-900 p-8 md:p-10 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-2xl font-bold mb-6 relative z-10">Why Aussie Parents Trust GoBike</h3>
            <p className="text-gray-300 mb-6 leading-relaxed relative z-10">
              When you use a <strong>GoBike promo code</strong>, you're not just getting a discount—you're investing in top-tier quality backed by real people.
            </p>
            <ul className="space-y-4 text-gray-300 relative z-10">
              <li className="flex gap-3 items-start"><CheckIcon /> <span><strong>24-Month Warranty:</strong> The best protection in Australia.</span></li>
              <li className="flex gap-3 items-start"><CheckIcon /> <span><strong>Same-Day Dispatch:</strong> Fast shipping from our NSW warehouse.</span></li>
              <li className="flex gap-3 items-start"><CheckIcon /> <span><strong>Local Support:</strong> Expert tech support ready to help within hours.</span></li>
              <li className="flex gap-3 items-start"><CheckIcon /> <span><strong>Built for Safety:</strong> Speed limiters and premium disc brakes.</span></li>
            </ul>
            <div className="mt-8 relative z-10">
               <Link href="/warranty" className="text-blue-400 font-bold hover:text-blue-300 underline">Read our full warranty policy →</Link>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          6. HOW TO APPLY (Step by Step)
      ========================================== */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 mb-20">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Apply Your Discount Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4 text-xl">1</div>
              <h4 className="font-bold text-gray-900 mb-2">Copy Code</h4>
              <p className="text-sm text-gray-600">Click the "Copy Code" button on any voucher above.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4 text-xl">2</div>
              <h4 className="font-bold text-gray-900 mb-2">Shop Store</h4>
              <p className="text-sm text-gray-600">Add your favorite electric bikes or parts to your cart.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4 text-xl">3</div>
              <h4 className="font-bold text-gray-900 mb-2">Go to Checkout</h4>
              <p className="text-sm text-gray-600">Click on your cart icon and proceed to checkout.</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold mb-4 text-xl">4</div>
              <h4 className="font-bold text-gray-900 mb-2">Paste & Save</h4>
              <p className="text-sm text-gray-600">Paste your code in the "Promo Code" box and enjoy 5% off!</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          8. FAQ SECTION (Extended)
      ========================================== */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Promo Code FAQs</h2>
          <p className="text-gray-600 mt-3 text-lg">Got questions about our discounts? We have answers.</p>
        </div>
        
        <div className="space-y-4 mb-10">
          {/* FAQ 1 */}
          <div className={`bg-white border ${activeFaq === 1 ? 'border-blue-500 shadow-md' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}>
            <button onClick={() => toggleFaq(1)} className="w-full flex items-center justify-between p-6 font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="text-lg">Can I apply the 5% code to multiple bikes?</span>
              <span className={`transform transition-transform duration-300 text-blue-500 text-2xl ${activeFaq === 1 ? 'rotate-180' : ''}`}>↓</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === 1 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                <strong>Yes, absolutely!</strong> You can add as many bikes, spare parts, and accessories to your cart as you want. Once you apply the code at checkout, it will take 5% off the <strong>entire total</strong> of your cart.
              </div>
            </div>
          </div>

          {/* FAQ 2 */}
          <div className={`bg-white border ${activeFaq === 2 ? 'border-blue-500 shadow-md' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}>
            <button onClick={() => toggleFaq(2)} className="w-full flex items-center justify-between p-6 font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="text-lg">Can I use multiple codes at once?</span>
              <span className={`transform transition-transform duration-300 text-blue-500 text-2xl ${activeFaq === 2 ? 'rotate-180' : ''}`}>↓</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === 2 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                No, our checkout system only accepts one promo code per order. Since all the codes on this page offer the same 5% discount, you can pick any single code to apply to your order.
              </div>
            </div>
          </div>

          {/* FAQ 3 */}
          <div className={`bg-white border ${activeFaq === 3 ? 'border-blue-500 shadow-md' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}>
            <button onClick={() => toggleFaq(3)} className="w-full flex items-center justify-between p-6 font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="text-lg">Does the discount apply to spare parts?</span>
              <span className={`transform transition-transform duration-300 text-blue-500 text-2xl ${activeFaq === 3 ? 'rotate-180' : ''}`}>↓</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === 3 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                Yes! The 5% discount applies to everything in our store. Whether you are buying a brand new 24-inch ebike, a replacement battery, or Kenda tires, the discount is valid across the board.
              </div>
            </div>
          </div>

          {/* FAQ 4 */}
          <div className={`bg-white border ${activeFaq === 4 ? 'border-blue-500 shadow-md' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}>
            <button onClick={() => toggleFaq(4)} className="w-full flex items-center justify-between p-6 font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="text-lg">Can I use a promo code on items already on sale?</span>
              <span className={`transform transition-transform duration-300 text-blue-500 text-2xl ${activeFaq === 4 ? 'rotate-180' : ''}`}>↓</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === 4 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                In most cases, yes! Our 5% cart discount applies to your final cart total, meaning you can often stack it on top of existing site-wide sales for massive savings.
              </div>
            </div>
          </div>

          {/* FAQ 5 */}
          <div className={`bg-white border ${activeFaq === 5 ? 'border-blue-500 shadow-md' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}>
            <button onClick={() => toggleFaq(5)} className="w-full flex items-center justify-between p-6 font-bold text-gray-900 text-left hover:bg-gray-50 transition-colors focus:outline-none">
              <span className="text-lg">Why is my promo code showing as invalid?</span>
              <span className={`transform transition-transform duration-300 text-blue-500 text-2xl ${activeFaq === 5 ? 'rotate-180' : ''}`}>↓</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === 5 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 text-gray-600 bg-white border-t border-gray-100 leading-relaxed">
                Ensure you haven't accidentally added a space before or after the code when pasting it. Also, make sure you are using an official code from this page, as third-party coupon sites often distribute fake codes.
              </div>
            </div>
          </div>

        </div>

        {/* Link to Main FAQ Page */}
        <div className="text-center">
          <Link href="/faq" className="inline-block bg-white text-blue-600 border-2 border-blue-600 font-bold py-3.5 px-8 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg">
            View All Store FAQs
          </Link>
        </div>
      </section>

      {/* ==========================================
          9. BOTTOM CTA
      ========================================== */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-20">
         <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[2rem] text-white shadow-xl text-center">
            <h3 className="text-3xl font-bold mb-4">Got Your Code? Ready to Shop!</h3>
            <p className="text-blue-100 mb-8 max-w-md mx-auto text-lg">Apply your 5% discount at checkout and give your child the ultimate riding experience.</p>
            <Link href="/bikes" className="inline-block bg-white text-blue-700 font-bold py-4 px-10 rounded-xl hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300 shadow-md">
              Shop Kids Ebikes Now
            </Link>
         </div>
      </section>

    </div>
  );
}