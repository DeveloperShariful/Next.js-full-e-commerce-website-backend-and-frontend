// File: app/(storefront)/_component/TrustBadges.tsx
import React from 'react';

// Icons 
const ReturnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M21 12v3a2 2 0 0 1-2 2H5"/><path d="m16 5 3-3-3-3"/><path d="M3 10h13"/><path d="M12 21a9 9 0 0 0 9-9h-3"/><path d="m16 19 3 3-3 3"/></svg>;
const WarrantyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>;
const SecureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const PerformanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2-1.3-1.3a1.5 1.5 0 0 1 2-2.3zM8.5 10.5l-1.3-1.3a1.5 1.5 0 0 1 2-2.3l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2z"/><path d="M12 15.5l.3-.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2-1.3-1.3a1.5 1.5 0 0 1 2-2.3zM8.5 14.5l-1.3-1.3a1.5 1.5 0 0 1 2.4 2l-3.2 3.2z"/><path d="M15.5 12.5l-.3.3a1.5 1.5 0 0 1-2.4-2l3.2-3.2 1.3 1.3a1.5 1.5 0 0 1-2 2.3z"/><path d="M10.5 8.5l1.3 1.3a1.5 1.5 0 0 1-2 2.3l-.3.3a1.5 1.5 0 0 1-2.4-2l3.2-3.2z"/><path d="M19 12h-2"/><path d="M5 12H3"/></svg>;
const ShippingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2M18 16.5v-3.5a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1.5M6 12v6h2l2-3-2-3H6"/><path d="M3 12h3"/><path d="M21 12h-3"/></svg>;
const SupportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M22 11h-4"/></svg>;

const trustItems = [
    { icon: <ReturnIcon />, title: "Easy 30-Day Returns", description: "Not a perfect fit? No worries. We offer a 30-day money-back guarantee." },
    { icon: <WarrantyIcon />, title: "Full 1-Year Warranty", description: "Every GoBike kids electric bike is covered by a full one-year local warranty." },
    { icon: <SecureIcon />, title: "100% Secure Checkout", description: "Pay with confidence. We support all major payment methods including Afterpay." },
    { icon: <PerformanceIcon />, title: "Market-Leading Performance", description: "Experience the highest top speeds and best performance for value on any kids ebike." },
    { icon: <ShippingIcon />, title: "Fast Shipping Aus-Wide", description: "Get your GoBike delivered quickly to your doorstep, anywhere in Australia." },
    { icon: <SupportIcon />, title: "Expert Aussie Support", description: "Have a question? email us easily! gobike@gobike.au our local team is ready to help you." },
];

const TrustBadges = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">The GoBike Promise: Australias Best Kids Electric Bike</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">We are committed to providing an unmatched riding experience, backed by guarantees you can count on. Here’s why GoBike is the choice for Aussie families.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {trustItems.map((item, index) => (
            <div className="flex items-start gap-4" key={index}>
              <div className="shrink-0 w-8 h-8 text-black">{item.icon}</div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-[15px] text-gray-600 leading-relaxed m-0">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustBadges;