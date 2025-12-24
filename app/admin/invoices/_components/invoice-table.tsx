// File: app/admin/invoices/_components/invoice-table.tsx

"use client";

import Link from "next/link";
import { Printer, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InvoiceTableProps {
    invoices: any[];
    loading: boolean;
}

export const InvoiceTable = ({ invoices, loading }: InvoiceTableProps) => {
    
    // Currency Formatter (AUD)
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency', currency: 'AUD'
        }).format(amount);
    };

    // Date Formatter
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // Status Badge Logic
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
            case 'CANCELLED': return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
            case 'PENDING': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
            default: return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-20 flex justify-center">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8"/>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-20 text-center text-slate-500">
                No invoices found matching your search.
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
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
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4">
                                    <Link href={`/admin/orders/${inv.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                                        #{inv.orderNumber}
                                    </Link>
                                </td>
                                <td className="p-4 text-slate-500">{formatDate(inv.createdAt)}</td>
                                <td className="p-4">
                                    <div className="font-medium text-slate-800">{inv.user?.name || "Guest"}</div>
                                    <div className="text-xs text-slate-400">{inv.user?.email || inv.guestEmail}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <Badge variant="outline" className={getStatusColor(inv.status)}>
                                        {inv.status}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right font-bold text-slate-700">
                                    {formatPrice(inv.total)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* View Details -> Order Page */}
                                        <Link href={`/admin/orders/${inv.id}`}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                <Eye size={16} />
                                            </Button>
                                        </Link>
                                        
                                        {/* Print Invoice -> Invoice Page */}
                                        <Link href={`/admin/orders/${inv.id}/invoice`} target="_blank">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                                                <Printer size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};