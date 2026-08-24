//File: app/(backend)/admin/visitors/_components/visitor-summary-cards.tsx

import React from "react";
import Link from "next/link";
import { calculatePercentageChange, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import type { VisitorInsightsData } from "@/app/actions/backend/visitors/visitor-insights.actions";

interface Props {
  data: VisitorInsightsData;
  checkoutProofLink: string;
}

export default function VisitorSummaryCards({ data, checkoutProofLink }: Props) {
  const percentChange = calculatePercentageChange(data.totalVisitors, data.previousTotalVisitors);
  const isPositive = percentChange >= 0;

  const topChannel = data.channelBreakdown[0];
  const topCountry = data.countryBreakdown[0];
  const checkoutPercentage = data.totalVisitors > 0
    ? Number(((data.reachedCheckoutCount / data.totalVisitors) * 100).toFixed(1))
    : 0;

  const cards = [
    {
      title: "Total Visitors",
      value: formatNumber(data.totalVisitors),
      badge: (
        <span
          className={`text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] ${
            isPositive ? "bg-[#e5f5fa] text-[#008a20]" : "bg-[#fbeaea] text-[#d63638]"
          }`}
        >
          {isPositive ? "" : "-"}
          {Math.abs(percentChange)}%
        </span>
      ),
    },
    {
      title: "Reached Checkout",
      value: formatNumber(data.reachedCheckoutCount),
      sub: `${checkoutPercentage}% of total visitors — click to see the list (proof)`,
      href: checkoutProofLink,
    },
    {
      title: "Top Channel",
      value: topChannel ? topChannel.channel : "—",
      sub: topChannel ? `${formatNumber(topChannel.count)} visits (${topChannel.percentage}%)` : undefined,
    },
    {
      title: "Top Country",
      value: topCountry ? topCountry.country : "—",
      sub: topCountry ? `${formatNumber(topCountry.count)} visits (${topCountry.percentage}%)` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0 border border-[#c3c4c7] bg-white shadow-sm mb-6 rounded-sm">
      {cards.map((card, index) => {
        const inner = (
          <>
            <h3 className="text-[13px] text-[#50575e] mb-2">{card.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl text-[#1d2327] capitalize">{card.value}</span>
              {card.badge}
            </div>
            {card.sub && <p className="text-[12px] text-[#646970] mt-1">{card.sub}</p>}
          </>
        );
        const className = `p-4 ${index !== cards.length - 1 ? "border-r border-[#f0f0f1]" : ""}`;
        return card.href ? (
          <Link key={card.title} href={card.href} className={`${className} hover:bg-[#f6f7f7] transition-colors`}>
            {inner}
          </Link>
        ) : (
          <div key={card.title} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
