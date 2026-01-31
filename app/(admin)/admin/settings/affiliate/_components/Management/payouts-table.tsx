// File: app/(admin)/admin/settings/affiliate/_components/Management/payouts-table.tsx

"use client";

import { useState, useTransition } from "react";
import { PayoutQueueItem } from "@/app/actions/admin/settings/affiliate/types"; 
import { toast } from "sonner";
import { Check, X, FileText, ExternalLink, Loader2, AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { markAsPaid, rejectPayout, getInvoiceData } from "@/app/actions/admin/settings/affiliate/_services/payout-service";
import { cn } from "@/lib/utils";

interface Props {
  data: PayoutQueueItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
}

export default function PayoutsTable({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { formatPrice, currency } = useGlobalStore();

  const handlePay = (id: string, method: string) => {
    const txnId = prompt(`Enter Transaction ID for ${method} payment:`);
    if (!txnId) return;

    startTransition(async () => {
      try {
        const res = await markAsPaid(id, txnId); 
        // Force cast to avoid TS error since ActionResponse is generic
        if ((res as any).success) {
            toast.success("Payout Approved & Processed");
        } else {
            toast.error((res as any).message || "Failed to process payout");
        }
      } catch (e: any) {
        toast.error(e.message || "An unexpected error occurred");
      }
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter rejection reason (User will be refunded):");
    if (!reason) return;

    startTransition(async () => {
      try {
        const res = await rejectPayout(id, reason);
        if ((res as any).success) {
            toast.success("Payout Rejected");
        } else {
            toast.error((res as any).message || "Failed");
        }
      } catch (e: any) {
        toast.error(e.message);
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
            head: [['Description', 'Amount']],
            body: invoiceData.items.map((item: any) => [item.description, `${currency} ${item.amount.toFixed(2)}`]),
            theme: 'striped',
        });

        doc.text(`Total Paid: ${currency} ${invoiceData.amount.toFixed(2)}`, 140, (doc as any).lastAutoTable.finalY + 10);
        doc.save(`Payout_${invoiceData.invoiceNo}.pdf`);
        toast.success("Invoice downloaded");
    } catch (error) {
        toast.error("Failed to generate invoice");
    } finally {
        setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h3 className="font-bold text-gray-900 text-sm">Payout Requests</h3>
                <p className="text-[11px] text-gray-500">Approve pending withdrawals. KYC verification is mandatory.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KYC Enforced</span>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                    <th className="px-4 py-3">Affiliate</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Risk & KYC</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="w-8 h-8 text-gray-200" />
                                <p className="text-xs">No pending payout requests.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    data.map((item) => {
                        const isHighRisk = (item.riskScore || 0) > 70;
                        
                        return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                            <td className="px-4 py-3">
                                <div className="font-bold text-gray-900 text-xs">{item.affiliateName}</div>
                                <div className="text-[10px] text-gray-500">{item.affiliateEmail}</div>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-gray-800 text-sm">
                                {formatPrice(item.amount)}
                            </td>
                            <td className="px-4 py-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 bg-gray-100 rounded border border-gray-200 w-fit capitalize">
                                    {item.method.replace('_', ' ').toLowerCase()}
                                </span>
                                {item.method === 'PAYPAL' && item.paypalEmail && (
                                    <div className="text-[9px] text-blue-600 mt-0.5 flex items-center gap-1 truncate max-w-[150px]">
                                        <ExternalLink className="w-2.5 h-2.5"/> {item.paypalEmail}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {isHighRisk ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-bold">
                                            <ShieldAlert className="w-3 h-3" /> Risk: {item.riskScore}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                                            <Check className="w-3 h-3" /> Safe
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                    item.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                )}>
                                    {item.status}
                                </span>
                                <div className="text-[9px] text-gray-400 mt-0.5">{format(new Date(item.requestedAt), "MMM d, h:mm a")}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                {item.status === 'PENDING' ? (
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleReject(item.id)} 
                                            disabled={isPending} 
                                            className="p-1.5 border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Reject"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handlePay(item.id, item.method)} 
                                            disabled={isPending || isHighRisk} 
                                            className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={isHighRisk ? "Blocked: High Risk" : "Approve & Pay"}
                                        >
                                            {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
                                            Pay
                                        </button>
                                    </div>
                                ) : item.status === 'COMPLETED' ? (
                                    <button 
                                        onClick={() => handleDownloadInvoice(item.id)}
                                        disabled={downloadingId === item.id}
                                        className="text-[10px] font-medium text-gray-600 hover:text-black flex items-center gap-1 ml-auto border px-2.5 py-1.5 rounded hover:bg-gray-50 transition-colors"
                                    >
                                        {downloadingId === item.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileText className="w-3 h-3" />}
                                        Invoice
                                    </button>
                                ) : (
                                    <span className="text-[10px] text-red-400 italic">Declined</span>
                                )}
                            </td>
                        </tr>
                        );
                    })
                )}
                </tbody>
            </table>
        </div>
        </div>
    </div>
  );
}