// File Location: app/admin/orders/page.tsx

import { getOrders } from "@/app/actions/admin/order/get-orders"; 
import { OrderListTable } from "./_components/order-list-table";
import { OrdersHeader } from "./_components/header";
import { PaginationControls } from "./_components/pagination-controls"; 

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
    limit?: string; 
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
  }>;
}

export default async function OrdersPage(props: OrdersPageProps) {
  // Next.js 15+ searchParams Promise resolve
  const searchParams = await props.searchParams;
  
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20; 
  const query = searchParams.query || "";
  const status = searchParams.status || "all";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;
  const paymentMethod = searchParams.paymentMethod;
  
  // Fetch data from backend
  const { data: orders, meta } = await getOrders(
    page, 
    limit, 
    status, 
    query, 
    startDate, 
    endDate, 
    paymentMethod
  );

  const serializedOrders = JSON.parse(JSON.stringify(orders || []));

  return (
    // WordPress Classic Admin Background Color (#f0f0f1) and standard typography
    <div className=" max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans">
      
      {/* Header contains Title, Add New, Status Links, Search, and Filters */}
      <OrdersHeader counts={meta?.counts || {}} />
      
      {/* Table contains Bulk Actions and the classic WooCommerce order rows */}
      <OrderListTable 
        orders={serializedOrders} 
        isTrashView={status === 'trash'} 
      />

      {/* Pagination matches WordPress style */}
      {meta && meta.total > 0 && (
        <PaginationControls 
          total={meta.total}
          totalPages={meta.pages}
          currentPage={page}
          perPage={limit}
        />
      )}

    </div>
  );
}