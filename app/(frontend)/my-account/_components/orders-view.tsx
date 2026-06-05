// File: app/(frontend)/my-account/_components/orders-view.tsx

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ShoppingBag, Eye, X, Loader2, RefreshCcw, CheckCircle, Package, ArrowUpRight } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { createReturnRequestAction } from "@/app/actions/frontend/my-account/order-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  total: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  orderDate: string | Date;
  status: string;
  paymentStatus: string;
  total: number;
  shippingTrackingNumber?: string | null;
  shippingTrackingUrl?: string | null;
  items: OrderItem[];
  returns: any[];
}

interface Props {
  initialOrders: OrderData[];
}

export default function OrdersView({ initialOrders }: Props) {
  const { formatPrice } = useGlobalStore();
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Return Form States
  const [returnReason, setReturnReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId: string; productName: string; quantity: number }[]>([]);

  const handleReturnRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (selectedItems.length === 0) return toast.error("Please select at least one item to return.");
    if (!returnReason) return toast.error("Please provide a reason for the return.");

    startTransition(async () => {
      const res = await createReturnRequestAction({
        orderId: selectedOrder.id,
        reason: returnReason,
        items: selectedItems,
        images: [] // ✅ FIXED: Added empty array to satisfy strict Zod schema definition
      });

      if (res.success) {
        toast.success(res.message);
        setIsReturnModalOpen(false);
        setSelectedOrder(null);
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  const toggleItemSelection = (item: OrderItem) => {
    const exists = selectedItems.find(i => i.productId === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.id));
    } else {
      setSelectedItems([...selectedItems, { productId: item.id, productName: item.productName, quantity: item.quantity }]);
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* WP List Table Style */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Order</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total</th>
                <th className="px-4 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] bg-white">
              {initialOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#50575e] bg-[#f6f7f7] italic">
                     <ShoppingBag className="w-8 h-8 text-[#c3c4c7] mx-auto mb-2" />
                     No orders found. Spend some credits!
                  </td>
                </tr>
              ) : (
                initialOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f6f7f7] transition-colors group">
                    <td className="px-4 py-3 font-semibold text-[#2271b1] hover:underline cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-[#50575e]">
                      {format(new Date(order.orderDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border", 
                        order.status === "DELIVERED" ? "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30" :
                        order.status === "PROCESSING" ? "bg-[#fcf9e8] text-[#8a6d3b] border-[#f0b849]/30" : "bg-gray-100 text-[#50575e]"
                      )}>
                        {order.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- WP ORDER DETAIL MODAL --- */}
      {selectedOrder && !isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-xl flex flex-col max-h-[85vh] animate-in fade-in">
                <div className="px-4 py-3 border-b border-[#c3c4c7] bg-white flex justify-between items-center">
                    <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Order Details: #{selectedOrder.orderNumber}</h3>
                    <button onClick={() => setSelectedOrder(null)} className="text-[#50575e] hover:text-[#d63638] focus:outline-none"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-4 bg-white overflow-y-auto space-y-4">
                    {/* Items List */}
                    <div className="border border-[#c3c4c7]">
                        <table className="w-full text-left text-[12px] border-collapse">
                            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
                                <tr>
                                    <th className="px-3 py-1.5">Product</th>
                                    <th className="px-3 py-1.5 text-center">Qty</th>
                                    <th className="px-3 py-1.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f0f1]">
                                {selectedOrder.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-[#1d2327]">
                                            <strong>{item.productName}</strong>
                                            {item.variantName && <div className="text-[10px] text-[#50575e]">{item.variantName}</div>}
                                        </td>
                                        <td className="px-3 py-2 text-center">× {item.quantity}</td>
                                        <td className="px-3 py-2 text-right font-mono">{formatPrice(Number(item.total))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4 text-[12px] border-t border-[#f0f0f1] pt-4">
                        <div>
                            <strong>Status:</strong> <span className="capitalize">{selectedOrder.status.toLowerCase()}</span>
                        </div>
                        <div>
                            <strong>Payment:</strong> <span className="capitalize">{selectedOrder.paymentStatus.toLowerCase()}</span>
                        </div>
                    </div>
                </div>

                <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2">
                    {selectedOrder.status === "DELIVERED" && (
                        <button onClick={() => setIsReturnModalOpen(true)} className="px-3 py-1 border border-[#d63638] bg-[#fcf0f1] text-[#d63638] text-[13px] hover:bg-[#d63638] hover:text-white rounded-sm transition-colors">
                            <RefreshCcw className="w-3.5 h-3.5 inline mr-1" /> Request Return
                        </button>
                    )}
                    <button onClick={() => setSelectedOrder(null)} className="px-3 py-1 border border-[#8c8f94] bg-white text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6]">Close</button>
                </div>
            </div>
        </div>
      )}

      {/* --- WP RETURN REQUEST MODAL --- */}
      {isReturnModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95">
                <div className="px-4 py-3 border-b border-[#c3c4c7] bg-white flex justify-between items-center">
                    <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Return Items: #{selectedOrder.orderNumber}</h3>
                    <button onClick={() => { setIsReturnModalOpen(false); setSelectedItems([]); }} className="text-[#50575e] hover:text-[#d63638]"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleReturnRequestSubmit} className="flex-1 overflow-y-auto p-4 bg-white space-y-4">
                    <div>
                        <label className="text-[13px] font-semibold text-[#1d2327] block mb-2">Select Items to Return</label>
                        <div className="space-y-2">
                            {selectedOrder.items.map(item => (
                                <label key={item.id} className="flex items-center gap-3 p-2 border border-[#c3c4c7] bg-[#f6f7f7] rounded-sm cursor-pointer select-none">
                                    <input type="checkbox" onChange={() => toggleItemSelection(item)} className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" />
                                    <span className="text-[13px]">{item.productName} (×{item.quantity})</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Reason for Return</label>
                        <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px]" placeholder="Defect details..." required />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-[#f0f0f1]">
                        <button type="button" onClick={() => { setIsReturnModalOpen(false); setSelectedItems([]); }} className="px-3 py-1 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-3 py-1 border border-[#d63638] bg-[#d63638] text-white text-[13px] rounded-sm hover:bg-red-800 flex items-center gap-1.5">
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />} Submit Return
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}