// File Location: app/admin/orders/page.tsx

import { getOrders } from "@/app/actions/order/get-orders"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download } from "lucide-react";
import { OrderListTable } from "./_components/order-list-table";

// Type for Search Params (Next.js 15)
interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
  }>;
}

export default async function OrdersPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";
  const status = searchParams.status || "all";

  // Fetch Data
  const { data: orders, meta } = await getOrders(page, 20, status, query);

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA]">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and fulfill your store orders.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="bg-white">
             <Download size={16} className="mr-2"/> Export
           </Button>
           {/* 👇 FIX: Link changed to plural 'orders' */}
           <Link href="/admin/orders/create">
             <Button className="bg-blue-600 hover:bg-blue-700">
               <Plus size={16} className="mr-2"/> Create Order
             </Button>
           </Link>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
         
         {/* Status Tabs */}
         <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((tab) => (
               <Link 
                 key={tab} 
                 // 👇 FIX: Link changed to plural 'orders'
                 href={`/admin/orders?status=${tab}`}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    status === tab 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-600 hover:bg-slate-100"
                 }`}
               >
                 {tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase()}
                 {tab === 'all' && meta?.counts?.all ? ` (${meta.counts.all})` : ''}
               </Link>
            ))}
         </div>

         {/* Search Bar */}
         <form className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              name="query" 
              placeholder="Search order ID, email..." 
              defaultValue={query}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
            />
         </form>
      </div>

      {/* 3. Orders Table Component */}
      <OrderListTable orders={orders || []} />

      {/* 4. Pagination */}
      {meta && meta.pages > 1 && (
        <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-4">
           <p className="text-sm text-slate-500">
              Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{meta.pages}</span>
           </p>
           <div className="flex gap-2">
              {/* 👇 FIX: Pagination links changed to plural 'orders' */}
              <Link href={`/admin/orders?page=${Math.max(1, page - 1)}&status=${status}&query=${query}`}>
                <Button variant="outline" disabled={page <= 1}>Previous</Button>
              </Link>
              <Link href={`/admin/orders?page=${Math.min(meta.pages, page + 1)}&status=${status}&query=${query}`}>
                <Button variant="outline" disabled={page >= meta.pages}>Next</Button>
              </Link>
           </div>
        </div>
      )}

    </div>
  );
}