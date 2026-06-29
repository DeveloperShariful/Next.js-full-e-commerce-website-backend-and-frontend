//app/(backend)/admin/_components/action-alerts.tsx

"use client";

import { Package, RefreshCcw, ShieldAlert, AlertTriangle, Wrench, Star } from "lucide-react";
import Link from "next/link";

interface ActionAlertsProps {
  alerts: {
    totalProducts: number;
    pendingReviews: number;
    returns: number;
    disputes: number;
    lowStock: number;
  };
  claims: {
    total: number;
    pending: number;
    approved: number;
    recent: any[];
  };
}

export function ActionAlerts({ alerts, claims }: ActionAlertsProps) {
  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-[#c3c4c7]">

        {/* 1. TOTAL PRODUCTS */}
        <Link href="/admin/products" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#2271b1] mb-1">
            <Package size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.totalProducts}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Total products</p>
        </Link>

        {/* 2. PENDING REVIEWS */}
        <Link href="/admin/reviews?status=PENDING" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#f59e0b] mb-1">
            <Star size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.pendingReviews}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Pending reviews</p>
        </Link>

        {/* 3. RETURNS */}
        <Link href="/admin/orders/returns" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <RefreshCcw size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.returns}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Pending returns</p>
        </Link>

        {/* 4. DISPUTES */}
        <Link href="/admin/orders/disputes" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <ShieldAlert size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.disputes}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Open disputes</p>
        </Link>

        {/* 5. LOW STOCK */}
        <Link href="/admin/products?status=low_stock" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <AlertTriangle size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.lowStock}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Low stock items</p>
        </Link>

        {/* 6. PENDING WARRANTY CLAIMS */}
        <Link href="/admin/warranty-claims?status=PENDING" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <Wrench size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{claims.pending}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Pending claims</p>
        </Link>

      </div>
    </div>
  );
}
