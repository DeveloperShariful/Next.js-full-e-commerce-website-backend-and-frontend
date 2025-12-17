// app/(routes)/orders/page.tsx

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, ShoppingBag } from "lucide-react";
import { OrderStatus } from "@prisma/client";

export default async function CustomerOrdersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Get DB User ID first
  const user = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
    select: { id: true }
  });

  if (!user) return <div>Syncing account...</div>;

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
        items: true,
        _count: { select: { items: true } }
    }
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen max-w-5xl">
       <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-blue-600"/> My Orders
       </h1>

       {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-slate-300"/>
             </div>
             <h3 className="text-xl font-bold text-slate-700">No orders yet</h3>
             <p className="text-slate-500 mb-8 mt-2 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start shopping to fill this page!</p>
             <Link href="/shop" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">
                Start Shopping
             </Link>
          </div>
       ) : (
          <div className="space-y-6">
             {orders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 group">
                   
                   {/* Header */}
                   <div className="bg-slate-50 px-6 py-4 flex flex-wrap gap-4 justify-between items-center border-b border-slate-100">
                      <div className="flex gap-6 text-sm">
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Placed</p>
                            <p className="font-semibold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                            <p className="font-semibold text-slate-700">{formatPrice(Number(order.total))}</p>
                         </div>
                         <div className="hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</p>
                            <p className="font-mono text-slate-500">#{order.orderNumber}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm border ${
                            order.status === OrderStatus.DELIVERED ? 'bg-green-50 text-green-700 border-green-100' :
                            order.status === OrderStatus.CANCELLED ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                         }`}>
                            {order.status === OrderStatus.DELIVERED && <CheckCircle2 size={14}/>}
                            {order.status === OrderStatus.PENDING && <Clock size={14}/>}
                            {order.status === OrderStatus.CANCELLED && <XCircle size={14}/>}
                            {order.status}
                         </span>
                         {/* Optional View Details Button */}
                         {/* <Link href={`/orders/${order.id}`} className="p-2 hover:bg-white rounded-full transition text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-200">
                            <ChevronRight size={18}/>
                         </Link> */}
                      </div>
                   </div>

                   {/* Items Preview */}
                   <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                         <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-700">
                               <span className="font-bold">{order._count.items}</span> items in this order
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="text-sm text-slate-500">
                               Payment: <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>{order.paymentStatus}</span>
                            </div>
                         </div>
                         
                         {/* Product Names (Preview) */}
                         <div className="flex-1 text-right text-sm text-slate-500 truncate max-w-md hidden md:block">
                            {order.items.slice(0, 3).map(i => i.productName).join(", ")} 
                            {order.items.length > 3 && ` +${order.items.length - 3} more`}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}