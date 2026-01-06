// File Location: app/admin/orders/[orderId]/_components/payment-fulfillment.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, CreditCard, ExternalLink, PackageCheck, Loader2, Info } from "lucide-react";
import { addTrackingInfo } from "@/app/actions/admin/order/fulfillment"; 
import { useState } from "react";
import { toast } from "sonner";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // ✅ Global Import
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const PaymentFulfillment = ({ order }: { order: any }) => {
  const { formatPrice } = useGlobalStore(); // ✅ Use Global Formatter
  const [loading, setLoading] = useState(false);

  const handleTracking = async (formData: FormData) => {
    setLoading(true);
    const res = await addTrackingInfo(formData);
    if(res.success) toast.success(res.message);
    else toast.error(res.error);
    setLoading(false);
  }

  const fee = order.paymentFee || 0;
  const net = order.netAmount || (order.total - fee);

  return (
    <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                    <CreditCard size={14}/> Payment Information
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
                
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-slate-500">Gateway</span>
                    <Badge variant="secondary" className={`capitalize font-mono ${order.paymentGateway === 'stripe' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {order.paymentGateway || "Offline/COD"}
                    </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-slate-500">Transaction ID</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded select-all">
                            {order.paymentId || "Pending"}
                        </span>
                    </div>
                </div>

                {/* FEE SECTION */}
                {order.paymentStatus === 'PAID' && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Total Paid</span>
                            <span className="font-bold text-slate-700">{formatPrice(order.total)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-red-500 flex items-center gap-1">
                                Gateway Fee
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info size={10}/></TooltipTrigger>
                                        <TooltipContent><p>Exact fee charged by {order.paymentGateway}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                            <span className="text-red-500 font-mono">-{formatPrice(fee)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                            <span className="text-green-700">Net Profit</span>
                            <span className="text-green-700">{formatPrice(net)}</span>
                        </div>
                    </div>
                )}
                
                {order.isAuthorized && !order.isCaptured && (
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 mt-2">
                        <p className="text-xs text-yellow-800 mb-2 font-medium">Funds authorized but not captured.</p>
                        <Button size="sm" className="w-full bg-slate-900 text-white h-8 text-xs">Capture Funds Now</Button>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Fulfillment Card */}
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                    <Truck size={14}/> Fulfillment
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="text-sm mb-5 flex justify-between items-center">
                    <span className="text-slate-500">Delivery Method</span>
                    <span className="font-medium text-slate-900">{order.shippingMethod || "Standard Shipping"}</span>
                </div>
                {order.fulfillmentStatus === 'UNFULFILLED' || order.fulfillmentStatus === 'PARTIALLY_FULFILLED' ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 mb-3 uppercase">Add Tracking Info</p>
                        <form action={handleTracking} className="space-y-3">
                            <input type="hidden" name="orderId" value={order.id} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input name="courier" placeholder="Courier" className="h-8 text-xs bg-white" required/>
                                <Input name="trackingNumber" placeholder="Tracking #" className="h-8 text-xs bg-white" required/>
                            </div>
                            <Input name="trackingUrl" placeholder="Tracking URL (Optional)" className="h-8 text-xs bg-white"/>
                            <Button disabled={loading} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-2">
                                {loading ? <Loader2 size={12} className="animate-spin"/> : <PackageCheck size={14}/>}
                                {loading ? "Saving..." : "Mark as Shipped"}
                            </Button>
                        </form>
                    </div>
                ) : null}
                {order.shipments && order.shipments.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase">Shipment History</p>
                        {order.shipments.map((ship: any) => (
                            <div key={ship.id} className="bg-white p-3 rounded border border-blue-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{ship.courier}</Badge>
                                        <span className="text-xs text-slate-400">{new Date(ship.shippedDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-mono text-blue-600 font-medium mt-1">{ship.trackingNumber}</p>
                                </div>
                                {ship.trackingUrl && <a href={ship.trackingUrl} target="_blank" className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-blue-600"><ExternalLink size={14} /></a>}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}