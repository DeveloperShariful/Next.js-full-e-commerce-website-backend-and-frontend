// File: app/(admin)/admin/settings/affiliate/_components/Management/users-table.tsx
"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Search, Download, Users, ShieldAlert, Loader2, MoreVertical, 
  CheckCircle, XCircle, Filter, ChevronLeft, 
  ChevronRight, ArrowUpDown, Tag, CreditCard, Ticket, 
  Copy, ExternalLink, Calendar, MapPin, Mail, 
  AlertTriangle, DollarSign, Briefcase, Eye, X, UserCheck, UserX,
  Percent, Layers
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

// ✅ Type Import (Path Fixed)
import { AffiliateUserTableItem } from "@/app/actions/admin/settings/affiliates/types";

// ✅ Server Actions Import (Named Imports to fix Build Error)
import { 
  approveAffiliateAction, 
  rejectAffiliateAction, 
  bulkStatusAction, 
  bulkGroupAction, 
  bulkTagAction 
} from "@/app/actions/admin/settings/affiliates/_services/account-service";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ==================================================================================
// TYPES & INTERFACES
// ==================================================================================

interface Props {
  data: AffiliateUserTableItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  groups?: { id: string, name: string }[];
  tags?: { id: string, name: string }[];
}

type SortField = 'name' | 'totalEarnings' | 'balance' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function AffiliateUsersTable({ 
  data, 
  totalEntries, 
  totalPages, 
  currentPage, 
  groups = [], 
  tags = [] 
}: Props) {
  // --- Core Hooks ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatPrice, affiliate } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  // --- Local State ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionType, setBulkActionType] = useState<string>("");
  const [targetPayload, setTargetPayload] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "ALL");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUserTableItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkActionType("");
    setTargetPayload("");
  }, [data]);

  // --- Handlers: Selection ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(data.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- Handlers: Navigation ---
  const updateURL = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    updateURL("status", status === "ALL" ? null : status);
  };

  const handleSearch = (term: string) => {
    updateURL("search", term || null);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // --- Handlers: Server Actions (Mutations) ---
  const handleApprove = (id: string) => {
    startTransition(async () => {
        try {
            const res = await approveAffiliateAction(id);
            if (res.success) toast.success(res.message);
            else toast.error(res.message);
        } catch (e) {
            toast.error("Failed to approve affiliate");
        }
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason (User will receive an email):");
    if (!reason) return;
    
    startTransition(async () => {
        try {
            const res = await rejectAffiliateAction(id, reason);
            if (res.success) toast.success(res.message);
            else toast.error(res.message);
        } catch (e) {
            toast.error("Failed to reject affiliate");
        }
    });
  };

  const executeBulkAction = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return toast.error("Select items first");
    if (!bulkActionType) return toast.error("Select an action type");

    startTransition(async () => {
        let res;
        try {
            if (bulkActionType === "APPROVE") {
                res = await bulkStatusAction(ids, "ACTIVE");
            } else if (bulkActionType === "REJECT") {
                res = await bulkStatusAction(ids, "REJECTED");
            } else if (bulkActionType === "ASSIGN_GROUP") {
                if (!targetPayload) {
                    toast.error("Please select a group");
                    return;
                }
                res = await bulkGroupAction(ids, targetPayload);
            } else if (bulkActionType === "ADD_TAG") {
                if (!targetPayload) {
                    toast.error("Please select a tag");
                    return;
                }
                res = await bulkTagAction(ids, targetPayload);
            }

            if (res?.success) {
                toast.success(res.message);
                setSelectedIds(new Set());
                setBulkActionType("");
                setTargetPayload("");
            } else {
                toast.error(res?.message || "Operation failed");
            }
        } catch (e) {
            toast.error("Bulk action failed");
        }
    });
  };

  const handleExportCSV = () => {
    if (data.length === 0) return toast.error("No data to export");
    
    const headers = ["ID", "Name", "Email", "Status", "Earnings", "Balance", "Joined"];
    const csvContent = data.map(u => [
        u.id, 
        `"${u.name}"`, 
        u.email, 
        u.status, 
        u.totalEarnings, 
        u.balance, 
        new Date(u.createdAt).toISOString()
    ].join(",")).join("\n");

    const blob = new Blob([headers.join(",") + "\n" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `affiliates_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetails = (affiliate: AffiliateUserTableItem) => {
    setSelectedAffiliate(affiliate);
    setIsDrawerOpen(true);
  };

  // --- Derived State: Sorting ---
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  // --- Helper: Dynamic Commission Display ---
  const getCommissionDisplay = (user: AffiliateUserTableItem) => {
    if (user.groupName && user.groupName !== "No Group") {
        return { main: user.groupName, sub: "Group Rate", isDefault: false };
    }
    if (user.tierName && user.tierName !== "Default") {
        return { main: user.tierName, sub: "Tier Rate", isDefault: false };
    }
    return {
        main: "Global Default", 
        sub: "Store Setting",
        isDefault: true
    };
  };

  // ==================================================================================
  // RENDER UI
  // ==================================================================================

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. TOP TABS & EXPORT */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <TabButton 
            label="All Affiliates" 
            count={totalEntries} 
            isActive={activeTab === "ALL"} 
            onClick={() => handleTabChange("ALL")} 
          />
          <TabButton 
            label="Approved" 
            count={searchParams.get("status") === "ACTIVE" ? totalEntries : undefined}
            isActive={activeTab === "ACTIVE"} 
            onClick={() => handleTabChange("ACTIVE")} 
            activeColor="text-green-700 border-green-600 bg-green-50/50"
          />
          <TabButton 
            label="Pending" 
            count={searchParams.get("status") === "PENDING" ? totalEntries : undefined}
            isActive={activeTab === "PENDING"} 
            onClick={() => handleTabChange("PENDING")} 
            activeColor="text-orange-600 border-orange-600 bg-orange-50/50"
          />
          <TabButton 
            label="Rejected" 
            count={searchParams.get("status") === "REJECTED" ? totalEntries : undefined}
            isActive={activeTab === "REJECTED"} 
            onClick={() => handleTabChange("REJECTED")} 
            activeColor="text-red-600 border-red-600 bg-red-50/50"
          />
        </div>
        <div className="py-2 hidden sm:block">
           <button 
             onClick={handleExportCSV}
             className="text-xs font-medium text-gray-600 hover:text-black flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all shadow-sm"
           >
             <Download className="w-3.5 h-3.5" /> Export Report
           </button>
        </div>
      </div>

      {/* 2. ACTION BAR */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col xl:flex-row gap-4 justify-between items-center shadow-sm">
        
        {/* Left: Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className={cn("flex items-center gap-2 transition-all duration-300", selectedIds.size > 0 ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none grayscale")}>
            <div className="relative">
                <select 
                    className="h-9 bg-gray-50 border border-gray-300 text-gray-900 text-xs font-medium rounded-lg focus:ring-black focus:border-black block w-40 px-2.5 outline-none shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    value={bulkActionType}
                    onChange={(e) => {
                        setBulkActionType(e.target.value);
                        setTargetPayload(""); 
                    }}
                >
                    <option value="">Bulk Actions ({selectedIds.size})</option>
                    <option value="APPROVE">✅ Mark Active</option>
                    <option value="REJECT">❌ Reject Selected</option>
                    <option value="ASSIGN_GROUP">📂 Assign Group</option>
                    <option value="ADD_TAG">🏷️ Add Tag</option>
                </select>
            </div>

            {/* Dynamic Secondary Select: Groups */}
            {bulkActionType === "ASSIGN_GROUP" && (
              <select 
                className="h-9 bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-black focus:border-black block w-40 px-2.5 outline-none shadow-sm animate-in fade-in slide-in-from-left-2"
                value={targetPayload}
                onChange={(e) => setTargetPayload(e.target.value)}
              >
                <option value="">Select Group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}

            {/* Dynamic Secondary Select: Tags */}
            {bulkActionType === "ADD_TAG" && (
              <select 
                className="h-9 bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-black focus:border-black block w-40 px-2.5 outline-none shadow-sm animate-in fade-in slide-in-from-left-2"
                value={targetPayload}
                onChange={(e) => setTargetPayload(e.target.value)}
              >
                <option value="">Select Tag...</option>
                {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}

            <button 
                onClick={executeBulkAction}
                disabled={isPending || selectedIds.size === 0 || !bulkActionType}
                className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 active:scale-95"
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : "Apply"}
            </button>
          </div>
          
          {selectedIds.size === 0 && (
             <span className="text-xs text-gray-400 italic pl-2 border-l ml-2">Select items to enable actions</span>
          )}
        </div>

        {/* Right: Search */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
            </div>
            <input 
              type="text" 
              className="block w-full p-2 pl-10 text-xs text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-black focus:border-black outline-none shadow-sm transition-all h-9" 
              placeholder="Search affiliate, email, or slug..." 
              defaultValue={searchParams.get("search") || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(e.currentTarget.value);
              }}
            />
          </div>
          <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-600 h-9 w-9 flex items-center justify-center" title="Filter Options">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. DATA GRID (THE MAIN TABLE) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200 font-bold tracking-wider">
              <tr>
                <th scope="col" className="p-4 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer transition-all"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <SortableHeader label="Affiliate" field="name" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-3">Commission Rate</th>
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-3">Performance</th>
                <th scope="col" className="px-6 py-3 min-w-[180px]">Net Revenue</th>
                <th scope="col" className="px-6 py-3">Tags & Coupons</th>
                <SortableHeader label="Wallet" field="balance" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} align="right" />
                <th scope="col" className="px-6 py-3 text-center w-14">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Users className="w-10 h-10 opacity-30 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No affiliates found.</p>
                      <p className="text-xs max-w-xs mx-auto text-gray-400">Try adjusting your filters or search query.</p>
                      <button onClick={() => router.push(pathname)} className="text-blue-600 hover:underline text-xs font-bold mt-2">Reset Filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((user) => {
                  const commInfo = getCommissionDisplay(user);
                  
                  return (
                  <tr key={user.id} className="bg-white hover:bg-gray-50/60 transition-colors group">
                    <td className="p-4 w-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer transition-all"
                          checked={selectedIds.has(user.id)}
                          onChange={() => handleSelectOne(user.id)}
                        />
                      </div>
                    </td>
                    
                    {/* Affiliate Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                          ) : (
                            <span className="font-bold text-gray-500 text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDetails(user)} className="text-sm font-bold text-gray-900 truncate hover:text-blue-600 hover:underline transition-colors text-left">
                                {user.name}
                            </button>
                            {user.riskScore > 50 && (
                                <div title="High Risk User" className="cursor-help bg-red-50 p-0.5 rounded">
                                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                </div>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 truncate font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3"/> {user.email}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                #{user.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Commission Rate */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded border shadow-sm",
                          commInfo.isDefault 
                            ? "bg-gray-50 text-gray-700 border-gray-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                           {commInfo.main}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                           {commInfo.sub}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Stats */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5" title="Total Conversions">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-sm font-bold text-gray-900">{user.referralCount}</span>
                            <span className="text-[10px] text-gray-400">sales</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total Clicks">
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-gray-600">{user.visitCount}</span>
                            <span className="text-[10px] text-gray-400">clicks</span>
                        </div>
                      </div>
                    </td>

                    {/* Net Revenue */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-full max-w-[180px] bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Gross Sales:</span>
                          <span className="font-medium text-gray-700">{formatPrice(user.salesTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Commission:</span>
                          <span className="font-medium text-red-600">({formatPrice(user.commissionTotal)})</span>
                        </div>
                        <div className="h-px bg-gray-200 w-full my-0.5"></div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 font-bold">Net Profit:</span>
                          <span className="font-bold text-emerald-700">{formatPrice(user.netRevenue)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Coupons & Tags */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        {user.coupons.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.coupons.slice(0, 1).map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-100 text-[10px] font-medium font-mono">
                                <Ticket className="w-3 h-3" /> {c}
                              </span>
                            ))}
                            {user.coupons.length > 1 && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded border">+{user.coupons.length - 1}</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic flex items-center gap-1"><Ticket className="w-3 h-3"/> No coupons</span>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                          {user.tags.length > 0 ? user.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[10px]">
                              <Tag className="w-3 h-3" /> {t}
                            </span>
                          )) : (
                            <span className="text-[10px] text-gray-400 italic">No tags</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded w-fit">
                            {formatPrice(user.balance)}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            Lifetime: {formatPrice(user.totalEarnings)}
                        </span>
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button disabled={isPending} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-black/5">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <MoreVertical className="w-4 h-4" />}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-gray-200 p-1">
                          <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase px-2 py-1.5">Manage Affiliate</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDetails(user)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded hover:bg-gray-50 focus:bg-gray-50">
                            <Eye className="w-3.5 h-3.5 mr-2 text-gray-500" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Feature coming soon: Pay Affiliate")} className="cursor-pointer text-xs font-medium px-2 py-2 rounded hover:bg-gray-50 focus:bg-gray-50">
                            <CreditCard className="w-3.5 h-3.5 mr-2 text-gray-500" /> Pay Balance
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {user.status !== "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleApprove(user.id)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded text-green-700 hover:bg-green-50 focus:bg-green-50 focus:text-green-800">
                              <UserCheck className="w-3.5 h-3.5 mr-2" /> Approve Account
                            </DropdownMenuItem>
                          )}
                          
                          {user.status !== "REJECTED" && (
                            <DropdownMenuItem onClick={() => handleReject(user.id)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-800">
                              <UserX className="w-3.5 h-3.5 mr-2" /> Reject Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. FOOTER PAGINATION */}
        <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing <span className="font-bold text-gray-900">{data.length}</span> of <span className="font-bold text-gray-900">{totalEntries}</span> affiliates
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1} 
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-3 h-3" /> Previous
            </button>
            <span className="text-xs font-medium text-gray-900 px-2">
                Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. SLIDE-OVER DRAWER FOR DETAILS */}
      <DetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        user={selectedAffiliate} 
        formatPrice={formatPrice}
      />

    </div>
  );
}

// ==================================================================================
// SUB COMPONENTS
// ==================================================================================

function SortableHeader({ label, field, currentSort, currentDir, onSort, align = 'left' }: any) {
    return (
        <th scope="col" className={cn("px-6 py-3 cursor-pointer group select-none", align === 'right' && "text-right")}>
            <div className={cn("flex items-center gap-1.5", align === 'right' && "justify-end")} onClick={() => onSort(field)}>
                {label}
                <ArrowUpDown className={cn(
                    "w-3 h-3 transition-colors",
                    currentSort === field ? "text-black" : "text-gray-300 group-hover:text-gray-500"
                )} />
            </div>
        </th>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        ACTIVE: "bg-green-50 text-green-700 border-green-200",
        PENDING: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse",
        REJECTED: "bg-red-50 text-red-700 border-red-200",
        SUSPENDED: "bg-gray-100 text-gray-600 border-gray-200"
    };
    const key = status as keyof typeof styles;
    
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-sm", styles[key] || styles.PENDING)}>
            {status}
        </span>
    );
}

function TabButton({ label, count, isActive, onClick, activeColor = "text-black border-black" }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 px-1 whitespace-nowrap",
                isActive ? activeColor : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold",
                    isActive ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

// --- DETAILS DRAWER COMPONENT ---
function DetailsDrawer({ isOpen, onClose, user, formatPrice }: any) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity animate-in fade-in" onClick={onClose} />
            
            {/* Drawer Panel */}
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-gray-200">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md p-0.5 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-xl text-gray-400">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                <Mail className="w-3.5 h-3.5" /> {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <Calendar className="w-3 h-3" /> Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black shadow-sm border border-transparent hover:border-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                    
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm">
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Current Balance</p>
                            <p className="text-2xl font-mono font-bold text-gray-900 mt-1">{formatPrice(user.balance)}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Available for payout</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 shadow-sm">
                            <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Lifetime Earnings</p>
                            <p className="text-2xl font-mono font-bold text-gray-900 mt-1">{formatPrice(user.totalEarnings)}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Total Generated</p>
                        </div>
                    </div>

                    {/* Detailed Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wide">Program Details</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Affiliate Slug</p>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                                    <span className="font-mono text-gray-900 font-bold">/{user.slug}</span>
                                    <Copy className="w-3 h-3 text-gray-400 cursor-pointer hover:text-black" onClick={() => toast.success("Slug copied")} />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Current Rank</p>
                                <p className="font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-500"/> {user.tierName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Group Assignment</p>
                                <p className="font-medium text-gray-900 mt-1">{user.groupName || "Default Group"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Fraud Risk Score</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", user.riskScore > 50 ? 'bg-red-500' : 'bg-green-500')} style={{ width: `${user.riskScore}%` }}></div>
                                    </div>
                                    <span className={cn("text-xs font-bold", user.riskScore > 50 ? "text-red-600" : "text-green-600")}>{user.riskScore}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Notes */}
                    {user.registrationNotes && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wide">Application Note</h3>
                            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100 leading-relaxed relative">
                                <span className="absolute top-2 left-2 text-2xl text-gray-200 font-serif">"</span>
                                {user.registrationNotes}
                                <span className="absolute bottom-[-10px] right-4 text-2xl text-gray-200 font-serif">"</span>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wide">System Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.tags.length > 0 ? user.tags.map((tag: string) => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200 flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-gray-400" /> {tag}
                                </span>
                            )) : (
                                <span className="text-xs text-gray-400 italic">No tags assigned.</span>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                    <button className="flex-1 py-3 border border-gray-300 bg-white rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm text-gray-700 flex items-center justify-center gap-2">
                        <Briefcase className="w-4 h-4" /> Edit Profile
                    </button>
                    <button className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" /> Payout History
                    </button>
                </div>
            </div>
        </div>
    );
}