// File: app/(storefront)/_components/promo-banner.tsx

import Link from "next/link";

export default function PromoBanner() {
  return (
    <section className="py-16 bg-[#F8FAFC]">
      <div className="container mx-auto px-6">
        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-20 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <h3 className="text-emerald-400 font-bold tracking-wider uppercase mb-3 text-sm">Limited Time Offer</h3>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Get 20% Off on All <br/> Accessories</h2>
              <p className="text-slate-300 mb-8 text-lg">Don't miss out on our exclusive sale. Upgrade your gear today.</p>
              <Link href="/shop?category=Accessories" className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition inline-block shadow-lg">
                  Grab the Deal
              </Link>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        </div>
      </div>
    </section>
  );
}