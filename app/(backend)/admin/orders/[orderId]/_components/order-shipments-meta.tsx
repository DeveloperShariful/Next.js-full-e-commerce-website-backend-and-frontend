// File Location: app/admin/orders/[orderId]/_components/order-shipments-meta.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Package, ExternalLink, FileText, Tag } from "lucide-react";
import { formatTz } from "@/lib/store-time";
import { OrderShipment } from "../types";

interface OrderShipentsMetaProps {
  shipments: OrderShipment[];
  timezone?: string;
}

export const OrderShipmentsMeta = ({ shipments, timezone = "UTC" }: OrderShipentsMetaProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px]">

      <div
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
          <Package size={15} className="text-[#646970]" />
          Shipments
          {shipments.length > 0 && (
            <span className="bg-[#2271b1] text-white text-[11px] font-normal px-1.5 py-0.5 rounded-full">
              {shipments.length}
            </span>
          )}
        </h2>
        <button type="button" className="text-[#646970]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          {shipments.length === 0 ? (
            <p className="text-[13px] text-[#646970] m-0">No shipments have been created for this order yet.</p>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment, index) => (
                <div key={shipment.id} className="border border-[#e2e4e7] rounded-[3px] overflow-hidden">

                  {/* Shipment Header */}
                  <div className="bg-[#f6f7f7] px-3 py-2 border-b border-[#e2e4e7] flex justify-between items-center">
                    <span className="text-[13px] font-semibold text-[#1d2327]">
                      Shipment #{index + 1}
                      {shipment.courierName || shipment.courier ? (
                        <span className="ml-2 font-normal text-[#646970]">
                          via {shipment.courierName || shipment.courier}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[12px] text-[#646970]">
                      {formatTz(new Date(shipment.shippedDate), timezone, "dd MMM yyyy")}
                    </span>
                  </div>

                  {/* Shipment Body */}
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">

                    {shipment.trackingNumber && (
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Tracking Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[#1d2327]">{shipment.trackingNumber}</span>
                          {shipment.trackingUrl && (
                            <a
                              href={shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2271b1] hover:text-[#135e96]"
                              title="Track shipment"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {shipment.connote && (
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Connote</span>
                        <span className="font-mono text-[#1d2327]">{shipment.connote}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[#646970] block text-[12px] mb-0.5">Parcels</span>
                      <span className="text-[#1d2327]">{shipment.numberOfParcels}</span>
                    </div>

                    {shipment.lastTrackingStatus && (
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Last Status</span>
                        <span className="inline-block bg-[#e9f0f8] text-[#2271b1] text-[12px] px-2 py-0.5 rounded-[3px] font-medium">
                          {shipment.lastTrackingStatus}
                        </span>
                      </div>
                    )}

                    {shipment.deliveredDate && (
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Delivered</span>
                        <span className="text-[#5b841b] font-medium">
                          {formatTz(new Date(shipment.deliveredDate), timezone, "dd MMM yyyy")}
                        </span>
                      </div>
                    )}

                    {shipment.manifestId && (
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Manifest ID</span>
                        <span className="font-mono text-[#1d2327]">{shipment.manifestId}</span>
                      </div>
                    )}
                  </div>

                  {/* Download Links */}
                  {(shipment.labelUrl || shipment.invoiceUrl) && (
                    <div className="px-3 py-2 border-t border-[#e2e4e7] bg-[#f6f7f7] flex gap-3">
                      {shipment.labelUrl && (
                        <a
                          href={shipment.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] text-[#2271b1] hover:text-[#135e96] hover:underline"
                        >
                          <Tag size={12} /> Download Label
                        </a>
                      )}
                      {shipment.invoiceUrl && (
                        <a
                          href={shipment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] text-[#2271b1] hover:text-[#135e96] hover:underline"
                        >
                          <FileText size={12} /> Download Invoice
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
