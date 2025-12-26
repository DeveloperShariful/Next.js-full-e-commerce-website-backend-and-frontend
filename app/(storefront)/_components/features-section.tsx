// File: app/(storefront)/_components/features-section.tsx

import { Truck, ShieldCheck, Clock, RefreshCw } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    { icon: Truck, title: "Free Shipping", desc: "On all orders over ৳5000" },
    { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment gateways" },
    { icon: RefreshCw, title: "Easy Returns", desc: "30 days money back guarantee" },
    { icon: Clock, title: "24/7 Support", desc: "Dedicated support team" },
  ];

  return (
    <section className="py-12 border-b border-gray-100 bg-white">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((item, idx) => (
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
  );
}