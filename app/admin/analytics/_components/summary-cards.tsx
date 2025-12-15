"use client";

import { TrendingUp, ShoppingBag, CreditCard, Undo2 } from "lucide-react";
import { AnalyticsSummary } from "@/app/actions/analytics";

interface SummaryCardsProps {
  summary: AnalyticsSummary;
  currency?: string; // Optional: e.g., 'AUD' or 'BDT'
}

export function SummaryCards({ summary, currency = "BDT" }: SummaryCardsProps) {
  
  // Dynamic Currency Formatter
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', 
      currency: currency, 
      minimumFractionDigits: 0
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Revenue",
      value: formatPrice(summary.revenue),
      icon: TrendingUp,
      bg: "bg-blue-50",
      text: "text-blue-600"
    },
    {
      title: "Orders",
      value: summary.orders,
      icon: ShoppingBag,
      bg: "bg-purple-50",
      text: "text-purple-600",
      sub: "Processed orders"
    },
    {
      title: "Avg. Order Value",
      value: formatPrice(summary.aov),
      icon: CreditCard,
      bg: "bg-orange-50",
      text: "text-orange-600"
    },
    {
      title: "Refunded",
      value: formatPrice(summary.refunded),
      icon: Undo2,
      bg: "bg-red-50",
      text: "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
                 <h3 className="text-2xl font-bold text-slate-800 mt-1">{card.value}</h3>
                 {card.sub && <p className="text-xs text-slate-400 mt-2">{card.sub}</p>}
              </div>
              <div className={`p-2 rounded-lg transition-colors duration-300 ${card.bg} ${card.text} group-hover:bg-opacity-80`}>
                 <card.icon size={22}/>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
}