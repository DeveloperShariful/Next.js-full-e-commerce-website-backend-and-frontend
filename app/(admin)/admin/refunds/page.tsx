// app/admin/refunds/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getRefunds, updateRefundStatus, deleteRefund, RefundData } from "@/app/actions/admin/refund/refund";
import { toast } from "react-hot-toast";
import { 
  Undo2, Search, RefreshCcw, Loader2, 
  CheckCircle2, XCircle, Trash2, DollarSign, AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [stats, setStats] = useState({ totalRefunded: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await getRefunds(searchQuery);
    if (res.success) {
      setRefunds(res.data as any);
      setStats(res.stats as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // --- HANDLERS ---
  const handleStatus = async (id: string, status: string) => {
    const confirmMsg = status === 'approved' 
      ? "Approve this refund? This will mark the order as REFUNDED." 
      : "Reject this refund request?";
      
    if(!confirm(confirmMsg)) return;

    const res = await updateRefundStatus(id, status);
    if(res.success) {
      toast.success(res.message as string);
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this record permanently?")) return;
    const res = await deleteRefund(id);
    if(res.success) {
      toast.success(res.message as string);
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

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
            <Undo2 className="text-blue-600" /> Refunds
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage return requests and financial refunds.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Refunded</p>
               <h2 className="text-3xl font-bold text-slate-800 mt-1">{formatPrice(stats.totalRefunded)}</h2>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
               <DollarSign size={24}/>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</p>
               <h2 className="text-3xl font-bold text-slate-800 mt-1">{stats.pendingCount}</h2>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
               <AlertCircle size={24}/>
            </div>
         </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search order #, reason..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
           />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : refunds.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No refund records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                       <Link href={`/admin/orders/${refund.order.id}`} className="font-bold text-blue-600 hover:underline">
                          #{refund.order.orderNumber}
                       </Link>
                       <div className="text-xs text-slate-500 mt-0.5">{refund.order.user?.name || "Guest"}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                       {formatDate(refund.createdAt)}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                       {formatPrice(Number(refund.amount))}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate" title={refund.reason || ""}>
                       {refund.reason || "No reason provided"}
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          refund.status === 'approved' ? 'bg-green-100 text-green-700' :
                          refund.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-800'
                       }`}>
                          {refund.status}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {refund.status === 'pending' && (
                             <>
                                <button onClick={() => handleStatus(refund.id, 'approved')} className="p-2 text-green-600 hover:bg-green-50 rounded border" title="Approve">
                                    <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => handleStatus(refund.id, 'rejected')} className="p-2 text-orange-600 hover:bg-orange-50 rounded border" title="Reject">
                                    <XCircle size={16} />
                                </button>
                             </>
                          )}
                          <button onClick={() => handleDelete(refund.id)} className="p-2 text-red-600 hover:bg-red-50 rounded border" title="Delete Record">
                             <Trash2 size={16} />
                          </button>
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