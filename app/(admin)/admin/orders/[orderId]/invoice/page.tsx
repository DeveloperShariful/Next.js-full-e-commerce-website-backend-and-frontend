// File Location: app/admin/orders/[orderId]/invoice/page.tsx

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { InvoiceActions } from "./_components/invoice-actions"; // 👇 Updated Component

export default async function InvoicePage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;

  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id: params.orderId },
      include: { items: true, user: true }
    }),
    db.storeSettings.findUnique({ where: { id: "settings" } })
  ]);

  if (!order) return notFound();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(amount);
  };

  const billing: any = order.billingAddress || {};
  const storeAddr: any = settings?.storeAddress || {};

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0">
      
      {/* 1. Header Actions (Responsive) */}
      <div className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
           <h1 className="text-xl font-bold text-slate-800">Invoice Preview</h1>
           <p className="text-sm text-slate-500">View and print customer invoice</p>
        </div>
        <InvoiceActions orderId={order.id} />
      </div>

      {/* 2. Invoice Paper (Responsive Wrapper) */}
      <div className="w-full max-w-[210mm] bg-white shadow-lg rounded-sm print:shadow-none print:w-full overflow-hidden">
        
        {/* Scrollable Area for very small screens */}
        <div className="overflow-x-auto">
            <div className="min-w-[600px] md:min-w-full p-8 md:p-12 min-h-[297mm]">
                
                {/* === INVOICE CONTENT START === */}
                
                {/* Logo & Company Info */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-widest">Invoice</h1>
                        <p className="text-slate-500 mt-1 font-medium"># {order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-blue-600">{settings?.storeName || "My Store"}</h2>
                        <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                            {storeAddr.address1 && <p>{storeAddr.address1}</p>}
                            {(storeAddr.city || storeAddr.country) && (
                                <p>{storeAddr.city}{storeAddr.city && storeAddr.country ? ", " : ""}{storeAddr.country}</p>
                            )}
                            {settings?.storePhone && <p>{settings.storePhone}</p>}
                        </div>
                    </div>
                </div>

                {/* Bill To & Details */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                        <p className="font-bold text-slate-800">{billing.firstName} {billing.lastName}</p>
                        <div className="text-sm text-slate-600 mt-1">
                            <p>{billing.address1}</p>
                            <p>{billing.city} {billing.postcode ? `- ${billing.postcode}` : ""}</p>
                            <p>{billing.country}</p>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{order.user?.email || order.guestEmail}</p>
                        <p className="text-sm text-slate-600">{order.user?.phone}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-medium">{format(new Date(order.createdAt), "dd MMM, yyyy")}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500">Payment:</span>
                                <span className="font-medium uppercase">{order.paymentStatus}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500">Method:</span>
                                <span className="font-medium capitalize">{order.paymentGateway || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="text-left py-3 text-sm font-bold uppercase text-slate-600">Item</th>
                            <th className="text-right py-3 text-sm font-bold uppercase text-slate-600">Price</th>
                            <th className="text-center py-3 text-sm font-bold uppercase text-slate-600">Qty</th>
                            <th className="text-right py-3 text-sm font-bold uppercase text-slate-600">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-4">
                                    <p className="font-bold text-sm text-slate-800">{item.productName}</p>
                                    {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                                </td>
                                <td className="py-4 text-right text-sm text-slate-600">{formatMoney(item.price)}</td>
                                <td className="py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                                <td className="py-4 text-right text-sm font-bold text-slate-800">{formatMoney(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end border-t border-slate-200 pt-6">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>{formatMoney(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Shipping</span>
                            <span>{formatMoney(order.shippingTotal)}</span>
                        </div>
                        {order.discountTotal > 0 && (
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Discount</span>
                                <span>-{formatMoney(order.discountTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-3">
                            <span>Total</span>
                            <span>{formatMoney(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 text-sm">Thank you for shopping with {settings?.storeName || "us"}!</p>
                    {settings?.storeEmail && (
                        <p className="text-slate-400 text-xs mt-1">
                            Contact: {settings.storeEmail}
                        </p>
                    )}
                </div>
                
                {/* === INVOICE CONTENT END === */}
            
            </div>
        </div>
      </div>
    </div>
  );
}