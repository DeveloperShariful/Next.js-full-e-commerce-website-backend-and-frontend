// File Location: app/admin/orders/page.tsx
import { getOrders } from "@/app/actions/admin/order/get-orders"; 
import { OrderListTable } from "./_components/order-list-table";
import { OrdersHeader } from "./_components/header";
import { PaginationControls } from "./_components/pagination-controls"; // ✅ New Import

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
    limit?: string; 
  }>;
}

export default async function OrdersPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;
  
  // ✅ Dynamic Params Handling
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20; 
  const query = searchParams.query || "";
  const status = searchParams.status || "all";
  const { data: orders, meta } = await getOrders(page, limit, status, query);

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA]">
      
      {/* Header */}
      <OrdersHeader counts={meta?.counts || {}} />
      <OrderListTable 
        orders={orders || []} 
        isTrashView={status === 'trash'} 
      />

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