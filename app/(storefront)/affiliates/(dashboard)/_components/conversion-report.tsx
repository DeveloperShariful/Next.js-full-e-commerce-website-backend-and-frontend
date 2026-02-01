//app/(storefront)/affiliates/_components/conversion-report.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, ShoppingBag, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface Order {
  orderNumber: string;
  total: number | any;
}

interface Referral {
  id: string;
  status: string;
  commissionAmount: number | any;
  createdAt: Date | string;
  order: Order;
}

interface Props {
  conversions: Referral[];
  currency: string;
}

export default function ConversionReport({ conversions, currency }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = conversions.filter(c => 
    c.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "APPROVED": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PAID": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
           <h3 className="font-bold text-gray-900 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-indigo-600" /> Conversion Report
           </h3>
           <p className="text-xs text-gray-500 mt-1">Track orders generated from your links.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            placeholder="Search Order #..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Order Value</th>
                <th className="px-6 py-4 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
                    No conversions found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                      <div className="text-[10px] text-gray-400">{format(new Date(item.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900">#{item.order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusIcon status={item.status} />
                        <span className="text-xs font-bold text-gray-700 capitalize">{item.status.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {currency}{Number(item.order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        +{currency}{Number(item.commissionAmount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}