// app/admin/invoices/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getInvoices } from "@/app/actions/invoice";
import Link from "next/link";
import { 
  FileText, Search, Printer, Eye, 
  RefreshCcw, Loader2, Download 
} from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await getInvoices(searchQuery);
    if (res.success) {
      setInvoices(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">View and print customer invoices.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search invoice #, name..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
           />
        </div>
        <div className="text-xs text-slate-500 font-bold">
           Total: {invoices.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : invoices.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4 font-mono font-bold text-slate-700">#{inv.orderNumber}</td>
                    <td className="p-4 text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="p-4">
                       <div className="font-medium text-slate-800">{inv.user?.name || "Guest"}</div>
                       <div className="text-xs text-slate-400">{inv.user?.email || inv.guestEmail}</div>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                       }`}>
                          {inv.status}
                       </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">{formatPrice(inv.total)}</td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/invoices/${inv.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded border" title="View Invoice">
                             <Eye size={16} />
                          </Link>
                          <Link href={`/admin/invoices/${inv.id}`} className="p-2 text-slate-600 hover:bg-slate-50 rounded border" title="Print">
                             <Printer size={16} />
                          </Link>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}