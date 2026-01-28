// File: app/(admin)/admin/settings/affiliate/_components/payouts-table.tsx

"use client";

import { useState, useTransition } from "react";
import { PayoutQueueItem } from "@/app/actions/admin/settings/affiliates/types";
import { approvePayoutAction, rejectPayoutAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-payouts";
import { getInvoiceData } from "@/app/actions/admin/settings/affiliates/_services/invoice-service";
import { toast } from "sonner";
import { Check, X, FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  data: PayoutQueueItem[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  currentStatus?: string;
}

export default function PayoutsTable({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { formatPrice, currency } = useGlobalStore();

  // --- Actions ---

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

  // --- PDF Generation Logic ---

  const handleDownloadInvoice = async (id: string) => {
    try {
        setDownloadingId(id);
        
        // 1. Fetch Clean Data from Server
        const invoiceData = await getInvoiceData(id);
        
        // 2. Generate PDF Client-Side
        const doc = new jsPDF();
        
        // Brand / Header
        doc.setFontSize(22);
        doc.text("PAYOUT INVOICE", 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Invoice #: ${invoiceData.invoiceNo}`, 14, 30);
        doc.text(`Date: ${invoiceData.date}`, 14, 35);
        doc.text(`Status: ${invoiceData.status}`, 14, 40);

        // Store Info (Right Side)
        doc.setFontSize(12);
        doc.text(invoiceData.storeName, 200, 20, { align: "right" });
        doc.setFontSize(10);
        // If storeAddress exists
        // doc.text("Store Address Here", 200, 26, { align: "right" });

        // Bill To
        doc.line(14, 45, 200, 45);
        doc.setFontSize(12);
        doc.text("Paid To:", 14, 55);
        doc.setFontSize(10);
        doc.text(`Name: ${invoiceData.affiliateName}`, 14, 62);
        doc.text(`Email: ${invoiceData.affiliateEmail}`, 14, 67);
        doc.text(`Method: ${invoiceData.method}`, 14, 72);

        // Table
        autoTable(doc, {
            startY: 80,
            head: [['Description', 'Amount']],
            body: invoiceData.items.map((item: any) => [
                item.description, 
                `${currency} ${item.amount.toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] }, // Black Header
        });

        // Total
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`Total Paid: ${currency} ${invoiceData.amount.toFixed(2)}`, 140, finalY);

        // Footer
        doc.setFontSize(8);
        doc.text("Thank you for your partnership.", 105, 280, { align: "center" });

        // Save
        doc.save(`Payout_${invoiceData.invoiceNo}.pdf`);
        toast.success("Invoice downloaded");

    } catch (error) {
        console.error(error);
        toast.error("Failed to generate invoice");
    } finally {
        setDownloadingId(null);
    }
  };

  // --- CSV Export Logic ---

  const handleExportCSV = () => {
    if (data.length === 0) return toast.error("No data to export");

    const headers = ["ID", "Affiliate Name", "Email", "Amount", "Method", "Status", "Date"];
    const csvContent = data.map(row => [
        row.id,
        `"${row.affiliateName}"`,
        row.affiliateEmail,
        row.amount,
        row.method,
        row.status,
        new Date(row.requestedAt).toISOString()
    ].join(",")).join("\n");

    const blob = new Blob([headers.join(",") + "\n" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payouts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div>
                <h3 className="font-semibold text-gray-800">Payout Requests</h3>
                <p className="text-xs text-gray-500">Process pending withdrawals and download receipts.</p>
            </div>
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Download className="w-4 h-4" /> Export Batch CSV
            </button>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
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
                    <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle className="w-8 h-8 text-gray-200" />
                                <p>No payout requests found.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{item.affiliateName}</div>
                            <div className="text-xs text-gray-500">{item.affiliateEmail}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-800 text-base">
                            {formatPrice(item.amount)}
                        </td>
                        <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded border w-fit capitalize">
                                {item.method.replace('_', ' ').toLowerCase()}
                            </span>
                            {item.method === 'PAYPAL' && (
                                <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3"/> {item.paypalEmail}
                                </div>
                            )}
                            {item.method === 'BANK_TRANSFER' && <div className="text-[10px] text-gray-400 mt-1 underline cursor-pointer">View Details</div>}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                item.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
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
                            {item.status === 'PENDING' ? (
                                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handlePay(item.id, item.method)} 
                                        disabled={isPending} 
                                        className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                                        title="Approve & Pay"
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
                            ) : item.status === 'COMPLETED' ? (
                                <button 
                                    onClick={() => handleDownloadInvoice(item.id)}
                                    disabled={downloadingId === item.id}
                                    className="text-xs text-gray-600 hover:text-black flex items-center gap-1.5 ml-auto border px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
                                >
                                    {downloadingId === item.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileText className="w-3 h-3" />}
                                    Invoice
                                </button>
                            ) : (
                                <span className="text-xs text-red-400 italic">Refunded</span>
                            )}
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
        </div>
    </div>
  );
}