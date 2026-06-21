// File: app/(backend)/admin/affiliate/_components/Management/finance-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Check, X, FileText, ExternalLink, Loader2, AlertCircle,
  ShieldAlert, ShieldCheck, UserX, ArrowUpRight, ArrowDownLeft,
  ArrowRightLeft, Search, Download, ChevronLeft, ChevronRight,
  CreditCard, ScrollText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { PayoutQueueItem } from "@/app/actions/backend/affiliate/types";
import {
  markAsPaid,
  rejectPayout,
  getInvoiceData,
} from "@/app/actions/backend/affiliate/_services/payout-service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ────────────────────────────────────────────────────────────────────

interface LedgerItem {
  id: string;
  affiliateId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  createdAt: Date | string;
  affiliate: {
    slug: string;
    user: { name: string | null; email: string };
  } | null;
}

interface PayoutsPageData {
  items: PayoutQueueItem[];
  total: number;
  totalPages: number;
}

interface LedgerPageData {
  transactions: LedgerItem[];
  total: number;
  totalPages: number;
}

interface Props {
  payoutsData: PayoutsPageData;
  ledgerData: LedgerPageData;
  currentPage: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FinanceManager({ payoutsData, ledgerData, currentPage }: Props) {
  const [activeTab, setActiveTab] = useState<"payouts" | "ledger">("payouts");

  const pendingCount = payoutsData.items.filter((i) => i.status === "PENDING").length;

  return (
    <div className="w-full space-y-0 animate-in fade-in duration-500 pb-20">

      {/* Sub-tabs — WooCommerce pipe-link style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c3c4c7] mb-4">
        <div className="flex flex-wrap items-center gap-0 text-[13px]">
          <button
            onClick={() => setActiveTab("payouts")}
            className={cn(
              "flex items-center gap-1.5 px-0 py-1",
              activeTab === "payouts"
                ? "font-semibold text-[#1d2327]"
                : "text-[#2271b1] hover:text-[#135e96] hover:underline"
            )}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payout Requests
            {pendingCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-[#d63638] text-white px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <span className="text-[#c3c4c7] px-2">|</span>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "flex items-center gap-1.5 px-0 py-1",
              activeTab === "ledger"
                ? "font-semibold text-[#1d2327]"
                : "text-[#2271b1] hover:text-[#135e96] hover:underline"
            )}
          >
            <ScrollText className="w-3.5 h-3.5" />
            Transaction Ledger ({ledgerData.total})
          </button>
        </div>

        {/* KYC badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2271b1] bg-[#f0f6fc] border border-[#2271b1]/20 px-2.5 py-1 rounded self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          KYC Enforced
        </div>
      </div>

      {activeTab === "payouts" ? (
        <PayoutsTab data={payoutsData.items} totalEntries={payoutsData.total} totalPages={payoutsData.totalPages} currentPage={currentPage} />
      ) : (
        <LedgerTab data={ledgerData.transactions} totalEntries={ledgerData.total} totalPages={ledgerData.totalPages} currentPage={currentPage} />
      )}
    </div>
  );
}

// ── Payouts Tab ───────────────────────────────────────────────────────────────

function PayoutsTab({
  data,
  totalEntries,
  totalPages,
  currentPage,
}: {
  data: PayoutQueueItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "REJECTED">("ALL");
  const { formatPrice, currency } = useGlobalStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePay = (id: string, method: string) => {
    const txnId = prompt(`Enter Transaction ID for ${method} payment:`);
    if (!txnId) return;
    startTransition(async () => {
      try {
        await markAsPaid(id, txnId);
        toast.success("Payout Approved & Processed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to process payout");
      }
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason (User will be refunded):");
    if (!reason) return;
    startTransition(async () => {
      try {
        await rejectPayout(id, reason);
        toast.success("Payout Rejected");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to reject payout");
      }
    });
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      setDownloadingId(id);
      const invoiceData = await getInvoiceData(id);
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("PAYOUT RECEIPT", 14, 20);
      doc.setFontSize(10);
      doc.text(`Ref #: ${invoiceData.invoiceNo}`, 14, 30);
      doc.text(`Date: ${invoiceData.date}`, 14, 35);
      doc.text(invoiceData.storeName, 200, 20, { align: "right" });
      doc.line(14, 40, 200, 40);
      doc.text(`Paid To: ${invoiceData.affiliateName} (${invoiceData.affiliateEmail})`, 14, 50);
      doc.text(`Method: ${invoiceData.method}`, 14, 55);
      autoTable(doc, {
        startY: 65,
        head: [["Description", "Amount"]],
        body: invoiceData.items.map((item: { description: string; amount: number }) => [
          item.description,
          `${currency} ${item.amount.toFixed(2)}`,
        ]),
        theme: "striped",
      });
      doc.text(
        `Total Paid: ${currency} ${invoiceData.amount.toFixed(2)}`,
        140,
        (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      );
      doc.save(`Payout_${invoiceData.invoiceNo}.pdf`);
      toast.success("Invoice downloaded");
    } catch {
      toast.error("Failed to generate invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const statusTabs = ["ALL", "PENDING", "COMPLETED", "REJECTED"] as const;
  const filtered = statusFilter === "ALL" ? data : data.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Status filter pipe links */}
      <div className="flex flex-wrap items-center gap-0 text-[13px] pb-2 border-b border-[#c3c4c7]">
        {statusTabs.map((s, idx) => (
          <span key={s} className="flex items-center">
            {idx > 0 && <span className="text-[#c3c4c7] px-2">|</span>}
            <button
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-0 py-1",
                statusFilter === s
                  ? "font-semibold text-[#1d2327]"
                  : "text-[#2271b1] hover:text-[#135e96] hover:underline"
              )}
            >
              {s === "ALL" ? `All (${totalEntries})` : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c3c4c7]">
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Affiliate</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Amount</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Method</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Risk & KYC</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#646970]">
                      <AlertCircle className="w-8 h-8 text-[#c3c4c7]" />
                      <p className="text-[13px]">No payout requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isHighRisk = (item.riskScore || 0) > 70;
                  const isDeleted = item.affiliateName === "Deleted User";
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-[#f0f0f1] hover:bg-[#eaecf0] transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                      )}
                    >
                      {/* Affiliate */}
                      <td className="px-3 py-3">
                        {isDeleted ? (
                          <div className="flex items-center gap-1.5 text-[#d63638] text-[13px]">
                            <UserX className="w-4 h-4" />
                            <span className="font-semibold">Deleted User</span>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-[#1d2327] text-[13px]">{item.affiliateName}</div>
                            <div className="text-[11px] text-[#50575e]">{item.affiliateEmail}</div>
                          </>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 font-mono font-bold text-[14px] text-[#1d2327]">
                        {formatPrice(item.amount)}
                      </td>

                      {/* Method */}
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-[#f0f0f1] border border-[#c3c4c7] rounded text-[#1d2327] capitalize">
                          {item.method.replace("_", " ").toLowerCase()}
                        </span>
                        {item.method === "PAYPAL" && item.paypalEmail && (
                          <div className="text-[10px] text-[#2271b1] mt-0.5 flex items-center gap-1 truncate max-w-[150px]">
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            {item.paypalEmail}
                          </div>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="px-3 py-3">
                        {isHighRisk ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-[#fcebec] text-[#d63638] border border-[#d63638]/30 px-2 py-0.5 rounded font-semibold">
                            <ShieldAlert className="w-3 h-3" /> Risk: {item.riskScore}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-2 py-0.5 rounded font-semibold">
                            <Check className="w-3 h-3" /> Safe
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
                          item.status === "PENDING" ? "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30" :
                          item.status === "COMPLETED" ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30" :
                          "bg-[#fcebec] text-[#d63638] border-[#d63638]/30"
                        )}>
                          {item.status}
                        </span>
                        <div className="text-[10px] text-[#8c8f94] mt-0.5">
                          {format(new Date(item.requestedAt), "MMM d, h:mm a")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        {item.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleReject(item.id)}
                              disabled={isPending}
                              title="Reject"
                              className="p-1.5 border border-[#c3c4c7] text-[#50575e] hover:text-[#d63638] hover:border-[#d63638]/30 hover:bg-[#fcebec] rounded transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePay(item.id, item.method)}
                              disabled={isPending || isHighRisk || isDeleted}
                              title={isHighRisk ? "Blocked: High Risk" : isDeleted ? "Blocked: User Deleted" : "Approve & Pay"}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Pay
                            </button>
                          </div>
                        ) : item.status === "COMPLETED" ? (
                          <button
                            onClick={() => handleDownloadInvoice(item.id)}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1.5 text-[12px] text-[#2271b1] hover:text-[#135e96] border border-[#c3c4c7] px-2.5 py-1 rounded hover:bg-[#f0f0f1] transition-colors disabled:opacity-50"
                          >
                            {downloadingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Invoice
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#d63638] italic">Declined</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#c3c4c7] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="text-[13px] text-[#646970]">
            Showing <span className="font-semibold text-[#1d2327]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#1d2327]">{totalEntries}</span> requests
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#2271b1] bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-[13px] text-[#646970] px-3">Page {currentPage} of {totalPages}</span>
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
    </div>
  );
}

// ── Ledger Tab ────────────────────────────────────────────────────────────────

function LedgerTab({
  data,
  totalEntries,
  totalPages,
  currentPage,
}: {
  data: LedgerItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}) {
  const { formatPrice } = useGlobalStore();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "AFFILIATE_COMMISSION":
        return { bg: "bg-[#f0f6fc] border-[#2271b1]/30", text: "text-[#2271b1]", icon: ArrowUpRight };
      case "AFFILIATE_PAYOUT":
      case "PAYOUT_DEDUCTION":
        return { bg: "bg-[#fcebec] border-[#d63638]/30", text: "text-[#d63638]", icon: ArrowDownLeft };
      case "ADJUSTMENT":
        return { bg: "bg-[#fcf9e8] border-[#dba617]/30", text: "text-[#9a6700]", icon: ArrowRightLeft };
      default:
        return { bg: "bg-[#f0f0f1] border-[#c3c4c7]", text: "text-[#50575e]", icon: ArrowRightLeft };
    }
  };

  const formatTypeName = (type: string) => {
    if (type === "AFFILIATE_COMMISSION") return "Commission";
    if (type === "AFFILIATE_PAYOUT") return "Payout Sent";
    if (type === "PAYOUT_DEDUCTION") return "Refund Deduction";
    return type.replace(/_/g, " ").toLowerCase();
  };

  const isCredit = (type: string) =>
    type === "AFFILIATE_COMMISSION" || type === "ADJUSTMENT";

  const filteredData = data.filter((item) => {
    if (!item.affiliate) return false;
    const q = searchTerm.toLowerCase();
    return (
      item.affiliate.user.name?.toLowerCase().includes(q) ||
      item.affiliate.slug.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (filteredData.length === 0) return toast.error("No data to export");
    const headers = ["Type", "Affiliate", "Amount", "Before", "After", "Date"];
    const rows = filteredData.map((i) => [
      formatTypeName(i.type),
      i.affiliate?.user.name || "Unknown",
      i.amount,
      i.balanceBefore,
      i.balanceAfter,
      format(new Date(i.createdAt), "yyyy-MM-dd HH:mm"),
    ].join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-[#f6f7f7] border border-[#c3c4c7] p-2 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
          <input
            type="text"
            className="block w-full h-8 pl-8 pr-3 text-[13px] text-[#1d2327] border border-[#c3c4c7] bg-white rounded outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 placeholder:text-[#8c8f94] transition-colors"
            placeholder="Search transaction, affiliate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] rounded transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c3c4c7]">
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Transaction Type</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Affiliate</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right">Amount</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Balance Snapshot</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#646970]">
                      <FileText className="w-8 h-8 text-[#c3c4c7]" />
                      <p className="text-[13px]">No transactions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const style = getTypeStyles(item.type);
                  const Icon = style.icon;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-[#f0f0f1] hover:bg-[#eaecf0] transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                      )}
                    >
                      {/* Type */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("p-1.5 rounded border shrink-0", style.bg, style.text)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#1d2327] capitalize">
                              {formatTypeName(item.type)}
                            </div>
                            <div className="text-[11px] text-[#50575e] max-w-[200px] truncate italic" title={item.description || ""}>
                              {item.description || "System transaction"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Affiliate */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#2271b1] hover:underline cursor-pointer text-[13px]">
                          {item.affiliate?.user?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-[#50575e] font-mono">@{item.affiliate?.slug || "unknown"}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 text-right">
                        <span className={cn("font-mono font-bold text-[14px]", style.text)}>
                          {isCredit(item.type) ? "+" : "-"}{formatPrice(Number(item.amount))}
                        </span>
                      </td>

                      {/* Balance Snapshot */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col text-[11px] text-[#50575e] bg-[#f0f0f1] px-2 py-1.5 rounded border border-[#c3c4c7] w-fit min-w-[140px]">
                          <div className="flex justify-between gap-4">
                            <span>Before:</span>
                            <span className="font-mono">{formatPrice(Number(item.balanceBefore))}</span>
                          </div>
                          <div className="flex justify-between gap-4 font-semibold text-[#1d2327] border-t border-[#c3c4c7]/50 pt-1 mt-0.5">
                            <span>After:</span>
                            <span className="font-mono">{formatPrice(Number(item.balanceAfter))}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-right">
                        <div className="text-[12px] font-medium text-[#1d2327]">
                          {format(new Date(item.createdAt), "yyyy/MM/dd")}
                        </div>
                        <div className="text-[11px] text-[#8c8f94] font-mono">
                          {format(new Date(item.createdAt), "h:mm a")}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#c3c4c7] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="text-[13px] text-[#646970]">
            Showing <span className="font-semibold text-[#1d2327]">{filteredData.length}</span> of{" "}
            <span className="font-semibold text-[#1d2327]">{totalEntries}</span> transactions
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#2271b1] bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-[13px] text-[#646970] px-3">Page {currentPage} of {totalPages}</span>
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
    </div>
  );
}
