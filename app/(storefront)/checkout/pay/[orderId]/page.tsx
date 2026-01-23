// File Location: app/checkout/pay/[orderId]/page.tsx

import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";
import { getActivePaymentMethods } from "@/app/actions/admin/order/create_order/get-payment-methods";
import { PaymentGateways } from "./_components/payment-gateways";

export default async function PublicPaymentPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { items: true }
  });

  if (!order) return notFound();

  const paymentMethods = await getActivePaymentMethods();

  if (order.paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-lg border-green-100">
           <div className="flex justify-center mb-4">
               <CheckCircle2 size={64} className="text-green-500" />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
           <p className="text-slate-600 mb-6">
             Thank you. Your order <span className="font-mono font-bold">#{order.orderNumber}</span> has been paid.
           </p>
           <Link href="/">
             <Button className="w-full">Continue Shopping</Button>
           </Link>
        </Card>
      </div>
    );
  }

  // 🔥 FIX 1: Decimal to Number Conversion Helper
  // Prisma Decimal টাইপকে সেফলি নাম্বারে কনভার্ট করা হচ্ছে
  const formatMoney = (amount: any) => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
         
         <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
                <p className="text-slate-500">Complete your payment for Order #{order.orderNumber}</p>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-medium text-slate-800">{item.productName}</p>
                                <p className="text-slate-500 text-xs">Qty: {item.quantity}</p>
                            </div>
                            {/* 🔥 FIX 2: Pass converted value */}
                            <p className="font-medium">{formatMoney(item.total)}</p>
                        </div>
                    ))}

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal</span>
                            <span>{formatMoney(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Shipping</span>
                            <span>{formatMoney(order.shippingTotal)}</span>
                        </div>
                        
                        {/* 🔥 FIX 3: Safe Decimal comparison */}
                        {Number(order.discountTotal) > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-{formatMoney(order.discountTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                            <span>Total to Pay</span>
                            <span>{formatMoney(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="h-full border-blue-200 shadow-md">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="text-blue-600"/> Payment Method
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    
                    {/* 🔥 FIX 4: Convert amount to number explicitly */}
                    <PaymentGateways 
                        methods={paymentMethods} 
                        amount={Number(order.total)} 
                        currency={order.currency}
                        orderId={order.id}
                    />

                </CardContent>
            </Card>
         </div>

      </div>
    </div>
  );
}