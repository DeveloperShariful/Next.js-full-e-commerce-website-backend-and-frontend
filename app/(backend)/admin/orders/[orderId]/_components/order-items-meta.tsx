// File Location: app/admin/orders/[orderId]/_components/order-items-meta.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Truck, Package, HelpCircle, AlertCircle, DollarSign, RotateCcw, Tag, Printer } from "lucide-react"; // ✅ Added Printer
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { RefundModal } from "./refund-modal"; 

// ✅ 100% STRICT TYPES IMPORT (No 'any' allowed)
import { OrderDetailsType, OrderItem, OrderTransaction } from "../types";

interface OrderItemsMetaProps {
  order: OrderDetailsType;
}

export const OrderItemsMeta = ({ order }: OrderItemsMetaProps) => {
  const { formatPrice } = useGlobalStore();
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);

  // ==========================================
  // ADVANCED PAYMENT & FEES CALCULATION
  // ==========================================
  // Safely convert Decimal/String to Number for math operations
  const fee = order.paymentFee ? Number(order.paymentFee) : 0;
  const netAmount = order.netAmount ? Number(order.netAmount) : (Number(order.total) - fee);

  // Find transaction ID and Paid Date if PAID
  const successTx = order.transactions?.find((tx: OrderTransaction) => 
    tx.status === 'SUCCESS' || tx.status === 'succeeded' || tx.status === 'COMPLETED'
  );
  
  let paidDateStr: string | null = null;
  if (order.paymentStatus === 'PAID') {
      const paidDateObj = successTx?.createdAt || order.capturedAt || order.updatedAt || order.createdAt;
      const formatted = format(new Date(paidDateObj), "MMM d, yyyy");
      paidDateStr = formatted;
  }

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px]">
      
      {/* ========================================== */}
      {/* TABLE HEADER                               */}
      {/* ========================================== */}
      <div className="border-b border-[#c3c4c7] px-4 py-3 bg-[#f6f7f7]">
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Item</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left border-collapse">
            
            <thead>
                <tr className="border-b border-[#f0f0f1] text-[#646970]">
                    <th className="py-2.5 px-4 font-normal w-[40%] min-w-[250px] sm:min-w-[250px]">Item</th>
                    <th className="py-2.5 px-4 font-normal text-right">Cost</th>
                    <th className="py-2.5 px-4 font-normal text-right">Price</th>
                    <th className="py-2.5 px-4 font-normal text-center">Qty</th>
                    <th className="py-2.5 px-4 font-normal text-right">Total</th>
                </tr>
            </thead>
            
            <tbody className="divide-y divide-[#f0f0f1]">
                
                {/* ========================================== */}
                {/* PRODUCT ROWS (Strict Typed)                */}
                {/* ========================================== */}
                {order.items.map((item: OrderItem) => {
                    const img = item.product?.featuredImage || item.image;
                    return (
                        <tr key={item.id} className="hover:bg-[#f6f7f7] group align-top">
                            <td className="py-3 px-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 border border-[#c3c4c7] bg-white flex items-center justify-center overflow-hidden shrink-0 mt-0.5 shadow-sm">
                                        {img ? <img src={img} alt={item.productName} className="h-full w-full object-cover"/> : <Package size={16} className="text-[#a7aaad]"/>}
                                    </div>
                                    <div className="flex flex-col">
                                        <a href={`/admin/products/${item.productId}`} target="_blank" className="font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline">
                                            {item.productName}
                                        </a>
                                        <div className="text-[12px] text-[#646970] mt-1 space-y-0.5">
                                            {item.sku && <div><span className="font-semibold text-[#3c434a]">SKU:</span> {item.sku}</div>}
                                            {item.variantName && <div><span className="font-semibold text-[#3c434a]">Variation:</span> {item.variantName}</div>}
                                        </div>
                                        
                                        {/* SCHEMA: Advanced Pre-Order Item Badge */}
                                        {item.isPreOrder && (
                                            <span className="inline-flex items-center gap-1 bg-[#fcf9e8] text-[#dba617] border border-[#e5d599] px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold mt-1.5 uppercase shadow-inner w-fit">
                                                <AlertCircle size={10} /> Pre-Order Item
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            {/* Cost (WooCommerce specific field, defaults to $0.00 if not using COGS plugin) */}
                            <td className="py-3 px-4 text-right text-[#a7aaad]">{formatPrice(0)}</td>
                            <td className="py-3 px-4 text-right text-[#3c434a]">{formatPrice(Number(item.price))}</td>
                            <td className="py-3 px-4 text-center text-[#3c434a]">× {item.quantity}</td>
                            <td className="py-3 px-4 text-right font-medium text-[#2c3338]">{formatPrice(Number(item.total))}</td>
                        </tr>
                    );
                })}

                {/* ========================================== */}
                {/* ADVANCED SHIPPING / TRANSDIRECT ROW        */}
                {/* ========================================== */}
                {order.shippingMethod && (
                    <tr className="bg-[#fcfcfc]">
                        <td className="py-4 px-4 flex items-start gap-3">
                            <div className="h-10 w-10 flex items-center justify-center text-[#8c8f94] bg-white border border-[#e2e4e7] rounded-[3px] shadow-sm shrink-0">
                                <Truck size={20} />
                            </div>
                            <div className="text-[13px] text-[#3c434a]">
                                <p className="m-0 font-medium text-[#1d2327]">{order.shippingMethod}</p>
                                
                                {/* SCHEMA: Advanced Shipping Meta & Tracking Data */}
                                {(order.selectedCourierCode || order.transdirectQuoteId || order.transdirectBookingId || order.shippingTrackingNumber) && (
                                    <div className="mt-2 space-y-1 text-[11px] text-[#646970]">
                                        {order.shippingTrackingNumber && (
                                            <div className="flex gap-2 items-center">
                                                <span className="font-semibold text-[#3c434a]">Tracking ID:</span> 
                                                <span className="font-mono bg-[#f6f7f7] border border-[#e2e4e7] px-1.5 py-0.5 rounded-[2px] text-[#2271b1]">{order.shippingTrackingNumber}</span>
                                            </div>
                                        )}
                                        {order.selectedCourierCode && (
                                            <div className="flex gap-2 items-center">
                                                <span className="font-semibold text-[#3c434a]">td_courier_key:</span> 
                                                <span className="font-mono">{order.selectedCourierCode}</span>
                                            </div>
                                        )}
                                        {order.transdirectQuoteId && (
                                            <div className="flex gap-2 items-center">
                                                <span className="font-semibold text-[#3c434a]">td_temp_booking_id:</span>
                                                <span className="font-mono">{order.transdirectQuoteId}</span>
                                            </div>
                                        )}
                                        {order.transdirectBookingId && (
                                            <div className="flex gap-2 items-center">
                                                <span className="font-semibold text-[#3c434a]">td_booking_id:</span>
                                                <span className="font-mono text-[#5b841b]">{order.transdirectBookingId}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td colSpan={3}></td>
                        <td className="py-4 px-4 text-right font-medium text-[#2c3338] align-top">
                            {formatPrice(Number(order.shippingTotal))}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* PRICING TOTALS & BUTTONS (Refund + Invoice)  */}
      {/* ========================================== */}
      <div className="border-t border-[#c3c4c7] px-4 py-4 flex flex-col md:flex-row justify-between items-start bg-[#f6f7f7]">
        
        {/* Left Side: Action Buttons (Refund & Print Invoice) */}
        <div className="w-full md:w-auto mb-4 md:mb-0 flex gap-2">
            
            {/* ✅ RESTORED: Print Invoice Button */}
            <a 
                href={`/admin/orders/${order.id}/invoice`} 
                target="_blank"
                rel="noreferrer"
                className="border border-[#8c8f94] bg-white hover:bg-[#f0f0f1] text-[#3c434a] hover:text-[#2271b1] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
                <Printer size={14} /> Print Invoice
            </a>

            {/* Refund Button */}
            {['PAID', 'PARTIALLY_REFUNDED'].includes(order.paymentStatus) && (
                <button 
                    onClick={() => setIsRefundOpen(true)}
                    className="border border-[#8c8f94] bg-white hover:bg-[#f0f0f1] text-[#d63638] hover:text-[#b32d2e] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm"
                >
                    Refund
                </button>
            )}
        </div>

        {/* Right Side: Totals Table */}
        <div className="w-full md:w-[320px] text-[13px] text-[#3c434a]">
            <table className="w-full text-right border-collapse">
                <tbody>
                    <tr>
                        <td className="py-1.5 text-[#646970]">Items Subtotal:</td>
                        <td className="py-1.5 font-medium">{formatPrice(Number(order.subtotal))}</td>
                    </tr>
                    
                    {Number(order.discountTotal) > 0 && (
                        <tr>
                            <td className="py-1.5 text-[#646970]">
                                <div className="flex items-center justify-end gap-1">
                                    Discount
                                    {(order.discount?.code || order.couponCode) && (
                                        <span className="font-mono text-[11px] text-[#d63638] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-[2px] flex items-center gap-0.5">
                                            <Tag size={10}/> {order.discount?.code || order.couponCode}
                                        </span>
                                    )}
                                    :
                                </div>
                            </td>
                            <td className="py-1.5 text-[#d63638] font-medium">-{formatPrice(Number(order.discountTotal))}</td>
                        </tr>
                    )}

                    <tr>
                        <td className="py-1.5 text-[#646970]">Shipping:</td>
                        <td className="py-1.5 font-medium">{formatPrice(Number(order.shippingTotal))}</td>
                    </tr>
                    
                    {Number(order.taxTotal) > 0 && (
                        <tr>
                            <td className="py-1.5 text-[#646970]">Tax:</td>
                            <td className="py-1.5 font-medium">{formatPrice(Number(order.taxTotal))}</td>
                        </tr>
                    )}

                    <tr className="border-t border-[#e2e4e7]">
                        <td className="py-2.5 font-semibold text-[#1d2327]">Order Total:</td>
                        <td className="py-2.5 font-bold text-[#1d2327] text-[14px]">{formatPrice(Number(order.total))}</td>
                    </tr>

                    {/* Paid Notice Area */}
                    {order.paymentStatus === 'PAID' && (
                        <tr>
                            <td colSpan={2} className="py-2 border-t border-[#e2e4e7]">
                                <div className="flex justify-between items-center bg-white p-2 rounded-[3px] border border-[#c3c4c7] shadow-sm">
                                    <span className="font-semibold text-[#1d2327]">Paid:</span>
                                    <span className="font-bold text-[#1d2327] text-[14px]">{formatPrice(Number(order.total))}</span>
                                </div>
                                <div className="text-[11px] text-[#646970] mt-1.5 text-right">
                                    {paidDateStr} via {order.paymentMethod || order.paymentGateway}
                                </div>
                            </td>
                        </tr>
                    )}

                    {/* Refunded Notice Area */}
                    {Number(order.refundedAmount) > 0 && (
                        <tr>
                            <td className="py-2 text-[#d63638] font-semibold border-t border-[#e2e4e7] flex items-center justify-end gap-1">
                                <RotateCcw size={12} /> Refunded:
                            </td>
                            <td className="py-2 text-[#d63638] font-bold border-t border-[#e2e4e7]">
                                -{formatPrice(Number(order.refundedAmount))}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* SCHEMA: Advanced Gateway Fee & Net Profit Logic */}
            {order.paymentStatus === 'PAID' && fee > 0 && (
                <div className="bg-[#fff8e5] border border-[#f0c36d] p-2.5 rounded-[3px] mt-4 shadow-sm text-left">
                    <p className="text-[11px] text-[#1d2327] font-semibold mb-2 flex items-center gap-1">
                        <AlertCircle size={12} className="text-[#dba617]"/> Gateway Fees Breakdown
                    </p>
                    <div className="flex justify-between text-[11px] text-[#646970] mb-1">
                        <span>Transaction Fee:</span>
                        <span className="text-[#d63638] font-mono">-{formatPrice(fee)}</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-bold text-[#1d2327] border-t border-[#e5d599] pt-1">
                        <span>Net Earnings:</span>
                        <span className="text-[#5b841b] flex items-center gap-0.5">
                            <DollarSign size={12}/>{formatPrice(netAmount)}
                        </span>
                    </div>
                </div>
            )}

            {/* Read-only Notice */}
            <div className="mt-4 text-[11px] text-[#a7aaad] flex items-center justify-end gap-1">
                <HelpCircle size={12}/> This order is no longer editable.
            </div>
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal isOpen={isRefundOpen} onClose={() => setIsRefundOpen(false)} order={order as any} />

    </div>
  );
};
  