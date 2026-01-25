//app/admin/orders/print-batch/page.tsx

import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "@/app/(admin)/admin/orders/[orderId]/invoice/_components/print-button"; // ✅ Absolute Path

// 🔥 Helper to serialize Decimal & Date
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.toString && value.constructor.name === 'Decimal') {
      return Number(value);
    }
    return value;
  }));
};

// ✅ Helper for Money Formatting
const formatMoney = (amount: number, currency: string = 'AUD') => {
    try {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currency 
        }).format(amount);
    } catch (e) {
        return `$${amount.toFixed(2)}`;
    }
};

interface PrintBatchPageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function PrintBatchPage(props: PrintBatchPageProps) {
  const searchParams = await props.searchParams;
  const idsString = searchParams.ids;

  // 1. Validate IDs
  if (!idsString) return notFound();
  
  const ids = idsString.split(",").filter(Boolean);
  
  if (ids.length === 0) return notFound();

  // 2. Fetch Data
  const rawOrders = await db.order.findMany({
    where: { id: { in: ids } },
    include: { items: true, user: true }
  });

  const rawSettings = await db.storeSettings.findUnique({ where: { id: "settings" } });

  // 3. Serialize Data
  const orders = serializeData(rawOrders);
  const settings = serializeData(rawSettings);
  const storeAddr: any = settings?.storeAddress || {};

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center print:bg-white print:p-0">
      
      {/* Print Button (Hidden in Print Mode) */}
      <div className="mb-6 print:hidden">
         <PrintButton />
      </div>

      <div className="w-full max-w-[210mm] space-y-12 print:space-y-0">
        {orders.map((order: any, index: number) => {
            const billing: any = order.billingAddress || {};
            
            return (
                <div key={order.id} className={`bg-white shadow-lg p-12 min-h-[297mm] relative print:shadow-none print:break-after-page ${index > 0 ? "mt-10 print:mt-0" : ""}`}>
                    
                    {/* Header */}
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

                    {/* Customer Info */}
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
                            {order.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4">
                                        <p className="font-bold text-sm text-slate-800">{item.productName}</p>
                                        {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                                    </td>
                                    <td className="py-4 text-right text-sm text-slate-600">{formatMoney(item.price, order.currency)}</td>
                                    <td className="py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-sm font-bold text-slate-800">{formatMoney(item.total, order.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end border-t border-slate-200 pt-6">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatMoney(order.subtotal, order.currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Shipping</span>
                                <span>{formatMoney(order.shippingTotal, order.currency)}</span>
                            </div>
                            {order.discountTotal > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Discount</span>
                                    <span>-{formatMoney(order.discountTotal, order.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-3">
                                <span>Total</span>
                                <span>{formatMoney(order.total, order.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-12 left-12 right-12 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm">Thank you for shopping with {settings?.storeName || "us"}!</p>
                        {settings?.storeEmail && (
                            <p className="text-slate-400 text-xs mt-1">
                                Contact: {settings.storeEmail}
                            </p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}