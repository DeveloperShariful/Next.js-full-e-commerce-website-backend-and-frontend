// File: app/(backend)/admin/affiliate/_components/Management/kyc-manager.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Search, Eye, CheckCircle, XCircle, FileText,
  Download, X, Loader2, ShieldCheck, Users
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rejectDocumentAction, verifyDocumentAction } from "@/app/actions/backend/affiliate/_services/kyc-service";
import { AffiliateKycDocument } from "@/app/actions/backend/affiliate/types";

interface DocumentWithUser extends AffiliateKycDocument {
  id: string;
  accountId: string;
  docIndex: number;
  affiliate: {
    id: string;
    slug: string;
    kycStatus: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

interface Props {
  initialDocuments: DocumentWithUser[];
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL",      label: "All"      },
  { key: "PENDING",  label: "Pending"  },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function KycManager({ initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [viewingDoc, setViewingDoc]   = useState<DocumentWithUser | null>(null);
  const [filter, setFilter]           = useState<StatusFilter>("PENDING");
  const [search, setSearch]           = useState("");

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter = filter === "ALL" || doc.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      doc.affiliate.user.name?.toLowerCase().includes(q) ||
      doc.affiliate.user.email.toLowerCase().includes(q) ||
      doc.documentNumber?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const countOf = (s: StatusFilter) =>
    s === "ALL" ? documents.length : documents.filter((d) => d.status === s).length;

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20">

      {/* Status tabs — WooCommerce pipe-link style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c3c4c7]">
        <div className="flex flex-wrap items-center gap-0 text-[13px]">
          {STATUS_TABS.map((tab, idx) => (
            <span key={tab.key} className="flex items-center">
              {idx > 0 && <span className="text-[#c3c4c7] px-2">|</span>}
              <button
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-0 py-1",
                  filter === tab.key
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96] hover:underline"
                )}
              >
                {tab.label} ({countOf(tab.key)})
              </button>
            </span>
          ))}
        </div>

        {/* KYC badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00a32a] bg-[#edfaef] border border-[#00a32a]/25 px-2.5 py-1 rounded self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          Identity verification required for payouts
        </div>
      </div>

      {/* Toolbar — WP style */}
      <div className="bg-[#f6f7f7] border border-[#c3c4c7] p-2 flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
          <input
            type="text"
            className="block w-full h-8 pl-8 pr-3 text-[13px] text-[#1d2327] border border-[#c3c4c7] bg-white rounded outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 placeholder:text-[#8c8f94] transition-colors"
            placeholder="Search affiliate or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table — WP widefat style */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c3c4c7]">
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Affiliate</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Document Type</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Doc Number</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Submitted</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Status</th>
                <th className="px-3 py-2 text-[13px] font-semibold text-[#1d2327] bg-[#f6f7f7] text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#646970]">
                      <Users className="w-10 h-10 text-[#c3c4c7]" />
                      <p className="text-[13px] font-medium text-[#1d2327]">No documents found.</p>
                      <p className="text-[12px] text-[#8c8f94]">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className={cn(
                      "border-b border-[#f0f0f1] hover:bg-[#eaecf0] transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                    )}
                  >
                    {/* Affiliate */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <div className="w-8 h-8 rounded bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center shrink-0">
                          {doc.affiliate.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={doc.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-[#8c8f94] text-sm">
                              {doc.affiliate.user.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#2271b1] hover:underline truncate">{doc.affiliate.user.name}</div>
                          <div className="text-[11px] text-[#50575e] truncate">{doc.affiliate.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Document Type */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#50575e] shrink-0" />
                        <span className="capitalize text-[#1d2327]">
                          {doc.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                    </td>

                    {/* Doc Number */}
                    <td className="px-3 py-3 font-mono text-[12px] text-[#50575e]">
                      {doc.documentNumber ? (
                        <span className="bg-[#f0f0f1] border border-[#c3c4c7] px-1.5 py-0.5 rounded text-[11px]">
                          {doc.documentNumber}
                        </span>
                      ) : (
                        <span className="text-[#8c8f94] italic">N/A</span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="px-3 py-3 text-[12px] text-[#50575e]">
                      {doc.verifiedAt
                        ? new Date(doc.verifiedAt).toLocaleDateString()
                        : <span className="italic text-[#8c8f94]">Pending</span>}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
                        doc.status === "APPROVED"
                          ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"
                          : doc.status === "REJECTED"
                          ? "bg-[#fcebec] text-[#d63638] border-[#d63638]/30"
                          : "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30"
                      )}>
                        {doc.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#c3c4c7] text-[#2271b1] hover:bg-[#f0f6fc] hover:border-[#2271b1] text-[12px] font-medium rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="border-t border-[#c3c4c7] px-4 py-3 bg-white">
          <span className="text-[13px] text-[#646970]">
            Showing <span className="font-semibold text-[#1d2327]">{filteredDocs.length}</span> of{" "}
            <span className="font-semibold text-[#1d2327]">{documents.length}</span> documents
          </span>
        </div>
      </div>

      {/* Review Modal */}
      {viewingDoc && (
        <ReviewModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onUpdate={(status: string) => {
            setDocuments((docs) =>
              docs.map((d) => (d.id === viewingDoc.id ? { ...d, status } : d))
            );
            setViewingDoc(null);
          }}
        />
      )}
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  doc,
  onClose,
  onUpdate,
}: {
  doc: DocumentWithUser;
  onClose: () => void;
  onUpdate: (status: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    if (!confirm("Confirm identity verification? This will allow payouts for this user.")) return;
    startTransition(async () => {
      const res = await verifyDocumentAction(doc.accountId, doc.docIndex);
      if (res.success) {
        toast.success(res.message);
        onUpdate("APPROVED");
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleReject = () => {
    const reason = prompt("Please enter the rejection reason (will be emailed to user):");
    if (!reason) return;
    startTransition(async () => {
      const res = await rejectDocumentAction(doc.accountId, doc.docIndex, reason);
      if (res.success) {
        toast.success("Document rejected");
        onUpdate("REJECTED");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 font-sans text-[#1d2327]">
      <div className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f6f7f7] shrink-0">
          <div>
            <h3 className="font-semibold text-[14px] text-[#1d2327] m-0">KYC Document Review</h3>
            <p className="text-[11px] text-[#50575e] font-mono m-0 mt-0.5">ID: {doc.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#50575e] hover:text-[#d63638] hover:bg-[#fcebec] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* Document Preview */}
          <div className="flex-1 bg-[#1d2327] flex items-center justify-center p-4 relative min-h-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.url}
              alt="KYC Document"
              className="max-w-full max-h-full object-contain shadow-2xl border border-[#2c3338]"
            />
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 bg-[#1d2327]/80 hover:bg-black text-white px-3 py-1.5 border border-[#50575e] flex items-center gap-1.5 text-[12px] font-semibold transition-colors rounded"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>

          {/* Side Panel */}
          <div className="w-full md:w-72 lg:w-80 bg-[#f6f7f7] border-t md:border-t-0 md:border-l border-[#c3c4c7] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">

            {/* Affiliate Info */}
            <div>
              <h4 className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wider mb-2">Submitted By</h4>
              <div className="flex items-center gap-2.5 p-3 bg-white border border-[#c3c4c7] rounded">
                <div className="w-10 h-10 rounded bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center shrink-0">
                  {doc.affiliate.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-[#8c8f94]">{doc.affiliate.user.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] text-[#2271b1] truncate">{doc.affiliate.user.name}</div>
                  <div className="text-[11px] text-[#50575e] truncate">{doc.affiliate.user.email}</div>
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="bg-white border border-[#c3c4c7] rounded divide-y divide-[#f0f0f1]">
              <div className="px-3 py-2.5">
                <div className="text-[10px] font-semibold text-[#50575e] uppercase tracking-wider mb-0.5">Document Type</div>
                <div className="font-semibold text-[13px] text-[#1d2327] capitalize">{doc.type.replace(/_/g, " ").toLowerCase()}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[10px] font-semibold text-[#50575e] uppercase tracking-wider mb-0.5">Reference Number</div>
                <div className="font-mono text-[13px] text-[#1d2327]">{doc.documentNumber || "N/A"}</div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[10px] font-semibold text-[#50575e] uppercase tracking-wider mb-0.5">Submission Date</div>
                <div className="text-[13px] text-[#1d2327]">
                  {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleString() : "Unknown"}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-[10px] font-semibold text-[#50575e] uppercase tracking-wider mb-1">Current Status</div>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
                  doc.status === "APPROVED" ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30" :
                  doc.status === "REJECTED" ? "bg-[#fcebec] text-[#d63638] border-[#d63638]/30" :
                  "bg-[#fcf9e8] text-[#9a6700] border-[#dba617]/30"
                )}>
                  {doc.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-2 border-t border-[#c3c4c7]">
              {doc.status === "PENDING" ? (
                <div className="space-y-2">
                  <button
                    onClick={handleVerify}
                    disabled={isPending}
                    className="w-full h-9 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve Document
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="w-full h-9 bg-white border border-[#d63638] text-[#d63638] hover:bg-[#d63638] hover:text-white rounded text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Document
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "p-3 rounded font-semibold border flex flex-col items-center gap-1 text-center",
                  doc.status === "APPROVED"
                    ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"
                    : "bg-[#fcebec] text-[#d63638] border-[#d63638]/30"
                )}>
                  {doc.status === "APPROVED"
                    ? <CheckCircle className="w-5 h-5" />
                    : <XCircle className="w-5 h-5" />}
                  <span className="text-[13px]">Document is {doc.status}</span>
                  {doc.rejectionReason && (
                    <p className="text-[11px] font-normal italic mt-1 border-t border-current/20 pt-1 w-full">
                      Reason: {doc.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
