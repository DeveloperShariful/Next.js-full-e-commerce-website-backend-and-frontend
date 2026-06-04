//app/(backend)/admin/_components/action-alerts.tsx

"use client";

import { AlertTriangle, Package, RefreshCcw, ShieldAlert, Truck, Wrench } from "lucide-react"; // Wrench icon added for claims
import Link from "next/link";

interface ActionAlertsProps {
  alerts: {
    unfulfilled: number;
    returns: number;
    disputes: number;
    lowStock: number;
  };
  // 🚀 FIX: Added claims to interface to solve TS error
  claims: {
    total: number;
    pending: number;
    approved: number;
    recent: any[];
  };
}

export function ActionAlerts({ alerts, claims }: ActionAlertsProps) {
  return (
    // 🚀 WP Style: Minimal grid, white background, standard borders, WooCommerce "Store Status" vibe
    <div className="bg-white border border-[#c3c4c7] shadow-sm mb-6">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#c3c4c7]">
        
        {/* 1. READY TO SHIP */}
        <Link href="/admin/orders?status=unfulfilled&payment=paid" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#2271b1] mb-1">
            <Truck size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.unfulfilled}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Orders to ship</p>
        </Link>

        {/* 2. RETURNS */}
        <Link href="/admin/orders/returns" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <RefreshCcw size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.returns}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Pending returns</p>
        </Link>

        {/* 3. DISPUTES */}
        <Link href="/admin/orders/disputes" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <ShieldAlert size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.disputes}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Open disputes</p>
        </Link>

        {/* 4. LOW STOCK */}
        <Link href="/admin/products?status=low_stock" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#d63638] mb-1">
            <AlertTriangle size={18} />
            <span className="text-[22px] font-normal leading-none group-hover:underline">{alerts.lowStock}</span>
          </div>
          <p className="text-[12px] text-[#50575e]">Low stock items</p>
        </Link>

        {/* 5. WARRANTY CLAIMS (NEW) */}
        <Link href="/admin/warranty-claims?status=PENDING" className="p-4 hover:bg-[#f6f7f7] transition group flex flex-col items-center text-center bg-[#fcf9e8] sm:bg-transparent">
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