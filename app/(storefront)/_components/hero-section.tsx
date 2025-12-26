// File: app/(storefront)/_components/hero-section.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
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
  );
}