//File: app/(backend)/admin/analytics/_components/summary-cards.tsx

import React from "react";
import { OverviewSummaryData } from "@/app/actions/backend/analytics/overview.actions";
import { calculatePercentageChange, formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";

interface SummaryCardsProps {
  current: OverviewSummaryData;
  previous: OverviewSummaryData;
  isComparing?: boolean; // 🔴 NEW: To toggle compare UI
}

export default function SummaryCards({ current, previous, isComparing = true }: SummaryCardsProps) {
  const cards = [
    { title: "Total sales", current: current.totalSales, previous: previous.totalSales, isCurrency: true },
    { title: "Net sales", current: current.netSales, previous: previous.netSales, isCurrency: true },
    { title: "Orders", current: current.totalOrders, previous: previous.totalOrders, isCurrency: false },
    { title: "Average order value", current: current.averageOrderValue, previous: previous.averageOrderValue, isCurrency: true },
    { title: "Products sold", current: current.productsSold, previous: previous.productsSold, isCurrency: false },
    { title: "Variations Sold", current: current.variationsSold, previous: previous.variationsSold, isCurrency: false },
    { title: "Visitors", current: current.totalVisitors, previous: previous.totalVisitors, isCurrency: false },
    { title: "Views", current: current.totalPageViews, previous: previous.totalPageViews, isCurrency: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
      {cards.map((card, index) => {
        const percentChange = calculatePercentageChange(card.current, card.previous);
        const isPositive = percentChange >= 0;
        const formattedCurrent = card.isCurrency ? formatCurrency(card.current) : formatNumber(card.current);

        return (
          <div 
            key={card.title} 
            className={`p-4 ${
              index % 4 !== 3 ? "border-r border-[#f0f0f1]" : "" 
            } ${index < 4 ? "border-b border-[#f0f0f1]" : ""}`} 
          >
            <h3 className="text-[13px] text-[#50575e] mb-2">{card.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl text-[#1d2327]">{formattedCurrent}</span>
              
              {/* 🔴 FIXED: Show percentage badge only if we are comparing */}
              {isComparing && (
                <span 
                  className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${
                    isPositive 
                      ? "bg-[#e5f5fa] text-[#008a20]" 
                      : "bg-[#fbeaea] text-[#d63638]" 
                  }`}
                >
                  {isPositive ? "" : "-"}{Math.abs(percentChange)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}