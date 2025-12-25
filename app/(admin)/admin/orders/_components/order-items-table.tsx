// File Location: app/admin/orders/_components/order-items-table.tsx

"use client"

import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react"; // 👈 Import Tag icon

const formatMoney = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const OrderItemsTable = ({ order }: { order: any }) => {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{item.productName}</span>
                        <span className="text-xs text-slate-500 mt-0.5">SKU: {item.sku || "N/A"}</span>
                        {item.variantName && (
                            <span className="text-xs text-blue-600 mt-0.5">{item.variantName}</span>
                        )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {formatMoney(item.price, order.currency)}
                  </td>
                  <td className="px-5 py-4 text-center text-slate-600">
                    x{item.quantity}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-900">
                    {formatMoney(item.total, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Totals Summary Footer */}
        <div className="p-5 bg-slate-50/50 border-t border-slate-200 flex flex-col items-end gap-2 text-sm">
            <div className="w-full sm:w-1/2 lg:w-1/3 space-y-2.5">
                <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-medium text-slate-900">{formatMoney(order.shippingTotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium text-slate-900">{formatMoney(order.taxTotal, order.currency)}</span>
                </div>
                
                {/* 👇 COUPON CODE SECTION ADDED HERE */}
                {order.discountTotal > 0 && (
                    <div className="flex justify-between text-red-600 items-center">
                        <span className="flex items-center gap-2">
                            Discount
                            {order.couponCode && (
                                <span className="flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-red-200 uppercase tracking-wide">
                                    <Tag size={10} /> {order.couponCode}
                                </span>
                            )}
                        </span>
                        <span>-{formatMoney(order.discountTotal, order.currency)}</span>
                    </div>
                )}
                
                <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-base">Total</span>
                    <span className="font-bold text-slate-900 text-lg">{formatMoney(order.total, order.currency)}</span>
                </div>
                <div className="text-right text-xs text-slate-400 mt-1">
                    Payment via {order.paymentMethod || "Gateway"}
                </div>
            </div>
        </div>
    </Card>
  )
}