// File: app/(admin)/admin/settings/affiliate/_components/users-table.tsx

"use client";

import { AffiliateUserTableItem } from "@/app/actions/admin/settings/affiliates/types";
import { approveAffiliateAction, rejectAffiliateAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-accounts";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Search, ChevronDown, Download, Tag, MoreHorizontal } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Props {
  data: AffiliateUserTableItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  currentStatus?: string;
  groups?: { id: string, name: string }[];
  tags?: { id: string, name: string }[];
}

export default function AffiliateUsersTable({ data, totalEntries, totalPages, currentPage, groups = [], tags = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatPrice } = useGlobalStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CSV Export Logic
  const handleExport = () => {
    if (data.length === 0) return toast.error("No data to export");
    
    // Create CSV Header
    const headers = ["ID", "Name", "Email", "Status", "Total Earnings", "Balance", "Join Date"];
    
    // Map Data
    const csvContent = data.map(u => [
        u.id, 
        `"${u.name}"`, 
        u.email, 
        u.status, 
        u.totalEarnings, 
        u.balance, 
        new Date(u.createdAt).toISOString()
    ].join(",")).join("\n");

    // Create Blob
    const blob = new Blob([headers.join(",") + "\n" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Trigger Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `affiliates_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(data.map(d => d.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 ? (
             <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm animate-in fade-in">
                <span>{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-gray-600 mx-2"></div>
                <button onClick={() => toast.info("Bulk actions demo")} className="hover:underline">Approve</button>
                <button onClick={() => toast.info("Bulk actions demo")} className="hover:underline">Pay</button>
             </div>
          ) : (
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
             </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
            onChange={(e) => handleFilterChange("groupId", e.target.value)}
            defaultValue={searchParams.get("groupId") || ""}
          >
            <option value="">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
              defaultValue={searchParams.get("search") || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFilterChange("search", e.currentTarget.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" onChange={handleSelectAll} checked={selectedIds.length === data.length && data.length > 0} />
                </th>
                <th className="px-4 py-3">Affiliate</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">No affiliates found matching criteria.</td>
                </tr>
              ) : (
                data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-black focus:ring-black"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded w-fit">{user.tierName}</span>
                        {user.groupName !== "No Group" && (
                             <span className="text-[10px] text-blue-600">{user.groupName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border",
                        user.status === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-200" :
                        user.status === 'PENDING' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between w-32">
                            <span className="text-gray-500">Sales:</span>
                            <span className="font-medium">{formatPrice(user.salesTotal)}</span>
                        </div>
                        <div className="flex justify-between w-32">
                            <span className="text-gray-500">Comm:</span>
                            <span className="text-green-600 font-bold">{formatPrice(user.commissionTotal)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-gray-900">{formatPrice(user.balance)}</div>
                      <div className="text-[10px] text-gray-400">Paid: {formatPrice(user.totalEarnings - user.balance)}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                        <button className="p-1 text-gray-400 hover:text-black rounded">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. FOOTER PAGINATION */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between text-xs text-gray-500">
           <span>Showing {data.length} of {totalEntries} entries</span>
           <div className="flex gap-2">
              <button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="px-3 py-1.5 border bg-white rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
              <button disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="px-3 py-1.5 border bg-white rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
}