// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Shipments.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { getTransdirectBookings } from "@/app/actions/admin/settings/shipping/transdirect-orders";
import { Loader2, RefreshCw, ExternalLink, Package, AlertCircle, Clock, CheckCircle, Truck, XCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";

export default function Transdirect_Shipments() {
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState<any[]>([]);
    const [error, setError] = useState("");
    
    // UI States
    const [activeFilter, setActiveFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchBookings = async () => {
        setLoading(true);
        setError("");
        const res = await getTransdirectBookings();
        
        if (res.success) {
            setAllData(res.bookings || []);
        } else {
            setError(res.error || "Failed to load bookings");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // --- UPDATED FILTERING LOGIC ---
    // Added more keywords to catch variations like "picked_up", "manifested", "collected"
    const filteredData = useMemo(() => {
        if (activeFilter === "all") return allData;
        
        return allData.filter(item => {
            const s = (item.status || "").toLowerCase();
            
            if (activeFilter === "pending") return s.includes("pending") || s.includes("draft") || s.includes("quote");
            
            if (activeFilter === "booked") return s === "booked" || s.includes("confirmed") || s.includes("manifest");
            
            if (activeFilter === "transit") return s.includes("transit") || s.includes("board") || s.includes("pickup") || s.includes("collected") || s.includes("depot");
            
            if (activeFilter === "delivered") return s.includes("delivered") || s.includes("completed");
            
            if (activeFilter === "cancelled") return s.includes("cancelled") || s.includes("refund") || s.includes("void");
            
            return true;
        });
    }, [allData, activeFilter]);

    // --- PAGINATION ---
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

    // --- UPDATED COUNTS ---
    const counts = useMemo(() => {
        return {
            all: allData.length,
            pending: allData.filter(i => (i.status||"").toLowerCase().match(/pending|draft|quote/)).length,
            booked: allData.filter(i => (i.status||"").toLowerCase().match(/booked|confirmed|manifest/)).length,
            transit: allData.filter(i => (i.status||"").toLowerCase().match(/transit|board|pickup|collected|depot/)).length,
            delivered: allData.filter(i => (i.status||"").toLowerCase().match(/delivered|completed/)).length,
            cancelled: allData.filter(i => (i.status||"").toLowerCase().match(/cancelled|refund|void/)).length,
        };
    }, [allData]);

    // Helper for Status Badge
    const getStatusBadge = (status: string) => {
        const s = status ? status.toLowerCase() : "unknown";
        if (s.includes("delivered") || s === "completed") 
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200"><CheckCircle size={10} /> Delivered</span>;
        if (s.includes("transit") || s.includes("board") || s.includes("collected")) 
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"><Truck size={10} /> In Transit</span>;
        if (s === "booked" || s === "confirmed") 
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200"><Package size={10} /> Booked</span>;
        if (s === "pending" || s === "draft") 
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200"><Clock size={10} /> Pending</span>;
        if (s.includes("cancel")) 
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200"><XCircle size={10} /> Cancelled</span>;
        
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 uppercase">{status}</span>;
    };

    if (loading) return <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-[#2271b1]" size={32} /></div>;

    const tabs = [
        { id: "all", label: "All Orders", count: counts.all },
        { id: "pending", label: "Pending", count: counts.pending },
        { id: "booked", label: "Booked", count: counts.booked },
        { id: "transit", label: "In Transit", count: counts.transit },
        { id: "delivered", label: "Delivered", count: counts.delivered },
        { id: "cancelled", label: "Cancelled", count: counts.cancelled },
    ];

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Package size={20} className="text-[#2271b1]" />
                        Transdirect Dashboard
                    </h2>
                    <p className="text-sm text-slate-500">Live view of shipments sorted by status.</p>
                </div>
                <button onClick={fetchBookings} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold text-slate-700 transition-colors">
                    <RefreshCw size={16}/> Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
                    <AlertCircle size={16}/> {error}
                </div>
            )}

            {/* TABS */}
            <div className="border-b border-slate-200 bg-white rounded-t-sm px-2 pt-2 overflow-x-auto">
                <div className="flex space-x-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                activeFilter === tab.id 
                                ? "border-[#2271b1] text-[#2271b1] bg-blue-50/50" 
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label} <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-b-sm border border-t-0 border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b text-slate-600">
                            <tr>
                                <th className="p-4 font-bold">Ref / ID</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Sender</th>
                                <th className="p-4 font-bold">Receiver</th>
                                <th className="p-4 font-bold">Courier</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((item: any) => (
                                <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        {/* ✅ ORDER NUMBER + ID */}
                                        <div className="flex flex-col">
                                            {item.reference ? (
                                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                                    <FileText size={12} className="text-slate-400"/>
                                                    #{item.reference}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">No Ref</span>
                                            )}
                                            <span className="text-xs font-mono text-[#2271b1] mt-0.5">ID: {item.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                    
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{item.sender}</div>
                                        <div className="text-xs text-slate-500">{item.sender_loc}</div>
                                    </td>
                                    
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{item.receiver}</div>
                                        <div className="text-xs text-slate-500">{item.receiver_loc}</div>
                                    </td>
                                    
                                    <td className="p-4 text-slate-600 uppercase font-bold text-xs">{item.courier || "-"}</td>
                                    <td className="p-4">{getStatusBadge(item.status)}</td>
                                    <td className="p-4 text-right">
                                        {item.tracking_url ? (
                                            <a 
                                                href={item.tracking_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2271b1] text-white text-xs font-bold rounded hover:bg-[#135e96] transition-colors"
                                            >
                                                Track <ExternalLink size={12}/>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Not available</span>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {paginatedData.length === 0 && !error && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                        No {activeFilter !== 'all' ? activeFilter : ''} orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-between items-center bg-slate-50">
                        <span className="text-xs text-slate-500 font-bold">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-2 text-sm font-bold text-slate-600 bg-white border rounded">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded bg-white hover:bg-slate-100 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}