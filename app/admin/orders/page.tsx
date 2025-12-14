// app/admin/orders/page.tsx

import Link from 'next/link';
import { 
  getOrders, 
  updateOrderStatus, 
  deleteOrder 
} from "@/app/actions/order";
import { 
  Search, Eye, Trash2, ShoppingCart, 
  RefreshCcw, Filter, CheckCircle2, XCircle, Clock, Truck
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';

// Next.js 15 Interface
interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
  }>;
}

// Helpers
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
};

// Status Badge Helper
const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
    SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const icons: any = {
    PENDING: <Clock size={12} />,
    PROCESSING: <RefreshCcw size={12} />,
    SHIPPED: <Truck size={12} />,
    DELIVERED: <CheckCircle2 size={12} />,
    CANCELLED: <XCircle size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {icons[status]} {status}
    </span>
  );
};

export default async function OrdersPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";
  const statusFilter = searchParams.status || "";

  // Data Fetching
  const { data: orders, meta } = await getOrders(page, 20, statusFilter, query);
  
  if (!orders) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" /> Orders
          </h1>
          <Link href="/admin/orders/create" className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
            Add Order
          </Link>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 text-sm font-medium border border-slate-400 rounded bg-white text-slate-700 hover:bg-slate-50">Export CSV</button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-1 text-sm mb-4 text-slate-500 overflow-x-auto pb-2">
         <Link href="/admin/orders" className={`${!statusFilter ? 'font-bold text-black border-b-2 border-black' : 'text-blue-600 hover:text-black'} px-2 pb-1`}>
            All <span className="text-slate-400">({meta?.counts.all})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/orders?status=PENDING" className={`${statusFilter === 'PENDING' ? 'font-bold text-black border-b-2 border-black' : 'text-blue-600 hover:text-black'} px-2 pb-1`}>
            Pending <span className="text-slate-400">({meta?.counts.pending})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/orders?status=PROCESSING" className={`${statusFilter === 'PROCESSING' ? 'font-bold text-black border-b-2 border-black' : 'text-blue-600 hover:text-black'} px-2 pb-1`}>
            Processing <span className="text-slate-400">({meta?.counts.processing})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/orders?status=DELIVERED" className={`${statusFilter === 'DELIVERED' ? 'font-bold text-black border-b-2 border-black' : 'text-blue-600 hover:text-black'} px-2 pb-1`}>
            Completed <span className="text-slate-400">({meta?.counts.completed})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/orders?status=CANCELLED" className={`${statusFilter === 'CANCELLED' ? 'font-bold text-black border-b-2 border-black' : 'text-blue-600 hover:text-black'} px-2 pb-1`}>
            Cancelled <span className="text-slate-400">({meta?.counts.cancelled})</span>
         </Link>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
           <select className="h-9 px-3 border border-slate-300 rounded text-sm bg-white outline-none focus:border-blue-500">
              <option>Bulk Actions</option>
              <option>Mark as Processing</option>
              <option>Mark as Completed</option>
              <option>Move to Trash</option>
           </select>
           <button className="h-9 px-4 border border-slate-300 rounded text-sm bg-slate-50 hover:bg-white text-slate-700 font-medium">Apply</button>
           
           <div className="h-6 w-px bg-slate-300 mx-2"></div>

           <select className="h-9 px-3 border border-slate-300 rounded text-sm bg-white outline-none">
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="month">This Month</option>
           </select>
           <button className="h-9 px-3 border border-slate-300 rounded text-sm bg-white hover:bg-slate-50 flex items-center gap-1">
             <Filter size={14}/> Filter
           </button>
        </div>
        
        <form className="relative group">
           <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500" size={16} />
           <input 
             name="query" 
             defaultValue={query} 
             placeholder="Search orders..." 
             className="h-9 pl-9 pr-4 w-64 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
           />
        </form>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
              <tr>
                <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-slate-400" /></th>
                <th className="p-4">Order</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-center">Items</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-500 flex flex-col items-center justify-center w-full">
                    <ShoppingCart size={48} className="mb-3 opacity-20"/>
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                    
                    {/* Order Number */}
                    <td className="p-4">
                       <Link href={`/admin/orders/${order.id}`} className="font-bold text-blue-600 hover:underline">
                          #{order.orderNumber}
                       </Link>
                       <div className="text-xs text-slate-400 mt-0.5">ID: {order.id.slice(0, 8)}...</div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-600">
                       {formatDate(order.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                       <StatusBadge status={order.status} />
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                       {order.user ? (
                         <div>
                           <div className="font-medium text-slate-700">{order.user.name}</div>
                           <div className="text-xs text-slate-400">{order.user.email}</div>
                         </div>
                       ) : (
                         <span className="text-slate-400 italic">Guest Customer</span>
                       )}
                    </td>

                    {/* Items Count */}
                    <td className="p-4 text-center">
                       <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                         {order._count.items}
                       </span>
                    </td>

                    {/* Total */}
                    <td className="p-4 text-right font-bold text-slate-700">
                       {formatPrice(order.total)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/orders/${order.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition" title="View Order">
                             <Eye size={16} />
                          </Link>
                          {/* Server Action Form for Delete */}
                          <form action={async () => { 'use server'; await deleteOrder(order.id) }}>
                             <button className="p-2 text-red-600 hover:bg-red-50 rounded-md transition" title="Delete Order">
                                <Trash2 size={16} />
                             </button>
                          </form>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 bg-gray-50 flex justify-between items-center text-xs text-slate-500">
           <span>Showing {orders.length} orders</span>
           <div className="flex gap-1">
              <Link 
                 href={`/admin/orders?page=${page > 1 ? page - 1 : 1}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Previous
              </Link>
              <span className="px-3 py-1 border border-slate-300 bg-white rounded font-bold">{page}</span>
              <Link 
                 href={`/admin/orders?page=${page < (meta?.pages || 1) ? page + 1 : (meta?.pages || 1)}`} 
                 className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-100 ${page >= (meta?.pages || 1) ? 'pointer-events-none opacity-50' : ''}`}
              >
                 Next
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}