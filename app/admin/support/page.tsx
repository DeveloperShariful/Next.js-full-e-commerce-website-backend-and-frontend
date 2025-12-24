// app/admin/support/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getTickets } from "@/app/actions/admin/support";
import Link from "next/link";
import { 
  MessageSquare, Search, RefreshCcw, 
  Loader2, CheckCircle2, Clock, AlertCircle 
} from "lucide-react";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const res = await getTickets(filter);
    if (res.success) setTickets(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      open: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-slate-600",
      pending: "bg-orange-100 text-orange-700"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Support Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer inquiries and issues.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {["all", "open", "closed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition ${
              filter === tab 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : tickets.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No tickets found.</div>
        ) : (
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b text-xs uppercase font-bold text-slate-500">
                    <tr>
                        <th className="p-4">Ticket ID</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Date</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-mono text-xs text-slate-500">#{t.id.slice(0,6)}</td>
                            <td className="p-4 font-medium text-slate-800">{t.subject}</td>
                            <td className="p-4">
                                <div className="font-bold text-sm">{t.user?.name || "Guest"}</div>
                                <div className="text-xs text-slate-500">{t.user?.email}</div>
                            </td>
                            <td className="p-4">
                                <span className={`text-xs font-bold ${t.priority === 'high' ? 'text-red-600' : 'text-slate-600'}`}>
                                    {t.priority}
                                </span>
                            </td>
                            <td className="p-4 text-center"><StatusBadge status={t.status}/></td>
                            <td className="p-4 text-center text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                                <Link href={`/admin/support/${t.id}`} className="px-3 py-1.5 border rounded text-xs font-bold hover:bg-blue-50 text-blue-600">
                                    Reply
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
}