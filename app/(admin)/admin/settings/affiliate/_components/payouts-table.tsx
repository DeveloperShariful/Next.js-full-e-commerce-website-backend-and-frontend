// File: app/(admin)/admin/settings/affiliate/_components/payouts-table.tsx

"use client";

import { PayoutQueueItem } from "@/app/actions/admin/settings/affiliates/types";
import { approvePayoutAction, rejectPayoutAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-payouts";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, FileText, Download, ExternalLink } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format } from "date-fns";

interface Props {
  data: PayoutQueueItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  currentStatus?: string;
}

export default function PayoutsTable({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const { formatPrice } = useGlobalStore();

  const handlePay = (id: string, method: string) => {
    const txnId = prompt(`Enter Transaction ID for ${method} payment:`);
    if (!txnId) return;

    startTransition(async () => {
      const res = await approvePayoutAction(id, txnId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason (User will be refunded):");
    if (!reason) return;

    startTransition(async () => {
      const res = await rejectPayoutAction(id, reason);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <div>
                <h3 className="font-semibold text-gray-800">Payout Requests</h3>
                <p className="text-xs text-gray-500">Manage withdrawals and payments.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export Batch CSV
            </button>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
                <th className="px-6 py-3">Requested By</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-500">No payout requests found.</td></tr>
            ) : (
                data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.affiliateName}</div>
                        <div className="text-xs text-gray-500">{item.affiliateEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        {formatPrice(item.amount)}
                    </td>
                    <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-gray-100 rounded w-fit capitalize border">
                            {item.method.replace('_', ' ').toLowerCase()}
                        </span>
                        {item.method === 'PAYPAL' && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                {item.paypalEmail} <ExternalLink className="w-3 h-3"/>
                            </div>
                        )}
                        {item.method === 'BANK_TRANSFER' && <div className="text-xs text-gray-400 mt-1 underline cursor-pointer">View Bank Details</div>}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            item.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {item.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                        {format(new Date(item.requestedAt), "dd MMM yyyy")}
                        <br/><span className="text-[10px] text-gray-400">{format(new Date(item.requestedAt), "h:mm a")}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {item.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handlePay(item.id, item.method)} 
                                disabled={isPending} 
                                className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                            >
                                <Check className="w-3 h-3" /> Pay
                            </button>
                            <button 
                                onClick={() => handleReject(item.id)} 
                                disabled={isPending} 
                                className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                                title="Reject"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            </div>
                        )}
                        {item.status === 'COMPLETED' && (
                            <button className="text-xs text-gray-400 hover:text-black flex items-center gap-1 ml-auto">
                                <FileText className="w-3 h-3" /> Receipt
                            </button>
                        )}
                    </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    </div>
  );
}