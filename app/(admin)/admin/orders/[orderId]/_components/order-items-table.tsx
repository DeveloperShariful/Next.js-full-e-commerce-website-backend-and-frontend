//app/admin/orders/[orderId]/_components/order-items-table.tsx

"use client"

import { Card } from "@/components/ui/card";
import { Tag, Package, Truck } from "lucide-react"; 
import { useGlobalStore } from "@/app/providers/global-store-provider"; // ✅ Global Import

export const OrderItemsTable = ({ order }: { order: any }) => {
  const { formatPrice } = useGlobalStore(); // ✅ Use Global Formatter

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3 w-[50%]">Product</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item: any) => {
                const productImage = item.product?.featuredImage || item.image;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                              {productImage ? (
                                  <img src={productImage} alt={item.productName} className="h-full w-full object-cover"/>
                              ) : (
                                  <Package className="text-slate-300" size={20} />
                              )}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="font-medium text-slate-900 line-clamp-2" title={item.productName}>
                                {item.productName}
                              </span>
                              <div className="flex flex-wrap gap-2 mt-0.5">
                                <span className="text-xs text-slate-500">SKU: {item.sku || "N/A"}</span>
                                {item.variantName && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                      {item.variantName}
                                    </span>
                                )}
                              </div>
                          </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
                      {formatPrice(item.price)} {/* ✅ Global */}
                    </td>
                    <td className="px-5 py-4 text-center text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">x{item.quantity}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                      {formatPrice(item.total)} {/* ✅ Global */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-5 bg-slate-50/50 border-t border-slate-200 flex flex-col items-end gap-2 text-sm">
            <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 space-y-2.5">
                <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 items-start">
                    <div className="flex flex-col">
                        <span>Shipping</span>
                        {order.shippingMethod && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Truck size={10} /> {order.shippingMethod}
                            </span>
                        )}
                    </div>
                    <span className="font-medium text-slate-900">{formatPrice(order.shippingTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium text-slate-900">{formatPrice(order.taxTotal)}</span>
                </div>
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
                        <span>-{formatPrice(order.discountTotal)}</span>
                    </div>
                )}
                <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-base">Total</span>
                    <span className="font-bold text-slate-900 text-lg">{formatPrice(order.total)}</span>
                </div>
                <div className="text-right text-xs text-slate-400 mt-1">
                    Payment via {order.paymentMethod || "Gateway"}
                </div>
            </div>
        </div>
    </Card>
  )
}