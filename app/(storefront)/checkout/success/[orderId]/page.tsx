// File: app/(storefront)/checkout/success/[orderId]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getOrderSuccess } from "@/app/actions/storefront/checkout/get-order-success";
import { CheckCircle2, ArrowRight, Package, MapPin, Mail, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

// ✅ FIX: Flexible Props to handle both dynamic route and search params
interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
  title: "Order Confirmed - GoBike",
  robots: "noindex",
};

export default async function OrderSuccessPage(props: Props) {
  // ১. অর্ডার আইডি বের করার চেষ্টা (params অথবা searchParams থেকে)
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const orderId = params?.orderId || (searchParams?.orderId as string);

  // ডিবাগিং লগ (Vercel/Terminal এ দেখার জন্য)
  console.log("Success Page Order ID:", orderId);

  if (!orderId) {
    console.error("Missing Order ID, redirecting home...");
    redirect("/");
  }

  const { success, order, error } = await getOrderSuccess(orderId);

  if (!success || !order) {
    console.error("Order fetch failed:", error);
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <p className="text-gray-500 mb-6 max-w-md">
            We couldn't retrieve the order details. It might have been deleted or the ID is incorrect.
        </p>
        <p className="text-xs text-gray-400 font-mono mb-6">ID: {orderId}</p>
        <Button asChild><Link href="/">Return Home</Link></Button>
      </div>
    );
  }

  const customerEmail = order.guestEmail || order.user?.email || "N/A";
  const address = (order.shippingAddress as any) || {};

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 animate-in fade-in duration-500">
      <div className="container max-w-3xl mx-auto space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Thank you for your order!</h1>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Your order <span className="font-bold text-gray-900">#{order.orderNumber}</span> has been placed successfully. 
            We have sent a confirmation email to <span className="font-medium text-gray-900">{customerEmail}</span>.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                Order Details
              </CardTitle>
              <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" />
                {format(new Date(order.createdAt), "MMMM do, yyyy")}
              </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Items List */}
            <div className="divide-y divide-gray-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="relative h-16 w-16 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                    {item.product?.featuredImage ? (
                      <Image 
                        src={item.product.featuredImage} 
                        alt={item.productName} 
                        fill 
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">No Img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.productName}</h4>
                    {item.variantName && <p className="text-sm text-gray-500">Variant: {item.variantName}</p>}
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right font-medium text-gray-900">
                    {formatPrice(item.total)}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Cost Breakdown */}
            <div className="p-6 space-y-3 bg-gray-50/50">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingTotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountTotal)}</span>
                </div>
              )}
              {/* ✅ ADDED: Tax Display */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (GST)</span>
                <span>{formatPrice(order.taxTotal || 0)}</span>
              </div>

              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Shipping Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm h-full">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900 border-b pb-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Shipping Address
              </h3>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-medium text-gray-900 text-base">{address.firstName} {address.lastName}</p>
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>{address.city}, {address.state} {address.postcode}</p>
                <p>{address.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm h-full">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900 border-b pb-2">
                <Mail className="w-4 h-4 text-blue-600" /> Contact Info
              </h3>
              <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                <div>
                    <span className="block text-xs text-gray-400 uppercase font-bold">Email</span>
                    <span className="font-medium text-gray-900">{customerEmail}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase font-bold">Phone</span>
                    <span className="font-medium text-gray-900">{address.phone || "N/A"}</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase font-bold">Payment Method</span>
                    <span className="font-medium text-gray-900 uppercase">{(order.paymentMethod || "N/A").replace(/_/g, " ")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button asChild variant="outline" className="h-12 px-8 border-gray-300 hover:bg-gray-50">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          {order.user && (
            <Button asChild className="h-12 px-8 bg-blue-600 hover:bg-blue-700">
                <Link href="/profile/orders">
                    View My Orders <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}