//app/(admin)/admin/settings/affiliate/payouts/_components/payouts-table.tsx

"use client";

import { PayoutQueueItem } from "@/app/actions/admin/settings/affiliates/types";
import { approvePayoutAction, rejectPayoutAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-payouts";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, FileText } from "lucide-react";

interface Props {
  data: PayoutQueueItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  currentStatus?: string;
}

export default function PayoutsTable({ data }: Props) {
  const [isPending, startTransition] = useTransition();

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
            <tr><td colSpan={6} className="p-6 text-center text-gray-500">No payout requests found.</td></tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.affiliateName}</div>
                  <div className="text-xs text-gray-500">{item.affiliateEmail}</div>
                </td>
                <td className="px-6 py-4 font-mono font-medium">
                  ${item.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-gray-100 rounded w-fit capitalize">
                    {item.method.replace('_', ' ').toLowerCase()}
                  </span>
                  {item.method === 'PAYPAL' && <div className="text-xs text-blue-600 mt-1">{item.paypalEmail}</div>}
                  {item.method === 'BANK_TRANSFER' && <div className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-black">View Details</div>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(item.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {item.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handlePay(item.id, item.method)} disabled={isPending} className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800">
                        Mark Paid
                      </button>
                      <button onClick={() => handleReject(item.id)} disabled={isPending} className="p-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}