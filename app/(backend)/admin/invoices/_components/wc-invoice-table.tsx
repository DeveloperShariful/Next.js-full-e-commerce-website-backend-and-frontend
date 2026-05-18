// File: app/admin/invoices/_components/wc-invoice-table.tsx

"use client";

import Link from "next/link";
import { InvoiceWithRelations } from "../types";
import { Loader2, Eye, Edit, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WcInvoiceTableProps {
  invoices: InvoiceWithRelations[];
  loading: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
}

export const WcInvoiceTable = ({
  invoices,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
}: WcInvoiceTableProps) => {

  // WooCommerce-style Status Badge Generator
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "AWAITING_PAYMENT":
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Pending</span>;
      case "PROCESSING":
      case "PACKED":
        return <span className="bg-[#c6e1c6] text-[#5b841b] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Processing</span>;
      case "SHIPPED":
        return <span className="bg-[#c8d7e1] text-[#2e4453] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Shipped</span>;
      case "DELIVERED":
        return <span className="bg-[#c6e1c6] text-[#5b841b] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Completed</span>;
      case "CANCELLED":
      case "FAILED":
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Cancelled</span>;
      case "REFUNDED":
        return <span className="bg-[#eaa4a4] text-[#761919] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Refunded</span>;
      default:
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Currency Formatter
  const formatPrice = (amount: number, currency: string = "AUD") => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to extract Name/Address
  const getBillingName = (inv: InvoiceWithRelations) => {
    if (inv.user?.name) return inv.user.name;
    
    // Parse JSON Billing Address if user name is not found
    try {
      const billing: any = typeof inv.billingAddress === 'string' ? JSON.parse(inv.billingAddress) : inv.billingAddress;
      if (billing?.firstName) return `${billing.firstName} ${billing.lastName || ''}`;
    } catch (e) {
      return "Guest";
    }
    return "Guest";
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2271b1] w-8 h-8" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-8 text-center text-[#50575e] text-[13px]">
        No orders found.
      </div>
    );
  }

  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px] text-[#2c3338]">
        <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] font-semibold">
          <tr>
            <th className="w-[40px] pl-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
            </th>
            <th className="py-2 px-3 text-[#2c3338]">Order</th>
            <th className="py-2 px-3 text-[#2c3338]">Date</th>
            <th className="py-2 px-3 text-[#2c3338]">Status</th>
            <th className="py-2 px-3 text-[#2c3338]">Billing</th>
            <th className="py-2 px-3 text-[#2c3338]">Purchased</th>
            <th className="py-2 px-3 text-[#2c3338] text-right pr-4">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f1]">
          {invoices.map((inv) => (
            <tr key={inv.id} className="group hover:bg-[#f6f7f7] transition-colors relative">
              
              {/* Checkbox */}
              <td className="pl-3 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(inv.id)}
                  onChange={(e) => onSelectOne(inv.id, e.target.checked)}
                  className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </td>

              {/* Order Column (Hover Actions here) */}
              <td className="py-3 px-3 align-top">
                <Link
                  href={`/admin/orders/${inv.id}`}
                  className="text-[#2271b1] font-bold hover:text-[#135e96] hover:underline"
                >
                  #{inv.orderNumber} {getBillingName(inv)}
                </Link>
                
                {/* WordPress style Hidden Hover Actions */}
                <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2 text-[#2271b1]">
                  <Link href={`/admin/orders/${inv.id}`} className="hover:text-[#135e96]">View</Link>
                  <span className="text-[#a7aaad]">|</span>
                  <Link href={`/admin/orders/${inv.id}/edit`} className="hover:text-[#135e96]">Edit</Link>
                  <span className="text-[#a7aaad]">|</span>
                  <Link href={`/admin/orders/${inv.id}/invoice`} target="_blank" className="hover:text-[#135e96] flex items-center gap-0.5">
                    <FileText size={12}/> PDF
                  </Link>
                </div>
              </td>

              {/* Date */}
              <td className="py-3 px-3 align-top text-[#50575e]">
                <abbr title={new Date(inv.createdAt).toLocaleString()} className="no-underline cursor-help">
                  {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                </abbr>
              </td>

              {/* Status */}
              <td className="py-3 px-3 align-top">
                {getStatusBadge(inv.status)}
              </td>

              {/* Billing Info */}
              <td className="py-3 px-3 align-top text-[#50575e]">
                {getBillingName(inv)} <br />
                <a href={`mailto:${inv.user?.email || inv.guestEmail}`} className="text-[#2271b1] hover:underline">
                  {inv.user?.email || inv.guestEmail}
                </a>
              </td>

              {/* Purchased Items Info */}
              <td className="py-3 px-3 align-top text-[#50575e]">
                {inv.items.length} item(s)
                {inv.hasPreOrderItems && (
                  <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Pre-order</span>
                )}
              </td>

              {/* Total Price */}
              <td className="py-3 px-3 text-right pr-4 align-top">
                <span className="font-bold text-[#2c3338]">
                  {formatPrice(Number(inv.total), inv.currency)}
                </span>
                {inv.paymentMethod && (
                  <div className="text-[11px] text-[#8c8f94] mt-0.5 capitalize">
                    via {inv.paymentMethod}
                  </div>
                )}
              </td>

            </tr>
          ))}
        </tbody>
        
        {/* Table Footer (Same as header in WordPress) */}
        <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7] font-semibold hidden sm:table-footer-group">
          <tr>
            <th className="w-[40px] pl-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
            </th>
            <th className="py-2 px-3 text-[#2c3338]">Order</th>
            <th className="py-2 px-3 text-[#2c3338]">Date</th>
            <th className="py-2 px-3 text-[#2c3338]">Status</th>
            <th className="py-2 px-3 text-[#2c3338]">Billing</th>
            <th className="py-2 px-3 text-[#2c3338]">Purchased</th>
            <th className="py-2 px-3 text-[#2c3338] text-right pr-4">Total</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};