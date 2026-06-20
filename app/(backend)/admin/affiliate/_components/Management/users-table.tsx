// File: app/(backend)/admin/affiliate/_components/Management/users-table.tsx
"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Search, Download, Users, ShieldAlert, Loader2, MoreVertical, 
  CheckCircle, XCircle, Filter, ChevronLeft, 
  ChevronRight, ArrowUpDown, Tag, CreditCard, Ticket, 
  Copy, ExternalLink, Calendar, Trophy, Mail, 
  AlertTriangle, DollarSign, Briefcase, Eye, X, UserCheck, UserX,
  Percent
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { AffiliateUserTableItem } from "@/app/actions/backend/affiliate/types";
import {
  approveAffiliateAction,
  rejectAffiliateAction,
  bulkStatusAction,
  bulkTagAction,
  updateCommissionAction
} from "@/app/actions/backend/affiliate/_services/account-service";
import { createAdjustmentAction } from "@/app/actions/backend/affiliate/_services/ledger-service";

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
  tags?: { id: string; name: string }[];
  defaultRate?: number | null;
  defaultType?: "PERCENTAGE" | "FIXED";
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
  tags = [],
  defaultRate = 10,
  defaultType = "PERCENTAGE"
}: Props) {
  // --- Core Hooks ---
  const { symbol, formatPrice } = useGlobalStore(); 
  const currencySymbol = symbol || "$"; 
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editingCommissionUser, setEditingCommissionUser] = useState<AffiliateUserTableItem | null>(null);
  const [payingUser, setPayingUser] = useState<AffiliateUserTableItem | null>(null);
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

  const getCommissionDisplay = (user: AffiliateUserTableItem) => {
    if (user.commissionRate !== null && user.commissionRate !== undefined) {
        return { 
            main: user.commissionType === "FIXED" 
                ? `${currencySymbol}${user.commissionRate}` 
                : `${user.commissionRate}%`, 
            sub: "Custom Rate", 
            isDefault: false,
            isCustom: true 
        };
    }
    return {
        main: defaultType === "FIXED" 
            ? `${currencySymbol}${defaultRate}` 
            : `${defaultRate}%`,
        sub: "Global Default",
        isDefault: true
    };
  };

  // ==================================================================================
  // RENDER UI
  // ==================================================================================

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. TOP TABS — WooCommerce pipe-separated text links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c3c4c7]">
        <div className="flex flex-wrap items-center gap-0 text-[13px]">
          <button onClick={() => handleTabChange("ALL")} className={cn("px-0 py-1", activeTab === "ALL" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#135e96] hover:underline")}>
            All ({totalEntries})
          </button>
          <span className="text-[#c3c4c7] px-2">|</span>
          <button onClick={() => handleTabChange("ACTIVE")} className={cn("px-0 py-1", activeTab === "ACTIVE" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#135e96] hover:underline")}>
            Approved{searchParams.get("status") === "ACTIVE" && ` (${totalEntries})`}
          </button>
          <span className="text-[#c3c4c7] px-2">|</span>
          <button onClick={() => handleTabChange("PENDING")} className={cn("px-0 py-1", activeTab === "PENDING" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#135e96] hover:underline")}>
            Pending{searchParams.get("status") === "PENDING" && ` (${totalEntries})`}
          </button>
          <span className="text-[#c3c4c7] px-2">|</span>
          <button onClick={() => handleTabChange("REJECTED")} className={cn("px-0 py-1", activeTab === "REJECTED" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#135e96] hover:underline")}>
            Rejected{searchParams.get("status") === "REJECTED" && ` (${totalEntries})`}
          </button>
        </div>
        <button onClick={handleExportCSV} className="text-[13px] text-[#2271b1] hover:text-[#135e96] flex items-center gap-1.5 px-3 py-1 bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] transition-colors self-start sm:self-auto">
          <Download className="w-3.5 h-3.5" /> Export Report
        </button>
      </div>

      {/* 2. ACTION BAR — WP toolbar style */}
      <div className="bg-[#f6f7f7] border border-[#c3c4c7] p-2 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">

        {/* Left: Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            className={cn(
              "h-8 bg-white border border-[#c3c4c7] text-[#1d2327] text-[13px] rounded px-2 outline-none focus:border-[#2271b1] cursor-pointer hover:border-[#2271b1] transition-colors",
              selectedIds.size === 0 && "opacity-60"
            )}
            value={bulkActionType}
            onChange={(e) => { setBulkActionType(e.target.value); setTargetPayload(""); }}
          >
            <option value="">Bulk Actions ({selectedIds.size})</option>
            <option value="APPROVE">Mark Active</option>
            <option value="REJECT">Reject Selected</option>
            <option value="ADD_TAG">Add Tag</option>
          </select>

          {bulkActionType === "ADD_TAG" && (
            <select className="h-8 bg-white border border-[#c3c4c7] text-[#1d2327] text-[13px] rounded px-2 outline-none focus:border-[#2271b1]" value={targetPayload} onChange={(e) => setTargetPayload(e.target.value)}>
              <option value="">Select Tag...</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}

          <button
            onClick={executeBulkAction}
            disabled={isPending || selectedIds.size === 0 || !bulkActionType}
            className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
          </button>

          {selectedIds.size === 0 && (
            <span className="text-[12px] text-[#646970] italic">Select items to enable actions</span>
          )}
        </div>

        {/* Right: Search */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-[#8c8f94]" />
            </div>
            <input
              type="text"
              className="block w-full h-8 pl-8 pr-3 text-[13px] text-[#1d2327] border border-[#c3c4c7] bg-white rounded outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 transition-colors placeholder:text-[#8c8f94]"
              placeholder="Search affiliate, email, or slug..."
              defaultValue={searchParams.get("search") || ""}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(e.currentTarget.value); }}
            />
          </div>
          <button className="h-8 w-8 bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] transition-colors text-[#646970] flex items-center justify-center" title="Filter Options">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. TABLE — WP/WooCommerce style */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c3c4c7]">
                <th scope="col" className="px-3 py-2 bg-[#f6f7f7] w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#c3c4c7] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <SortableHeader label="Affiliate" field="name" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Commission</th>
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Performance</th>
                <th scope="col" className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap min-w-[160px]">Net Revenue</th>
                <th scope="col" className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Tags & Coupons</th>
                <SortableHeader label="Wallet" field="balance" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} align="right" />
                <th scope="col" className="px-3 py-2 bg-[#f6f7f7] text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#646970]">
                      <Users className="w-10 h-10 text-[#c3c4c7]" />
                      <p className="text-[13px] font-medium text-[#1d2327]">No affiliates found.</p>
                      <p className="text-[12px] text-[#8c8f94]">Try adjusting your filters or search query.</p>
                      <button onClick={() => router.push(pathname)} className="text-[#2271b1] hover:text-[#135e96] text-[13px] hover:underline mt-1">Reset Filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((user, idx) => {
                  const commInfo = getCommissionDisplay(user);
                  return (
                    <tr key={user.id} className={cn(
                      "border-b border-[#f0f0f1] hover:bg-[#eaecf0] transition-colors group",
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                    )}>

                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-[#c3c4c7] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                          checked={selectedIds.has(user.id)}
                          onChange={() => handleSelectOne(user.id)}
                        />
                      </td>

                      {/* Affiliate Identity */}
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2.5 min-w-[180px]">
                          <div className="w-9 h-9 rounded-full bg-[#f0f0f1] border border-[#dcdcde] flex items-center justify-center shrink-0 overflow-hidden">
                            {user.avatar
                              ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                              : <span className="font-bold text-[#646970] text-sm">{user.name.charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className="min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openDetails(user)} className="text-[13px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline truncate text-left">
                                {user.name}
                              </button>
                              {user.riskScore > 50 && (
                                <span title={`High Risk: ${user.riskScore}/100`}>
                                  <ShieldAlert className="w-3.5 h-3.5 text-[#d63638]" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#50575e] truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-mono text-[#646970] bg-[#f0f0f1] px-1.5 py-0.5 rounded border border-[#dcdcde]">#{user.slug}</span>
                              <span className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-0.5",
                                user.tierName === "Default" || !user.tierName
                                  ? "bg-[#f0f0f1] text-[#646970] border-[#dcdcde]"
                                  : "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30"
                              )}>
                                <Trophy className="w-2.5 h-2.5" /> {user.tierName || "Starter"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Commission Rate */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn(
                            "text-[12px] font-semibold px-2 py-0.5 rounded border w-fit",
                            commInfo.isCustom ? "bg-[#f0e6ff] text-[#7928ca] border-[#d8b4fe]"
                              : "bg-[#f0f0f1] text-[#1d2327] border-[#dcdcde]"
                          )}>
                            {commInfo.main}
                          </span>
                          <span className="text-[11px] text-[#8c8f94]">{commInfo.sub}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border",
                          user.status === "ACTIVE" ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30" :
                          user.status === "PENDING" ? "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30" :
                          user.status === "SUSPENDED" ? "bg-[#fcebec] text-[#d63638] border-[#d63638]/30" :
                          "bg-[#f0f0f1] text-[#646970] border-[#dcdcde]"
                        )}>
                          {user.status}
                        </span>
                      </td>

                      {/* Performance */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-[#00a32a]" />
                            <span className="text-[13px] font-semibold text-[#1d2327]">{user.referralCount}</span>
                            <span className="text-[11px] text-[#50575e]">sales</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-[#2271b1]" />
                            <span className="text-[12px] text-[#50575e]">{user.visitCount}</span>
                            <span className="text-[11px] text-[#50575e]">clicks</span>
                          </div>
                        </div>
                      </td>

                      {/* Net Revenue */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1 text-[12px]">
                          <div className="flex justify-between gap-4">
                            <span className="text-[#50575e]">Gross Sales:</span>
                            <span className="text-[#1d2327] font-medium">{formatPrice(user.salesTotal)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[#50575e]">Commission:</span>
                            <span className="text-[#d63638]">({formatPrice(user.commissionTotal)})</span>
                          </div>
                          <div className="border-t border-[#dcdcde] pt-1 flex justify-between gap-4">
                            <span className="text-[#1d2327] font-semibold">Net Profit:</span>
                            <span className="font-semibold text-[#00a32a]">{formatPrice(user.netRevenue)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tags & Coupons */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          {user.coupons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.coupons.slice(0, 1).map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fdf2f8] text-[#c026d3] border border-[#e879f9]/30 text-[11px] font-mono">
                                  <Ticket className="w-2.5 h-2.5" /> {c}
                                </span>
                              ))}
                              {user.coupons.length > 1 && <span className="text-[11px] text-[#646970] bg-[#f0f0f1] px-1.5 rounded border border-[#dcdcde]">+{user.coupons.length - 1}</span>}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8c8f94] italic flex items-center gap-1"><Ticket className="w-3 h-3" /> No coupons</span>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {user.tags.length > 0 ? user.tags.slice(0, 2).map((t, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f0f6fc] text-[#2271b1] border border-[#c8d7e1] text-[11px]">
                                <Tag className="w-2.5 h-2.5" /> {t}
                              </span>
                            )) : (
                              <span className="text-[11px] text-[#8c8f94] italic">No tags</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Wallet */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono font-semibold text-[13px] text-[#1d2327]">{formatPrice(user.balance)}</span>
                          <span className="text-[11px] text-[#50575e]">Lifetime: {formatPrice(user.totalEarnings)}</span>
                        </div>
                      </td>

                      {/* Options dropdown */}
                      <td className="px-3 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button disabled={isPending} className="p-1.5 text-[#646970] hover:text-[#1d2327] hover:bg-[#f0f0f1] rounded transition-colors outline-none">
                              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 border-[#c3c4c7] shadow-lg p-1">
                            <DropdownMenuLabel className="text-[11px] font-semibold text-[#646970] uppercase px-2 py-1">Manage Affiliate</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#dcdcde]" />
                            <DropdownMenuItem onClick={() => openDetails(user)} className="cursor-pointer text-[13px] px-2 py-1.5 rounded text-[#1d2327] hover:bg-[#f0f6fc] hover:text-[#2271b1] focus:bg-[#f0f6fc]">
                              <Eye className="w-3.5 h-3.5 mr-2 text-[#646970]" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingCommissionUser(user)} className="cursor-pointer text-[13px] px-2 py-1.5 rounded text-[#1d2327] hover:bg-[#f0f6fc] hover:text-[#2271b1] focus:bg-[#f0f6fc]">
                              <Percent className="w-3.5 h-3.5 mr-2 text-[#646970]" /> Set Commission Rate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPayingUser(user)} className="cursor-pointer text-[13px] px-2 py-1.5 rounded text-[#1d2327] hover:bg-[#f0f6fc] hover:text-[#2271b1] focus:bg-[#f0f6fc]">
                              <CreditCard className="w-3.5 h-3.5 mr-2 text-[#646970]" /> Pay / Bonus
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#dcdcde]" />
                            {user.status !== "ACTIVE" && (
                              <DropdownMenuItem onClick={() => handleApprove(user.id)} className="cursor-pointer text-[13px] px-2 py-1.5 rounded text-[#00a32a] hover:bg-[#edfaef] focus:bg-[#edfaef]">
                                <UserCheck className="w-3.5 h-3.5 mr-2" /> Approve Account
                              </DropdownMenuItem>
                            )}
                            {user.status !== "REJECTED" && (
                              <DropdownMenuItem onClick={() => handleReject(user.id)} className="cursor-pointer text-[13px] px-2 py-1.5 rounded text-[#d63638] hover:bg-[#fcebec] focus:bg-[#fcebec]">
                                <UserX className="w-3.5 h-3.5 mr-2" /> Reject Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION — WP style */}
        <div className="border-t border-[#c3c4c7] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="text-[13px] text-[#646970]">
            Showing <span className="font-semibold text-[#1d2327]">{data.length}</span> of <span className="font-semibold text-[#1d2327]">{totalEntries}</span> affiliates
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#2271b1] bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-[13px] text-[#646970] px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#2271b1] bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
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

      <CommissionModal 
        isOpen={!!editingCommissionUser}
        onClose={() => setEditingCommissionUser(null)}
        user={editingCommissionUser}
        symbol={currencySymbol}
       />
       <PaymentModal 
        isOpen={!!payingUser}
        onClose={() => setPayingUser(null)}
        user={payingUser}
        symbol={currencySymbol}
        />

    </div>
  );
}

// ==================================================================================
// SUB COMPONENTS
// ==================================================================================

function SortableHeader({ label, field, currentSort, currentDir, onSort, align = 'left' }: any) {
    return (
        <th scope="col" className={cn("px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap cursor-pointer group select-none", align === 'right' && "text-right")}>
            <div className={cn("flex items-center gap-1", align === 'right' && "justify-end")} onClick={() => onSort(field)}>
                {label}
                <ArrowUpDown className={cn(
                    "w-3 h-3 transition-colors",
                    currentSort === field ? "text-[#2271b1]" : "text-[#c3c4c7] group-hover:text-[#50575e]"
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


// --- DETAILS DRAWER COMPONENT ---
function DetailsDrawer({ isOpen, onClose, user, formatPrice }: any) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity animate-in fade-in" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-gray-200">
                
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

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
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

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wide">Program Details</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                            <div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">System ID (UUID)</p>
                              <div 
                                className="flex items-center justify-between gap-2 bg-slate-800 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors group"
                                onClick={() => {
                                navigator.clipboard.writeText(user.id);
                                toast.success("ID Copied to clipboard");
                                 }}
                              >
                              <code className="font-mono text-xs truncate">{user.id}</code>
                             <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                                </div>
                                  <p className="text-[10px] text-gray-400 mt-1">Use this ID when manually assigning coupons or rates.</p>
                                </div>

                                <p className="text-xs text-gray-500 font-medium uppercase mb-1 mt-4">Affiliate Slug</p>
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

function CommissionModal({ isOpen, onClose, user, symbol }: any) {
    const [isPending, startTransition] = useTransition();
    const [rate, setRate] = useState(user?.commissionRate || "");
    const [type, setType] = useState(user?.commissionType || "PERCENTAGE");
    const [useDefault, setUseDefault] = useState(!user?.commissionRate); 

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const finalRate = useDefault ? null : Number(rate);
            const res = await updateCommissionAction(user.id, finalRate, type);
            
            if (res.success) {
                toast.success("Commission updated");
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-900">Set Custom Rate</h3>
                        <p className="text-xs text-gray-500">For {user.name}</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-black"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <input 
                            type="checkbox" 
                            id="useDefault" 
                            checked={useDefault} 
                            onChange={(e) => setUseDefault(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="useDefault" className="text-xs font-bold text-blue-800 cursor-pointer select-none">
                            Use System Default (Tier/Group)
                        </label>
                    </div>

                    {!useDefault && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Commission Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setType("PERCENTAGE")}
                                        className={cn("py-2 text-xs font-bold rounded border", type === "PERCENTAGE" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200")}
                                    >
                                        Percentage (%)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setType("FIXED")}
                                        className={cn("py-2 text-xs font-bold rounded border", type === "FIXED" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200")}
                                    >
                                        Fixed Amount ({symbol})
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Rate Value</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={rate} 
                                        onChange={(e) => setRate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" 
                                        placeholder="e.g. 15"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-400 text-sm font-bold">
                                        {type === "PERCENTAGE" ? "%" : symbol}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isPending} 
                        className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin"/>} Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}

function PaymentModal({ isOpen, onClose, user, symbol }: any) {
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [type, setType] = useState<"BONUS" | "ADJUSTMENT">("BONUS"); // BONUS = Give Money, ADJUSTMENT = Deduct/Pay

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !note) return toast.error("Amount and Note are required");

        startTransition(async () => {
            // ADJUSTMENT acts as a Manual Payout (Debit)
            // BONUS acts as a Reward (Credit)
            const res = await createAdjustmentAction(user.id, Number(amount), note, type);
            
            if (res.success) {
                toast.success(type === "BONUS" ? "Bonus Credited" : "Payment Recorded");
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-900">Manage Balance</h3>
                        <p className="text-xs text-gray-500">Transaction for {user.name}</p>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-black"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Transaction Type Selector */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType("BONUS")}
                            className={cn(
                                "py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2",
                                type === "BONUS" 
                                    ? "bg-white text-green-700 shadow-sm ring-1 ring-black/5" 
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Give Bonus (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("ADJUSTMENT")}
                            className={cn(
                                "py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2",
                                type === "ADJUSTMENT" 
                                    ? "bg-white text-red-700 shadow-sm ring-1 ring-black/5" 
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Manual Pay (-)
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">{symbol}</span>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none font-medium" 
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Description / Note</label>
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none resize-none" 
                            placeholder={type === "BONUS" ? "e.g. Performance Reward" : "e.g. Paid via Cash/External"}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isPending} 
                            className={cn(
                                "w-full py-2.5 rounded-lg text-sm font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100",
                                type === "BONUS" ? "bg-green-600 hover:bg-green-700" : "bg-gray-900 hover:bg-black"
                            )}
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin"/>} 
                            {type === "BONUS" ? "Credit Bonus" : "Record Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}