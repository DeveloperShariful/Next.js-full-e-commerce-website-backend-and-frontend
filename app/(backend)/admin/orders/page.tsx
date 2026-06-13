// File Location: app/admin/orders/page.tsx

import { db } from "@/lib/prisma"; // 🔥 Prisma Client Imported
import { getOrders } from "@/app/actions/backend/order/get-orders"; 
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
  const searchParams = await props.searchParams;
  
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20; 
  const query = searchParams.query || "";
  const status = searchParams.status || "all";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;
  const paymentMethod = searchParams.paymentMethod;
  
  // 🔥 NEW: Fetch active gateways and map to match headers (Stripe, Paypal etc)
  const dbGateways = await db.paymentGateway.findMany({
    where: { isEnabled: true },
    select: { identifier: true, name: true }
  });

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
    <div className=" max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans">
      
      {/* 🔥 Passing the dynamic gateways array down to the header */}
      <OrdersHeader counts={meta?.counts || {}} gateways={dbGateways} />
      
      <OrderListTable 
        orders={serializedOrders} 
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