//app/(admin)/admin/settings/affiliate/users/_components/users-table.tsx

"use client";

import { AffiliateUserTableItem } from "@/app/actions/admin/settings/affiliates/types";
import { approveAffiliateAction, rejectAffiliateAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-accounts";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Check, X, Search, Filter, MoreHorizontal, ChevronDown, Download, Users, Tag, CreditCard } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) return toast.error("Select items first");
    toast.info(`Bulk Action: ${action} for ${selectedIds.length} items (Demo)`);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        
        {/* Left: Bulk Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200">
              Bulk Actions <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={() => handleBulkAction("approve")} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600">Approve Selected</button>
              <button onClick={() => handleBulkAction("pay")} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-blue-600">Pay Affiliates</button>
              <button onClick={() => handleBulkAction("group")} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Assign Group</button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button onClick={() => handleBulkAction("delete")} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600">Reject / Delete</button>
            </div>
          </div>
          <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">Apply</button>
          
          <span className="text-sm text-gray-500 ml-2">
            {selectedIds.length} selected
          </span>
        </div>

        {/* Right: Filters & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          
          <div className="relative hidden md:block">
            <select 
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
              onChange={(e) => handleFilterChange("groupId", e.target.value)}
              defaultValue={searchParams.get("groupId") || ""}
            >
              <option value="">All Groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <div className="relative hidden md:block">
            <select 
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
              onChange={(e) => handleFilterChange("tagId", e.target.value)}
              defaultValue={searchParams.get("tagId") || ""}
            >
              <option value="">All Tags</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Tag className="w-3 h-3 text-gray-400 absolute right-8 top-3 pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search name, email, slug..." 
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
                <th className="px-4 py-3">Commission Rate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Referrals</th>
                <th className="px-4 py-3">Net Revenue</th>
                <th className="px-4 py-3">Coupons / Tags</th>
                <th className="px-4 py-3 text-right">Store Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p>No affiliates found matching criteria.</p>
                  </td>
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">{user.name}</span>
                            <span className="text-gray-400 text-xs">#{user.slug}</span>
                        </div>
                        <span className="text-xs text-gray-500">{user.email}</span>
                        {user.registrationNotes && (
                            <span className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate">Note: {user.registrationNotes}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-gray-700">{user.tierName} Tier</span>
                        <span className="text-gray-500">From site default</span>
                        {user.groupName !== "No Group" && (
                             <span className="mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded w-fit">{user.groupName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border",
                        user.status === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-100" :
                        user.status === 'PENDING' ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                        "bg-red-50 text-red-700 border-red-100"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                        {user.referralCount}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between w-32">
                            <span className="text-gray-500">Sales:</span>
                            <span className="font-medium">${user.salesTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between w-32">
                            <span className="text-gray-500">Comm:</span>
                            <span className="text-red-500">(${user.commissionTotal.toLocaleString()})</span>
                        </div>
                        <div className="h-px bg-gray-200 w-32 my-0.5"></div>
                        <div className="flex justify-between w-32 font-bold text-gray-900">
                            <span>Net:</span>
                            <span>${user.netRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {user.coupons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {user.coupons.map(c => (
                                    <span key={c} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-600 font-mono">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400 italic">No coupons</span>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                             {user.tags.length > 0 ? user.tags.map(t => (
                                 <span key={t} className="text-[10px] flex items-center gap-1 text-gray-500">
                                    <Tag className="w-2.5 h-2.5" /> {t}
                                 </span>
                             )) : (
                                <span className="text-[10px] text-gray-300">No tags</span>
                             )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-medium text-gray-900">${user.storeCredit.toFixed(2)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. FOOTER PAGINATION */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between text-xs text-gray-500">
           <div className="flex items-center gap-2">
              <span>Rows per page: 20</span>
              <span className="h-4 w-px bg-gray-300 mx-2"></span>
              <span>Showing {data.length} records</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 border bg-white rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="font-medium text-gray-900">Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 border bg-white rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}