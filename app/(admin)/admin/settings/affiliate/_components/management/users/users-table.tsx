//app/(admin)/admin/settings/affiliate/_components/management/users/users-table.tsx

"use client";

import { AffiliateUserTableItem } from "@/app/actions/admin/settings/affiliates/types";
import { approveAffiliateAction, rejectAffiliateAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-accounts";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Search, RotateCw } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Props {
  data: AffiliateUserTableItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  currentStatus?: string;
}

export default function AffiliateUsersTable({ data, totalEntries, totalPages, currentPage }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveAffiliateAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    startTransition(async () => {
      const res = await rejectAffiliateAction(id, reason);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  // Basic Pagination Helper (You can enhance this)
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Affiliate</th>
              <th className="px-6 py-3">Link / Slug</th>
              <th className="px-6 py-3 text-center">Referrals</th>
              <th className="px-6 py-3">Earnings</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No affiliates found.</td></tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                        {user.avatar ? <img src={user.avatar} className="rounded-full" alt="" /> : user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">/{user.slug}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium">{user.referralCount}</span>
                    <span className="text-xs text-gray-400 block">{user.visitCount} visits</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-green-600">${user.totalEarnings.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Bal: ${user.balance.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(user.id)} disabled={isPending} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(user.id)} disabled={isPending} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
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
      
      {/* Footer Pagination */}
      <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
        <span>Showing {data.length} of {totalEntries}</span>
        <div className="flex gap-2">
            <button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <button disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}