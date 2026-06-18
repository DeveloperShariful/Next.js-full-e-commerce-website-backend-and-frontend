// File: app/admin/shipments/_components/wc-shipment-table.tsx

"use client";

import Link from "next/link";
import { ShipmentWithRelations } from "../types";
import { Loader2, ExternalLink, Printer, CloudOff, CloudSnow } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bulkUpdateShipments } from "@/app/actions/backend/shipment/shipment";
import { toast } from "sonner";

interface WcShipmentTableProps {
  shipments: ShipmentWithRelations[];
  loading: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onEditClick: (item: ShipmentWithRelations) => void;
  onRefresh: () => void;
}

export const WcShipmentTable = ({
  shipments,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEditClick,
  onRefresh
}: WcShipmentTableProps) => {

  const getBillingName = (ship: ShipmentWithRelations) => {
    if (ship.order.user?.name) return ship.order.user.name;
    try {
      const billing: any = typeof ship.order.shippingAddress === 'string' 
        ? JSON.parse(ship.order.shippingAddress) : ship.order.shippingAddress;
      if (billing?.firstName) return `${billing.firstName} ${billing.lastName || ''}`;
    } catch (e) { return "Guest"; }
    return "Guest";
  };

  const handleQuickDeliver = async (id: string) => {
    if (!confirm("Mark this as delivered?")) return;
    const res = await bulkUpdateShipments([id], "mark_delivered");
    if (res.success) {
      toast.success("Marked as delivered.");
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2271b1] w-8 h-8" />
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-8 text-center text-[#50575e] text-[13px]">
        No shipments found.
      </div>
    );
  }

  const allSelected = shipments.length > 0 && selectedIds.length === shipments.length;

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
            <th className="py-2 px-3">Order / Customer</th>
            <th className="py-2 px-3">Courier</th>
            <th className="py-2 px-3">Tracking Info</th>
            <th className="py-2 px-3">API Sync</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3 text-right pr-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f1]">
          {shipments.map((ship) => (
            <tr key={ship.id} className="group hover:bg-[#f6f7f7] transition-colors relative">
              
              {/* Checkbox */}
              <td className="pl-3 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(ship.id)}
                  onChange={(e) => onSelectOne(ship.id, e.target.checked)}
                  className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </td>

              {/* Order Info & Hover Actions */}
              <td className="py-3 px-3 align-top">
                <Link href={`/admin/orders/${ship.order.id}`} className="text-[#2271b1] font-bold hover:text-[#135e96] hover:underline">
                  #{ship.order.orderNumber}
                </Link>
                <div className="text-[12px] text-[#50575e] mt-0.5">{getBillingName(ship)}</div>
                
                {/* Hidden Hover Actions */}
                <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2 text-[#2271b1]">
                  <button onClick={() => onEditClick(ship)} className="hover:text-[#135e96]">Edit Tracking</button>
                  
                  {!ship.deliveredDate && (
                    <>
                      <span className="text-[#a7aaad]">|</span>
                      <button onClick={() => handleQuickDeliver(ship.id)} className="text-[#5b841b] hover:underline">Mark Delivered</button>
                    </>
                  )}
                  
                  {ship.labelUrl && (
                    <>
                      <span className="text-[#a7aaad]">|</span>
                      <a href={ship.labelUrl} target="_blank" className="hover:text-[#135e96] flex items-center gap-0.5">
                        <Printer size={12}/> Print Label
                      </a>
                    </>
                  )}
                </div>
              </td>

              {/* Courier Name */}
              <td className="py-3 px-3 align-top text-[#50575e] font-medium">
                {ship.courier || "N/A"}
                <div className="text-[11px] text-[#8c8f94] font-normal">{ship.numberOfParcels} Parcel(s)</div>
              </td>

              {/* Tracking Number */}
              <td className="py-3 px-3 align-top">
                <span className="font-mono text-[#2c3338] bg-[#f0f0f1] px-1.5 py-0.5 rounded text-[12px]">
                  {ship.trackingNumber || "N/A"}
                </span>
                {ship.trackingUrl && (
                  <a href={ship.trackingUrl} target="_blank" className="text-[#2271b1] ml-2 hover:underline inline-flex items-center gap-1">
                     Track <ExternalLink size={12}/>
                  </a>
                )}
                {ship.connote && (
                  <div className="text-[11px] text-[#8c8f94] mt-1">Connote: {ship.connote}</div>
                )}
              </td>

              {/* API Sync (Transdirect) */}
              <td className="py-3 px-3 align-top">
                {ship.syncedToGateway ? (
                   <span className="flex items-center gap-1 text-[11px] text-[#5b841b]" title={`Synced at ${ship.lastSyncedAt}`}>
                      <CloudSnow size={14}/> Synced
                   </span>
                ) : (
                   <span className="flex items-center gap-1 text-[11px] text-[#d63638]" title={ship.syncError || "Not synced"}>
                      <CloudOff size={14}/> Failed
                   </span>
                )}
              </td>

              {/* Delivery Status — live from TransDirect lastTrackingStatus */}
              <td className="py-3 px-3 align-top">
                {(() => {
                  const st = (ship.lastTrackingStatus || "").toLowerCase();
                  if (st === "delivered")
                    return <span className="bg-[#c6e1c6] text-[#5b841b] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Delivered</span>;
                  if (st === "cancelled")
                    return <span className="bg-[#fcf0f1] text-[#d63638] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Cancelled</span>;
                  if (st === "dispatched")
                    return <span className="bg-[#e5f5fa] text-[#0073aa] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Dispatched</span>;
                  if (st === "booked")
                    return <span className="bg-[#edfaef] text-[#00a32a] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Booked</span>;
                  if (st === "pending")
                    return <span className="bg-[#fcf9e8] text-[#996800] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Pending</span>;
                  if (st === "in_transit")
                    return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">In Transit</span>;
                  // fallback — no status fetched yet
                  return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Unknown</span>;
                })()}
              </td>

              {/* Date */}
              <td className="py-3 px-3 text-right pr-4 align-top text-[#50575e]">
                <abbr title={new Date(ship.shippedDate).toLocaleString()} className="no-underline cursor-help">
                  {formatDistanceToNow(new Date(ship.shippedDate), { addSuffix: true })}
                </abbr>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};