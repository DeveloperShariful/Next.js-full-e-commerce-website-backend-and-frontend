//app/(admin)/admin/_components/action-alerts.tsx

"use client";

import { AlertTriangle, Package, RefreshCcw, ShieldAlert, Truck } from "lucide-react";
import Link from "next/link";

interface ActionAlertsProps {
  alerts: {
    unfulfilled: number;
    returns: number;
    disputes: number;
    lowStock: number;
  };
}

export function ActionAlerts({ alerts }: ActionAlertsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* 1. READY TO SHIP (Paid & Unfulfilled) */}
      <Link href="/admin/orders?status=unfulfilled&payment=paid">
        <div className="bg-white p-5 rounded-xl border border-l-4 border-l-blue-600 border-y-slate-200 border-r-slate-200 shadow-sm hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ready to Ship</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-blue-600 transition">
                {alerts.unfulfilled}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Paid orders pending fulfillment</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Truck size={20} />
            </div>
          </div>
        </div>
      </Link>

      {/* 2. RETURNS */}
      <Link href="/admin/orders/returns">
        <div className="bg-white p-5 rounded-xl border border-l-4 border-l-orange-500 border-y-slate-200 border-r-slate-200 shadow-sm hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Returns</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-orange-600 transition">
                {alerts.returns}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Requests needing approval</p>
            </div>
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <RefreshCcw size={20} />
            </div>
          </div>
        </div>
      </Link>

      {/* 3. DISPUTES */}
      <Link href="/admin/orders/disputes">
        <div className={`bg-white p-5 rounded-xl border-y-slate-200 border-r-slate-200 shadow-sm hover:shadow-md transition group border-l-4 ${alerts.disputes > 0 ? 'border-l-red-600 bg-red-50' : 'border-l-slate-300'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${alerts.disputes > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                Disputes
              </p>
              <h3 className={`text-2xl font-bold mt-1 transition ${alerts.disputes > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                {alerts.disputes}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Chargebacks & Issues</p>
            </div>
            <div className={`p-2 rounded-lg ${alerts.disputes > 0 ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>
      </Link>

      {/* 4. LOW STOCK */}
      <Link href="/admin/products?status=low_stock">
        <div className="bg-white p-5 rounded-xl border border-l-4 border-l-yellow-400 border-y-slate-200 border-r-slate-200 shadow-sm hover:shadow-md transition group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-yellow-600 transition">
                {alerts.lowStock}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Products below threshold</p>
            </div>
            <div className="p-2 bg-yellow-50 text-yellow-500 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}