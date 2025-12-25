// app/(routes)/page.tsx

import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight, Truck, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import ProductCard from "@/components/ui/product-card"; // ✅ Reusable Component Import

export default async function HomePage() {
  
  // 1. Fetch Products
  const newArrivals = await db.product.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      images: true,
      category: true
    }
  });

  return (
    <div className="bg-white font-sans text-slate-800">
      
      {/* HERO SECTION */}
      <section className="relative bg-slate-900 text-white overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 opacity-40 z-0 bg-fixed" 
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1558981806-ec527fa84f3d?auto=format&fit=crop&q=80)', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        ></div>
        
        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-2xl">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-6 inline-block animate-pulse">
              New Collection 2025
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Ride Beyond <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Limits.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Experience the thrill with our premium range of bikes and accessories. Engineered for performance, designed for style.
            </p>
            <div className="flex gap-4">
              <Link href="/shop" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg flex items-center gap-2">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link href="/about" className="px-8 py-4 border border-slate-600 text-white font-bold rounded-lg hover:bg-slate-800 hover:border-slate-500 transition">
                Explore
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders over ৳5000" },
            { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment gateways" },
            { icon: RefreshCw, title: "Easy Returns", desc: "30 days money back guarantee" },
            { icon: Clock, title: "24/7 Support", desc: "Dedicated support team" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl transition hover:-translate-y-1 duration-300">
              <div className="p-3.5 bg-slate-100 text-slate-900 rounded-full">
                <item.icon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-20 container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">New Arrivals</h2>
            <p className="text-slate-500 mt-2">Check out the latest products added to our store.</p>
          </div>
          <Link href="/shop" className="px-6 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center gap-2">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      </section>

      {/* PROMO BANNER */}
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

    </div>
  );
}