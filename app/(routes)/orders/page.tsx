// app/(routes)/orders/page.tsx

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function CustomerOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
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
    <div className="container mx-auto px-6 py-12 min-h-screen">
       <h1 className="text-3xl font-bold text-slate-900 mb-8">My Orders</h1>

       {orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
             <Package size={48} className="mx-auto text-slate-300 mb-4"/>
             <h3 className="text-lg font-bold text-slate-600">No orders yet</h3>
             <p className="text-slate-500 mb-6">Start shopping to see your orders here.</p>
             <Link href="/shop" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Browse Products</Link>
          </div>
       ) : (
          <div className="space-y-6">
             {orders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-100 pb-4">
                      <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Order ID</p>
                         <h3 className="text-lg font-bold text-blue-600">#{order.orderNumber}</h3>
                      </div>
                      <div className="text-left md:text-right">
                         <p className="text-xs font-bold text-slate-500 uppercase">Date Placed</p>
                         <p className="text-sm font-medium text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-left md:text-right">
                         <p className="text-xs font-bold text-slate-500 uppercase">Total Amount</p>
                         <p className="text-lg font-bold text-slate-900">{formatPrice(Number(order.total))}</p>
                      </div>
                      <div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                         }`}>
                            {order.status === 'DELIVERED' && <CheckCircle2 size={12}/>}
                            {order.status === 'PENDING' && <Clock size={12}/>}
                            {order.status === 'CANCELLED' && <XCircle size={12}/>}
                            {order.status}
                         </span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">
                         {order._count.items} Items • Payment: <span className="font-medium">{order.paymentStatus}</span>
                      </p>
                      {/* You can add a view details link here if you create a customer order details page */}
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}